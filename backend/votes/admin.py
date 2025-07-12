from django.contrib import admin
from .models import Vote


@admin.register(Vote)
class VoteAdmin(admin.ModelAdmin):
    list_display = ["user", "content_object", "value", "created_at"]
    list_filter = ["value", "content_type", "created_at"]
    search_fields = ["user__username"]
    ordering = ["-created_at"]
    readonly_fields = ["created_at", "updated_at"]
