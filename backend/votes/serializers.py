from rest_framework import serializers
from .models import Vote


class VoteSerializer(serializers.ModelSerializer):
    """Serializer for Vote model"""

    class Meta:
        model = Vote
        fields = ["id", "value", "created_at"]
        read_only_fields = ["id", "created_at"]


class VoteCreateSerializer(serializers.Serializer):
    """Serializer for creating/toggling votes"""

    value = serializers.ChoiceField(choices=Vote.VOTE_CHOICES)

    def validate_value(self, value):
        if value not in [1, -1]:
            raise serializers.ValidationError("Vote value must be 1 or -1")
        return value
