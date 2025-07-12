from django.contrib import admin
from .models import Notification


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = [
        "recipient",
        "sender",
        "notification_type",
        "title",
        "is_read",
        "created_at",
    ]
    list_filter = ["notification_type", "is_read", "created_at"]
    search_fields = ["recipient__username", "sender__username", "title"]
    ordering = ["-created_at"]
    readonly_fields = ["created_at"]

    def mark_as_read(self, request, queryset):
        """Admin action to mark notifications as read"""
        queryset.update(is_read=True)

    mark_as_read.short_description = "Mark selected notifications as read"

    actions = [mark_as_read]
