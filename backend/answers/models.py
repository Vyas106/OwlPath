from django.db import models
from django.conf import settings
from django.contrib.contenttypes.fields import GenericRelation


class Answer(models.Model):
    """Answer model for StackIt platform"""

    question = models.ForeignKey(
        "questions.Question", on_delete=models.CASCADE, related_name="answers"
    )
    author = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="answers",
    )
    body = models.TextField()
    votes = GenericRelation("votes.Vote")
    is_accepted = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "answers"
        ordering = ["-is_accepted", "-created_at"]
        indexes = [
            models.Index(fields=["question", "is_accepted"]),
            models.Index(fields=["author"]),
            models.Index(fields=["created_at"]),
        ]

    def __str__(self):
        return f"Answer to '{self.question.title}' by {self.author.username}"

    @property
    def vote_score(self):
        return self.votes.aggregate(score=models.Sum("value"))["score"] or 0

    @property
    def upvote_count(self):
        return self.votes.filter(value=1).count()

    @property
    def downvote_count(self):
        return self.votes.filter(value=-1).count()

    def save(self, *args, **kwargs):
        # Ensure only one accepted answer per question
        if self.is_accepted:
            Answer.objects.filter(question=self.question, is_accepted=True).exclude(
                pk=self.pk
            ).update(is_accepted=False)
        super().save(*args, **kwargs)
