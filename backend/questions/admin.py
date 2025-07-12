from django.contrib import admin
from .models import Question


@admin.register(Question)
class QuestionAdmin(admin.ModelAdmin):
    list_display = ["title", "author", "is_answered", "views", "created_at"]
    list_filter = ["is_answered", "created_at", "tags"]
    search_fields = ["title", "body", "author__username"]
    ordering = ["-created_at"]
    readonly_fields = ["slug", "views", "created_at", "updated_at"]
    prepopulated_fields = {"slug": ("title",)}

    def get_queryset(self, request):
        return super().get_queryset(request).select_related("author")
