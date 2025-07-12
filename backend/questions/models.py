from django.db import models
from django.conf import settings
from django.utils.text import slugify
from django.urls import reverse
from django.contrib.contenttypes.fields import GenericRelation
from django.core.validators import MinLengthValidator, MaxLengthValidator
from django.core.exceptions import ValidationError
from django.utils import timezone
from django.core.cache import cache
from django.db import transaction
from tags.models import Tag
import logging

logger = logging.getLogger(__name__)


class QuestionQuerySet(models.QuerySet):
    """Custom queryset for enhanced question filtering and performance"""

    def with_stats(self):
        """Annotate questions with computed statistics"""
        return self.annotate(
            answer_count=models.Count("answers"),
            vote_score=models.Sum("votes__value"),
            upvote_count=models.Count("votes", filter=models.Q(votes__value=1)),
            downvote_count=models.Count("votes", filter=models.Q(votes__value=-1)),
            recent_activity=models.Max("answers__created_at"),
        )

    def answered(self):
        """Filter questions that have answers"""
        return self.filter(is_answered=True)

    def unanswered(self):
        """Filter questions without answers"""
        return self.filter(is_answered=False)

    def popular(self, days=7):
        """Filter popular questions based on views and votes"""
        from datetime import timedelta

        cutoff = timezone.now() - timedelta(days=days)
        return self.filter(created_at__gte=cutoff).order_by("-views", "-votes__value")


class QuestionManager(models.Manager):
    """Custom manager with enhanced query methods"""

    def get_queryset(self):
        return QuestionQuerySet(self.model, using=self._db)

    def with_stats(self):
        return self.get_queryset().with_stats()

    def trending(self, limit=10):
        """Get trending questions based on recent activity"""
        return (
            self.with_stats()
            .filter(created_at__gte=timezone.now() - timezone.timedelta(days=3))
            .order_by("-vote_score", "-views")[:limit]
        )


class Question(models.Model):
    """
    Enhanced Question model with comprehensive validation, indexing, and real-time features.
    Implements improved database design with proper constraints and performance optimization.
    """

    # Enhanced title field with validation
    title = models.CharField(
        max_length=300,
        validators=[
            MinLengthValidator(10, "Question title must be at least 10 characters."),
            MaxLengthValidator(300, "Question title cannot exceed 300 characters."),
        ],
        db_index=True,
    )

    # Auto-generated slug with uniqueness handling
    slug = models.SlugField(max_length=300, unique=True, blank=True, db_index=True)

    # Enhanced body field with validation
    body = models.TextField(
        validators=[
            MinLengthValidator(20, "Question body must be at least 20 characters.")
        ]
    )

    # Author relationship with proper indexing
    author = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="questions",
        db_index=True,
    )

    # Enhanced tag relationship
    tags = models.ManyToManyField(
        Tag,
        related_name="questions",
        blank=True,
        through="QuestionTag",  # Custom through model for additional data
    )

    # Generic relation for votes
    votes = GenericRelation("votes.Vote")

    # Enhanced view tracking
    views = models.PositiveIntegerField(default=0, db_index=True)
    unique_views = models.PositiveIntegerField(default=0)  # Track unique viewers

    # Question status fields
    is_answered = models.BooleanField(default=False, db_index=True)
    is_closed = models.BooleanField(default=False, db_index=True)
    is_pinned = models.BooleanField(default=False, db_index=True)
    is_featured = models.BooleanField(default=False, db_index=True)

    # Close reason for moderation
    close_reason = models.CharField(
        max_length=50,
        choices=[
            ("duplicate", "Duplicate"),
            ("off_topic", "Off Topic"),
            ("unclear", "Unclear"),
            ("too_broad", "Too Broad"),
            ("opinion_based", "Opinion Based"),
            ("spam", "Spam"),
        ],
        blank=True,
    )

    # Accepted answer with proper constraints
    accepted_answer = models.OneToOneField(
        "answers.Answer",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="accepted_for_question",
    )

    # Bounty system
    bounty_amount = models.PositiveIntegerField(default=0, db_index=True)
    bounty_expires_at = models.DateTimeField(null=True, blank=True)

    # Difficulty level for better categorization
    difficulty_level = models.CharField(
        max_length=12,
        choices=[
            ("beginner", "Beginner"),
            ("intermediate", "Intermediate"),
            ("advanced", "Advanced"),
            ("expert", "Expert"),
        ],
        default="intermediate",
        db_index=True,
    )

    # Quality score for ranking
    quality_score = models.FloatField(default=0.0, db_index=True)

    # Enhanced timestamp fields
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True, db_index=True)
    last_activity_at = models.DateTimeField(auto_now_add=True, db_index=True)

    # Search optimization
    search_vector = models.TextField(blank=True)  # For full-text search

    objects = QuestionManager()

    class Meta:
        db_table = "questions"
        ordering = ["-last_activity_at"]
        indexes = [
            models.Index(fields=["created_at", "is_answered"]),
            models.Index(fields=["views", "quality_score"]),
            models.Index(fields=["author", "created_at"]),
            models.Index(fields=["is_closed", "is_answered"]),
            models.Index(fields=["bounty_amount", "bounty_expires_at"]),
            models.Index(fields=["difficulty_level", "quality_score"]),
            models.Index(fields=["last_activity_at", "is_pinned"]),
        ]
        constraints = [
            models.CheckConstraint(
                check=models.Q(views__gte=0), name="views_non_negative"
            ),
            models.CheckConstraint(
                check=models.Q(bounty_amount__gte=0), name="bounty_non_negative"
            ),
            models.CheckConstraint(
                check=models.Q(quality_score__gte=0.0)
                & models.Q(quality_score__lte=10.0),
                name="quality_score_range",
            ),
        ]

    def clean(self):
        """Enhanced validation for question data"""
        super().clean()

        # Validate close reason
        if self.is_closed and not self.close_reason:
            raise ValidationError("Close reason is required for closed questions.")

        # Validate bounty expiration
        if self.bounty_amount > 0 and not self.bounty_expires_at:
            raise ValidationError(
                "Bounty expiration date is required when bounty is set."
            )

        # Validate title uniqueness for same author
        if (
            Question.objects.filter(author=self.author, title__iexact=self.title)
            .exclude(pk=self.pk)
            .exists()
        ):
            raise ValidationError("You have already asked a question with this title.")

    def save(self, *args, **kwargs):
        """Enhanced save method with automatic processing"""
        is_new = not self.pk

        # Generate unique slug
        if not self.slug:
            self.slug = self.generate_unique_slug()

        # Update search vector for full-text search
        self.update_search_vector()

        # Calculate quality score
        self.calculate_quality_score()

        # Update last activity timestamp
        self.last_activity_at = timezone.now()

        # Transaction to ensure data consistency
        with transaction.atomic():
            super().save(*args, **kwargs)

            if is_new:
                # Update author's question count
                self.author.total_questions += 1
                self.author.save(update_fields=["total_questions"])

                # Log question creation
                logger.info(
                    f"New question created: '{self.title}' by {self.author.username}"
                )

        # Invalidate relevant caches
        self.invalidate_caches()

    def generate_unique_slug(self):
        """Generate a unique slug for the question"""
        base_slug = slugify(self.title)
        slug = base_slug
        counter = 1

        while Question.objects.filter(slug=slug).exclude(pk=self.pk).exists():
            slug = f"{base_slug}-{counter}"
            counter += 1

        return slug

    def update_search_vector(self):
        """Update search vector for full-text search"""
        search_content = f"{self.title} {self.body}"
        # Add tag names to search content
        if self.pk:
            tag_names = " ".join(self.tags.values_list("name", flat=True))
            search_content += f" {tag_names}"

        self.search_vector = search_content.lower()

    def calculate_quality_score(self):
        """Calculate quality score based on various factors"""
        score = 5.0  # Base score

        # Title quality (length and clarity)
        title_length = len(self.title)
        if 20 <= title_length <= 100:
            score += 1.0
        elif title_length < 20:
            score -= 0.5

        # Body quality (length and detail)
        body_length = len(self.body)
        if body_length >= 100:
            score += 1.0
        if body_length >= 500:
            score += 0.5

        # Code formatting (if body contains code blocks)
        if "```" in self.body or "`" in self.body:
            score += 0.5

        # Ensure score is within bounds
        self.quality_score = max(0.0, min(10.0, score))

    def increment_views(self, user=None, ip_address=None):
        """Increment view count with uniqueness tracking"""
        from core.models import QuestionView

        # Track unique views if user or IP provided
        if user or ip_address:
            view_obj, created = QuestionView.objects.get_or_create(
                question=self,
                viewer=user,
                ip_address=ip_address,
                defaults={"user_agent": ""},
            )

            if created:
                self.unique_views += 1

        # Always increment total views
        self.views += 1
        self.save(update_fields=["views", "unique_views"])

    def accept_answer(self, answer, user):
        """Accept an answer with proper validation"""
        from core.utils import BusinessRuleValidator

        # Validate user can accept answer
        BusinessRuleValidator.validate_answer_acceptance(answer, user)

        with transaction.atomic():
            # Remove previous accepted answer
            if self.accepted_answer:
                self.accepted_answer.is_accepted = False
                self.accepted_answer.save(update_fields=["is_accepted"])

            # Set new accepted answer
            answer.is_accepted = True
            answer.save(update_fields=["is_accepted"])

            self.accepted_answer = answer
            self.is_answered = True
            self.save(update_fields=["accepted_answer", "is_answered"])

            # Award reputation to answer author
            from core.models import ReputationTransaction

            ReputationTransaction.objects.create(
                user=answer.author,
                transaction_type="answer_accepted",
                amount=15,
                description=f"Answer accepted for question: {self.title}",
                content_type_id=answer._meta.pk.to_python(answer.pk),
                object_id=answer.pk,
            )

    def invalidate_caches(self):
        """Invalidate related caches"""
        cache_keys = [
            f"question_{self.pk}",
            f"question_slug_{self.slug}",
            f"author_questions_{self.author.pk}",
            "trending_questions",
            "popular_questions",
        ]

        cache.delete_many(cache_keys)

    def __str__(self):
        return self.title

    def get_absolute_url(self):
        return reverse("question-detail", kwargs={"slug": self.slug})

    @property
    def answer_count(self):
        """Get cached answer count"""
        cache_key = f"question_{self.pk}_answer_count"
        count = cache.get(cache_key)

        if count is None:
            count = self.answers.count()
            cache.set(cache_key, count, 300)  # Cache for 5 minutes

        return count

    @property
    def vote_score(self):
        """Get cached vote score"""
        cache_key = f"question_{self.pk}_vote_score"
        score = cache.get(cache_key)

        if score is None:
            score = self.votes.aggregate(score=models.Sum("value"))["score"] or 0
            cache.set(cache_key, score, 300)

        return score

    @property
    def upvote_count(self):
        """Get cached upvote count"""
        return self.votes.filter(value=1).count()

    @property
    def downvote_count(self):
        """Get cached downvote count"""
        return self.votes.filter(value=-1).count()

    @property
    def is_trending(self):
        """Check if question is trending"""
        recent_activity = timezone.now() - timezone.timedelta(hours=24)
        return (
            self.created_at >= recent_activity
            and self.vote_score > 2
            and self.views > 10
        )

    @classmethod
    def get_trending(cls, limit=10):
        """Get trending questions"""
        cache_key = "trending_questions"
        questions = cache.get(cache_key)

        if questions is None:
            questions = list(cls.objects.trending(limit))
            cache.set(cache_key, questions, 300)

        return questions


class QuestionTag(models.Model):
    """
    Through model for Question-Tag relationship with additional metadata.
    Improves database design with enhanced many-to-many relationships.
    """

    question = models.ForeignKey(Question, on_delete=models.CASCADE)
    tag = models.ForeignKey(Tag, on_delete=models.CASCADE)
    added_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True
    )
    added_at = models.DateTimeField(auto_now_add=True)

    # Relevance score for tag-question relationship
    relevance_score = models.FloatField(default=1.0)

    class Meta:
        db_table = "question_tags"
        unique_together = ["question", "tag"]
        indexes = [
            models.Index(fields=["question", "relevance_score"]),
            models.Index(fields=["tag", "added_at"]),
        ]
