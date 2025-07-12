from rest_framework import serializers
from django.utils import timezone
from .models import Notification


class NotificationSerializer(serializers.ModelSerializer):
    """Serializer for notification data"""

    sender_username = serializers.CharField(source="sender.username", read_only=True)
    sender_avatar = serializers.SerializerMethodField()
    time_ago = serializers.SerializerMethodField()
    is_recent = serializers.SerializerMethodField()

    class Meta:
        model = Notification
        fields = [
            "id",
            "sender_username",
            "sender_avatar",
            "notification_type",
            "title",
            "message",
            "is_read",
            "is_recent",
            "related_question_id",
            "related_answer_id",
            "created_at",
            "time_ago",
        ]
        read_only_fields = ["id", "created_at"]

    def get_time_ago(self, obj):
        """Calculate how long ago the notification was created"""
        now = timezone.now()
        diff = now - obj.created_at

        if diff.days > 0:
            return f"{diff.days} days ago"
        elif diff.seconds > 3600:
            hours = diff.seconds // 3600
            return f"{hours} hours ago"
        elif diff.seconds > 60:
            minutes = diff.seconds // 60
            return f"{minutes} minutes ago"
        else:
            return "Just now"

    def get_is_recent(self, obj):
        """Check if notification is less than 24 hours old"""
        now = timezone.now()
        return (now - obj.created_at).days == 0

    def get_sender_avatar(self, obj):
        """Get sender avatar URL safely"""
        if obj.sender and obj.sender.avatar:
            return obj.sender.avatar.url
        return None


class SimpleNotificationSerializer(serializers.ModelSerializer):
    """Lightweight serializer for notification counts and stats"""

    class Meta:
        model = Notification
        fields = ["id", "notification_type", "is_read", "created_at"]
