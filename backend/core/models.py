"""
Enhanced models with improved database design and real-time capabilities.
These models implement comprehensive audit trails, business rule validation,
and real-time synchronization features.
"""

from django.db import models
from django.contrib.contenttypes.models import ContentType
from django.contrib.contenttypes.fields import GenericForeignKey
from django.core.validators import MinValueValidator, MaxValueValidator
from django.core.exceptions import ValidationError
from django.utils import timezone
from core.utils import AuditModel, BusinessRuleValidator, RealtimeSyncMixin
import logging

logger = logging.getLogger(__name__)


class ReputationTransaction(AuditModel, RealtimeSyncMixin):
    """
    Track reputation changes for comprehensive audit trails.
    Improves database design with detailed transaction history.
    """

    TRANSACTION_TYPES = [
        ("question_upvote", "Question Upvoted (+5)"),
        ("answer_upvote", "Answer Upvoted (+10)"),
        ("answer_accepted", "Answer Accepted (+15)"),
        ("question_downvote", "Question Downvoted (-2)"),
        ("answer_downvote", "Answer Downvoted (-2)"),
        ("downvote_given", "Downvote Given (-1)"),
        ("spam_penalty", "Spam Penalty (-100)"),
        ("bounty_awarded", "Bounty Awarded"),
        ("moderation_bonus", "Moderation Bonus (+100)"),
    ]

    user = models.ForeignKey(
        "accounts.User",
        on_delete=models.CASCADE,
        related_name="reputation_transactions",
    )
    transaction_type = models.CharField(max_length=20, choices=TRANSACTION_TYPES)
    amount = models.IntegerField(
        validators=[MinValueValidator(-1000), MaxValueValidator(1000)]
    )
    description = models.CharField(max_length=255)

    # Related object that triggered this transaction
    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE)
    object_id = models.PositiveIntegerField()
    related_object = GenericForeignKey("content_type", "object_id")

    # Balance after this transaction for audit purposes
    balance_after = models.IntegerField(default=0)

    class Meta:
        db_table = "reputation_transactions"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["user", "created_at"]),
            models.Index(fields=["transaction_type"]),
            models.Index(fields=["content_type", "object_id"]),
        ]

    def save(self, *args, **kwargs):
        """Override save to update user reputation and trigger real-time updates"""
        if not self.pk:  # New transaction
            # Update user reputation
            self.user.reputation += self.amount
            self.balance_after = self.user.reputation
            self.user.save(update_fields=["reputation"])

            # Trigger real-time update
            self.trigger_realtime_update(
                "reputation_changed",
                {
                    "user_id": self.user.id,
                    "new_reputation": self.user.reputation,
                    "change": self.amount,
                    "reason": self.get_transaction_type_display(),
                },
            )

            logger.info(
                f"Reputation updated: {self.user.username} {self.amount:+d} = {self.user.reputation}"
            )

        super().save(*args, **kwargs)


class QuestionView(models.Model):
    """
    Track question views for analytics and recommendation systems.
    Improves database design with comprehensive view tracking.
    """

    question = models.ForeignKey(
        "questions.Question", on_delete=models.CASCADE, related_name="view_records"
    )
    viewer = models.ForeignKey(
        "accounts.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="question_views",
    )
    ip_address = models.GenericIPAddressField()
    user_agent = models.TextField(blank=True)
    viewed_at = models.DateTimeField(auto_now_add=True)

    # Track view duration for engagement metrics
    duration_seconds = models.PositiveIntegerField(null=True, blank=True)

    class Meta:
        db_table = "question_views"
        unique_together = ["question", "viewer", "ip_address"]
        indexes = [
            models.Index(fields=["question", "viewed_at"]),
            models.Index(fields=["viewer", "viewed_at"]),
            models.Index(fields=["ip_address"]),
        ]


class ContentModeration(AuditModel):
    """
    Track content moderation actions for audit and compliance.
    Enhances database design with comprehensive moderation history.
    """

    ACTION_TYPES = [
        ("flag", "Flagged for Review"),
        ("approve", "Approved"),
        ("reject", "Rejected"),
        ("edit", "Edited"),
        ("delete", "Deleted"),
        ("restore", "Restored"),
        ("lock", "Locked"),
        ("unlock", "Unlocked"),
    ]

    REASON_CHOICES = [
        ("spam", "Spam"),
        ("offensive", "Offensive Content"),
        ("low_quality", "Low Quality"),
        ("duplicate", "Duplicate"),
        ("off_topic", "Off Topic"),
        ("copyright", "Copyright Violation"),
        ("other", "Other"),
    ]

    moderator = models.ForeignKey(
        "accounts.User", on_delete=models.PROTECT, related_name="moderation_actions"
    )
    action_type = models.CharField(max_length=10, choices=ACTION_TYPES)
    reason = models.CharField(max_length=15, choices=REASON_CHOICES)
    notes = models.TextField(blank=True)

    # Generic relation to moderate any content type
    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE)
    object_id = models.PositiveIntegerField()
    moderated_object = GenericForeignKey("content_type", "object_id")

    # Auto-moderation fields
    is_auto_moderated = models.BooleanField(default=False)
    confidence_score = models.FloatField(
        null=True,
        blank=True,
        validators=[MinValueValidator(0.0), MaxValueValidator(1.0)],
    )

    class Meta:
        db_table = "content_moderation"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["moderator", "created_at"]),
            models.Index(fields=["action_type", "created_at"]),
            models.Index(fields=["content_type", "object_id"]),
            models.Index(fields=["is_auto_moderated"]),
        ]


class UserActivity(models.Model):
    """
    Track user activity for analytics and personalization.
    Improves database design with comprehensive user behavior tracking.
    """

    ACTIVITY_TYPES = [
        ("login", "User Login"),
        ("logout", "User Logout"),
        ("question_create", "Question Created"),
        ("answer_create", "Answer Created"),
        ("vote_cast", "Vote Cast"),
        ("comment_create", "Comment Created"),
        ("profile_update", "Profile Updated"),
        ("search", "Search Performed"),
        ("tag_follow", "Tag Followed"),
        ("user_follow", "User Followed"),
    ]

    user = models.ForeignKey(
        "accounts.User", on_delete=models.CASCADE, related_name="activities"
    )
    activity_type = models.CharField(max_length=20, choices=ACTIVITY_TYPES)
    description = models.CharField(max_length=255)

    # Store activity metadata as JSON
    metadata = models.JSONField(default=dict, blank=True)

    # Track session and device info
    session_key = models.CharField(max_length=40, blank=True)
    ip_address = models.GenericIPAddressField()
    user_agent = models.TextField(blank=True)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "user_activities"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["user", "created_at"]),
            models.Index(fields=["activity_type", "created_at"]),
            models.Index(fields=["session_key"]),
            models.Index(fields=["ip_address"]),
        ]


class SystemConfiguration(AuditModel):
    """
    Dynamic system configuration for flexible application behavior.
    Implements dynamic values requirement with database persistence.
    """

    CONFIG_TYPES = [
        ("string", "String"),
        ("integer", "Integer"),
        ("float", "Float"),
        ("boolean", "Boolean"),
        ("json", "JSON Object"),
    ]

    key = models.CharField(max_length=100, unique=True, db_index=True)
    value = models.TextField()
    value_type = models.CharField(max_length=10, choices=CONFIG_TYPES, default="string")
    description = models.TextField(blank=True)

    # Configuration categories for organization
    category = models.CharField(max_length=50, default="general", db_index=True)

    # Runtime validation
    is_sensitive = models.BooleanField(default=False)
    requires_restart = models.BooleanField(default=False)

    class Meta:
        db_table = "system_configurations"
        ordering = ["category", "key"]
        indexes = [
            models.Index(fields=["category", "key"]),
            models.Index(fields=["is_sensitive"]),
        ]

    def get_typed_value(self):
        """Return value converted to appropriate Python type"""
        if self.value_type == "integer":
            return int(self.value)
        elif self.value_type == "float":
            return float(self.value)
        elif self.value_type == "boolean":
            return self.value.lower() in ("true", "1", "yes", "on")
        elif self.value_type == "json":
            import json

            return json.loads(self.value)
        return self.value

    def clean(self):
        """Validate value according to type"""
        try:
            self.get_typed_value()
        except (ValueError, json.JSONDecodeError) as e:
            raise ValidationError(f"Invalid value for type {self.value_type}: {e}")


class DatabaseTrigger(models.Model):
    """
    Track database triggers and automated actions.
    Improves database design with comprehensive automation tracking.
    """

    TRIGGER_TYPES = [
        ("reputation_update", "Reputation Update"),
        ("notification_send", "Notification Send"),
        ("cache_invalidate", "Cache Invalidation"),
        ("email_send", "Email Send"),
        ("search_index", "Search Index Update"),
        ("auto_moderate", "Auto Moderation"),
    ]

    trigger_type = models.CharField(max_length=20, choices=TRIGGER_TYPES)
    table_name = models.CharField(max_length=100)
    operation = models.CharField(max_length=10)  # INSERT, UPDATE, DELETE

    # Store trigger conditions and actions
    conditions = models.JSONField(default=dict)
    actions = models.JSONField(default=dict)

    is_active = models.BooleanField(default=True)
    execution_count = models.PositiveIntegerField(default=0)
    last_executed = models.DateTimeField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "database_triggers"
        unique_together = ["trigger_type", "table_name", "operation"]
        indexes = [
            models.Index(fields=["trigger_type", "is_active"]),
            models.Index(fields=["table_name", "operation"]),
        ]


class PerformanceMetric(models.Model):
    """
    Track application performance metrics for optimization.
    Implements performance standards with comprehensive monitoring.
    """

    METRIC_TYPES = [
        ("api_response_time", "API Response Time"),
        ("database_query_time", "Database Query Time"),
        ("cache_hit_rate", "Cache Hit Rate"),
        ("memory_usage", "Memory Usage"),
        ("cpu_usage", "CPU Usage"),
        ("concurrent_users", "Concurrent Users"),
        ("error_rate", "Error Rate"),
    ]

    metric_type = models.CharField(max_length=25, choices=METRIC_TYPES)
    endpoint = models.CharField(max_length=255, blank=True)
    value = models.FloatField()
    unit = models.CharField(max_length=20, default="seconds")

    # Additional context
    user_count = models.PositiveIntegerField(null=True, blank=True)
    request_method = models.CharField(max_length=10, blank=True)
    status_code = models.PositiveIntegerField(null=True, blank=True)

    recorded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "performance_metrics"
        ordering = ["-recorded_at"]
        indexes = [
            models.Index(fields=["metric_type", "recorded_at"]),
            models.Index(fields=["endpoint", "recorded_at"]),
            models.Index(fields=["status_code"]),
        ]
