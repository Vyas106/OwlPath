from rest_framework import serializers
from .models import Tag


class TagSerializer(serializers.ModelSerializer):
    """Serializer for Tag model"""

    class Meta:
        model = Tag
        fields = ["id", "name", "description", "color", "usage_count", "created_at"]
        read_only_fields = ["id", "usage_count", "created_at"]


class TagCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating tags"""

    class Meta:
        model = Tag
        fields = ["name", "description", "color"]

    def validate_name(self, value):
        """Ensure tag name is lowercase and no spaces"""
        return value.lower().strip().replace(" ", "-")


class TagListSerializer(serializers.ModelSerializer):
    """Serializer for listing tags"""

    class Meta:
        model = Tag
        fields = ["id", "name", "usage_count"]
