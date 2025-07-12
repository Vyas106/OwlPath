from django.contrib import admin
from django.utils.html import format_html
from .models import Answer


@admin.register(Answer)
class AnswerAdmin(admin.ModelAdmin):
    list_display = [
        "question",
        "author",
        "is_accepted",
        "vote_score_display",
        "created_at",
    ]
    list_filter = ["is_accepted", "created_at"]
    search_fields = ["body", "author__username", "question__title"]
    ordering = ["-created_at"]
    readonly_fields = ["created_at", "updated_at", "vote_score_display"]
    list_editable = ["is_accepted"]
    actions = ["mark_as_accepted", "mark_as_not_accepted"]

    def vote_score_display(self, obj):
        """Display vote score with color coding"""
        score = obj.vote_score
        if score > 0:
            return format_html(
                '<span style="color: green; font-weight: bold;">+{}</span>', score
            )
        elif score < 0:
            return format_html(
                '<span style="color: red; font-weight: bold;">{}</span>', score
            )
        return format_html('<span style="color: gray;">0</span>')

    vote_score_display.short_description = "Vote Score"
    vote_score_display.admin_order_field = "votes__value"

    def mark_as_accepted(self, request, queryset):
        """Mark selected answers as accepted"""
        for answer in queryset:
            answer.is_accepted = True
            answer.save()
        message = f"{queryset.count()} answers marked as accepted."
        self.message_user(request, message)

    mark_as_accepted.short_description = "Mark selected answers as accepted"

    def mark_as_not_accepted(self, request, queryset):
        """Mark selected answers as not accepted"""
        queryset.update(is_accepted=False)
        message = f"{queryset.count()} answers marked as not accepted."
        self.message_user(request, message)

    mark_as_not_accepted.short_description = "Mark selected answers as not accepted"
