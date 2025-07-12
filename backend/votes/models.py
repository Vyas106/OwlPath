from django.db import models
from django.conf import settings
from django.contrib.contenttypes.models import ContentType
from django.contrib.contenttypes.fields import GenericForeignKey


class Vote(models.Model):
    """Vote model for questions and answers"""

    VOTE_CHOICES = [
        (1, "Upvote"),
        (-1, "Downvote"),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="votes",
    )
    value = models.SmallIntegerField(choices=VOTE_CHOICES)

    # Generic foreign key to allow voting on different models
    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE)
    object_id = models.PositiveIntegerField()
    content_object = GenericForeignKey("content_type", "object_id")

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "votes"
        unique_together = ["user", "content_type", "object_id"]
        indexes = [
            models.Index(fields=["content_type", "object_id"]),
            models.Index(fields=["user"]),
        ]

    def __str__(self):
        vote_type = "upvote" if self.value == 1 else "downvote"
        return f"{self.user.username} {vote_type} on {self.content_object}"

    @classmethod
    def toggle_vote(cls, user, content_object, vote_value):
        """Toggle vote for a user on a content object"""
        content_type = ContentType.objects.get_for_model(content_object)

        try:
            vote = cls.objects.get(
                user=user,
                content_type=content_type,
                object_id=content_object.id,
            )
            if vote.value == vote_value:
                # Same vote, remove it
                vote.delete()
                return None
            else:
                # Different vote, update it
                vote.value = vote_value
                vote.save()
                return vote
        except cls.DoesNotExist:
            # Create new vote
            vote = cls.objects.create(
                user=user,
                content_type=content_type,
                object_id=content_object.id,
                value=vote_value,
            )
            return vote
