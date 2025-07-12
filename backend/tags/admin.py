from django.contrib import admin
from .models import Tag


@admin.register(Tag)
class TagAdmin(admin.ModelAdmin):
    list_display = ["name", "usage_count", "color", "created_at"]
    list_filter = ["created_at"]
    search_fields = ["name", "description"]
    ordering = ["name"]
    readonly_fields = ["usage_count", "created_at", "updated_at"]
