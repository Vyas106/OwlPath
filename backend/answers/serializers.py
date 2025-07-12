from rest_framework import serializers
from .models import Answer
from accounts.serializers import UserListSerializer


class AnswerListSerializer(serializers.ModelSerializer):
    """Serializer for listing answers"""

    author = UserListSerializer(read_only=True)
    vote_score = serializers.ReadOnlyField()

    class Meta:
        model = Answer
        fields = ["id", "author", "body", "is_accepted", "vote_score", "created_at"]


class AnswerDetailSerializer(serializers.ModelSerializer):
    """Serializer for answer details"""

    author = UserListSerializer(read_only=True)
    vote_score = serializers.ReadOnlyField()
    upvote_count = serializers.ReadOnlyField()
    downvote_count = serializers.ReadOnlyField()

    class Meta:
        model = Answer
        fields = [
            "id",
            "author",
            "body",
            "is_accepted",
            "vote_score",
            "upvote_count",
            "downvote_count",
            "created_at",
            "updated_at",
        ]


class AnswerCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating answers"""

    class Meta:
        model = Answer
        fields = ["body"]


class AnswerUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating answers"""

    class Meta:
        model = Answer
        fields = ["body"]
