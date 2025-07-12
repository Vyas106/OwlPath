from rest_framework import serializers
from .models import Question
from tags.serializers import TagSerializer
from accounts.serializers import UserListSerializer


class QuestionListSerializer(serializers.ModelSerializer):
    """Serializer for listing questions"""

    author = UserListSerializer(read_only=True)
    tags = TagSerializer(many=True, read_only=True)
    answer_count = serializers.ReadOnlyField()
    vote_score = serializers.ReadOnlyField()

    class Meta:
        model = Question
        fields = [
            "id",
            "title",
            "slug",
            "author",
            "tags",
            "views",
            "is_answered",
            "answer_count",
            "vote_score",
            "created_at",
        ]


class QuestionDetailSerializer(serializers.ModelSerializer):
    """Serializer for question details"""

    author = UserListSerializer(read_only=True)
    tags = TagSerializer(many=True, read_only=True)
    answer_count = serializers.ReadOnlyField()
    vote_score = serializers.ReadOnlyField()
    upvote_count = serializers.ReadOnlyField()
    downvote_count = serializers.ReadOnlyField()

    class Meta:
        model = Question
        fields = [
            "id",
            "title",
            "slug",
            "body",
            "author",
            "tags",
            "views",
            "is_answered",
            "accepted_answer",
            "answer_count",
            "vote_score",
            "upvote_count",
            "downvote_count",
            "created_at",
            "updated_at",
        ]


class QuestionCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating questions"""

    tag_names = serializers.ListField(
        child=serializers.CharField(max_length=50), write_only=True, required=False
    )

    class Meta:
        model = Question
        fields = ["title", "body", "tag_names"]

    def create(self, validated_data):
        tag_names = validated_data.pop("tag_names", [])
        question = Question.objects.create(**validated_data)

        # Handle tags
        if tag_names:
            from tags.models import Tag

            for tag_name in tag_names:
                tag, created = Tag.objects.get_or_create(name=tag_name.lower().strip())
                question.tags.add(tag)

        return question


class QuestionUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating questions"""

    tag_names = serializers.ListField(
        child=serializers.CharField(max_length=50), write_only=True, required=False
    )

    class Meta:
        model = Question
        fields = ["title", "body", "tag_names"]

    def update(self, instance, validated_data):
        tag_names = validated_data.pop("tag_names", None)

        # Update basic fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        # Handle tags if provided
        if tag_names is not None:
            from tags.models import Tag

            instance.tags.clear()
            for tag_name in tag_names:
                tag, created = Tag.objects.get_or_create(name=tag_name.lower().strip())
                instance.tags.add(tag)

        return instance
