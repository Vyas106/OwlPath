from django.db.models.signals import post_save
from django.dispatch import receiver
from answers.models import Answer
from votes.models import Vote
from questions.models import Question
from .utils import notify_new_answer, notify_vote, notify_answer_accepted


@receiver(post_save, sender=Answer)
def answer_created(sender, instance, created, **kwargs):
    """Send notification when a new answer is created"""
    if created:
        notify_new_answer(instance.question, instance)


@receiver(post_save, sender=Question)
def question_answer_accepted(sender, instance, **kwargs):
    """Send notification when an answer is accepted"""
    if instance.accepted_answer and hasattr(instance, "_previous_accepted_answer"):
        # Check if this is a new acceptance (not just an update)
        if instance._previous_accepted_answer != instance.accepted_answer:
            notify_answer_accepted(instance.accepted_answer)


@receiver(post_save, sender=Vote)
def vote_created(sender, instance, created, **kwargs):
    """Send notification when a vote is created"""
    if created:
        notify_vote(instance.content_object, instance.user, instance.value)


# Track previous accepted answer to detect changes
@receiver(post_save, sender=Question)
def track_accepted_answer_changes(sender, instance, **kwargs):
    """Track changes to accepted answers"""
    try:
        previous = Question.objects.get(pk=instance.pk)
        instance._previous_accepted_answer = previous.accepted_answer
    except Question.DoesNotExist:
        instance._previous_accepted_answer = None
