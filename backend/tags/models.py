from django.db import models


class Tag(models.Model):
    """Tag model for categorizing questions"""

    name = models.CharField(max_length=50, unique=True)
    description = models.TextField(blank=True)
    color = models.CharField(max_length=7, default="#007bff")  # Hex color
    usage_count = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "tags"
        ordering = ["name"]
        indexes = [
            models.Index(fields=["name"]),
            models.Index(fields=["usage_count"]),
        ]

    def __str__(self):
        return self.name

    def increment_usage(self):
        """Increment the usage count for this tag"""
        self.usage_count += 1
        self.save(update_fields=["usage_count"])

    def decrement_usage(self):
        """Decrement the usage count for this tag"""
        if self.usage_count > 0:
            self.usage_count -= 1
            self.save(update_fields=["usage_count"])
