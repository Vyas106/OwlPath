from django.db import models
from django.conf import settings


class Notification(models.Model):
    """Notification model for real-time updates"""

    NOTIFICATION_TYPES = [
        ("new_answer", "New Answer"),
        ("answer_accepted", "Answer Accepted"),
        ("question_upvoted", "Question Upvoted"),
        ("answer_upvoted", "Answer Upvoted"),
        ("question_downvoted", "Question Downvoted"),
        ("answer_downvoted", "Answer Downvoted"),
    ]

    recipient = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="notifications",
    )
    sender = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="sent_notifications",
        null=True,
        blank=True,
    )
    notification_type = models.CharField(max_length=20, choices=NOTIFICATION_TYPES)
    title = models.CharField(max_length=255)
    message = models.TextField()
    is_read = models.BooleanField(default=False)

    # Related object info (question or answer)
    related_question_id = models.PositiveIntegerField(null=True, blank=True)
    related_answer_id = models.PositiveIntegerField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "notifications"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["recipient", "is_read"]),
            models.Index(fields=["created_at"]),
        ]

    def __str__(self):
        return f"Notification for {self.recipient.username}: {self.title}"

    def mark_as_read(self):
        """Mark notification as read"""
        self.is_read = True
        self.save(update_fields=["is_read"])
