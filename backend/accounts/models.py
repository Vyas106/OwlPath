from django.contrib.auth.models import AbstractUser
from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from django.core.exceptions import ValidationError
from django.utils import timezone
from django.core.cache import cache
import logging

logger = logging.getLogger(__name__)


class User(AbstractUser):
    """
    Enhanced User model with comprehensive validation and audit capabilities.
    Implements improved database design with proper constraints and indexing.
    """

    ROLE_CHOICES = [
        ("user", "User"),
        ("moderator", "Moderator"),
        ("admin", "Admin"),
    ]

    # Enhanced email field with database-level uniqueness
    email = models.EmailField(unique=True, db_index=True)

    # Role with proper validation
    role = models.CharField(
        max_length=10, choices=ROLE_CHOICES, default="user", db_index=True
    )

    # Profile fields with enhanced validation
    bio = models.TextField(max_length=500, blank=True)
    location = models.CharField(max_length=100, blank=True)
    website = models.URLField(blank=True)
    github_username = models.CharField(max_length=100, blank=True)

    # Reputation with constraints and indexing
    reputation = models.IntegerField(
        default=0, validators=[MinValueValidator(-1000)], db_index=True
    )

    # Enhanced avatar handling
    avatar = models.ImageField(upload_to="avatars/", blank=True, null=True)

    # Verification and status fields
    is_verified = models.BooleanField(default=False, db_index=True)
    is_suspended = models.BooleanField(default=False, db_index=True)
    suspension_reason = models.TextField(blank=True)
    suspended_until = models.DateTimeField(null=True, blank=True)

    # Enhanced timestamp fields with proper indexing
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)
    last_seen = models.DateTimeField(null=True, blank=True, db_index=True)

    # Privacy and preferences
    email_notifications = models.BooleanField(default=True)
    profile_visibility = models.CharField(
        max_length=10,
        choices=[
            ("public", "Public"),
            ("limited", "Limited"),
            ("private", "Private"),
        ],
        default="public",
    )

    # Gamification elements
    badges_earned = models.JSONField(default=list, blank=True)
    total_questions = models.PositiveIntegerField(default=0, db_index=True)
    total_answers = models.PositiveIntegerField(default=0, db_index=True)
    total_votes_cast = models.PositiveIntegerField(default=0)
    acceptance_rate = models.FloatField(
        default=0.0, validators=[MinValueValidator(0.0), MaxValueValidator(100.0)]
    )

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["username"]

    class Meta:
        db_table = "users"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["email"]),
            models.Index(fields=["role", "is_verified"]),
            models.Index(fields=["reputation", "created_at"]),
            models.Index(fields=["is_suspended", "suspended_until"]),
            models.Index(fields=["total_questions", "total_answers"]),
        ]
        constraints = [
            models.CheckConstraint(
                check=models.Q(reputation__gte=-1000), name="reputation_minimum_check"
            ),
            models.CheckConstraint(
                check=models.Q(acceptance_rate__gte=0.0)
                & models.Q(acceptance_rate__lte=100.0),
                name="acceptance_rate_range_check",
            ),
        ]

    def __str__(self):
        return self.username

    def clean(self):
        """Enhanced validation for user data"""
        super().clean()

        # Validate suspension logic
        if self.is_suspended and not self.suspension_reason:
            raise ValidationError(
                "Suspension reason is required when user is suspended."
            )

        # Validate GitHub username format
        if self.github_username:
            import re

            if not re.match(r"^[a-zA-Z0-9-]+$", self.github_username):
                raise ValidationError(
                    "GitHub username can only contain letters, numbers, and hyphens."
                )

    def save(self, *args, **kwargs):
        """Enhanced save method with automatic calculations and cache invalidation"""
        # Update last seen timestamp
        if not self.pk:  # New user
            self.last_seen = timezone.now()

        # Calculate acceptance rate if user has questions
        if self.total_questions > 0:
            accepted_answers = self.questions.filter(
                accepted_answer__isnull=False
            ).count()
            self.acceptance_rate = (accepted_answers / self.total_questions) * 100

        # Invalidate user cache
        cache_key = f"user_{self.pk or 'new'}"
        cache.delete(cache_key)

        super().save(*args, **kwargs)

        # Log significant changes
        if self.pk:
            logger.info(f"User updated: {self.username} (ID: {self.pk})")

    def get_full_name(self):
        """Return full name or username as fallback"""
        return f"{self.first_name} {self.last_name}".strip() or self.username

    def update_last_seen(self):
        """Update last seen timestamp efficiently"""
        self.last_seen = timezone.now()
        self.save(update_fields=["last_seen"])

    def add_badge(self, badge_name, badge_data=None):
        """Add a badge to user's collection"""
        badge_entry = {
            "name": badge_name,
            "earned_at": timezone.now().isoformat(),
            "data": badge_data or {},
        }

        # Avoid duplicate badges
        existing_badges = [b["name"] for b in self.badges_earned]
        if badge_name not in existing_badges:
            self.badges_earned.append(badge_entry)
            self.save(update_fields=["badges_earned"])
            logger.info(f"Badge '{badge_name}' awarded to {self.username}")
            return True
        return False

    def calculate_reputation_level(self):
        """Calculate user's reputation level"""
        if self.reputation < 15:
            return "New Member"
        elif self.reputation < 50:
            return "Contributor"
        elif self.reputation < 200:
            return "Regular"
        elif self.reputation < 500:
            return "Experienced"
        elif self.reputation < 2000:
            return "Expert"
        elif self.reputation < 5000:
            return "Veteran"
        else:
            return "Legend"

    @property
    def is_moderator(self):
        """Check if user has moderation privileges"""
        return self.role in ["moderator", "admin"] and not self.is_suspended

    @property
    def is_admin_user(self):
        """Check if user has admin privileges"""
        return self.role == "admin" and not self.is_suspended

    @property
    def can_vote(self):
        """Check if user can cast votes"""
        return self.reputation >= 15 and not self.is_suspended

    @property
    def can_comment(self):
        """Check if user can comment"""
        return self.reputation >= 50 and not self.is_suspended

    @property
    def can_edit_posts(self):
        """Check if user can edit other users' posts"""
        return self.reputation >= 2000 or self.is_moderator

    @classmethod
    def get_top_users(cls, limit=10, days=30):
        """Get top users by reputation in the last N days"""
        from django.utils import timezone
        from datetime import timedelta

        cutoff_date = timezone.now() - timedelta(days=days)
        return cls.objects.filter(
            created_at__gte=cutoff_date, is_suspended=False
        ).order_by("-reputation")[:limit]
