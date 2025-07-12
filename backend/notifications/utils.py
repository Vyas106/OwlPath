from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from .models import Notification
from .serializers import NotificationSerializer


def create_notification(
    recipient,
    sender,
    notification_type,
    title,
    message,
    related_question_id=None,
    related_answer_id=None,
):
    """Create and send a notification"""
    notification = Notification.objects.create(
        recipient=recipient,
        sender=sender,
        notification_type=notification_type,
        title=title,
        message=message,
        related_question_id=related_question_id,
        related_answer_id=related_answer_id,
    )

    # Send real-time notification via WebSocket
    send_notification_to_user(recipient, notification)

    return notification


def send_notification_to_user(user, notification):
    """Send notification to user via WebSocket"""
    channel_layer = get_channel_layer()

    if channel_layer:
        group_name = f"notifications_{user.id}"
        serializer = NotificationSerializer(notification)

        async_to_sync(channel_layer.group_send)(
            group_name,
            {"type": "notification_message", "notification": serializer.data},
        )


def notify_new_answer(question, answer):
    """Send notification when someone answers a question"""
    if question.author != answer.author:
        create_notification(
            recipient=question.author,
            sender=answer.author,
            notification_type="new_answer",
            title=f"New answer to your question",
            message=f'{answer.author.username} answered your question "{question.title}"',
            related_question_id=question.id,
            related_answer_id=answer.id,
        )


def notify_answer_accepted(answer):
    """Send notification when an answer is accepted"""
    create_notification(
        recipient=answer.author,
        sender=answer.question.author,
        notification_type="answer_accepted",
        title="Your answer was accepted",
        message=f'Your answer to "{answer.question.title}" was accepted',
        related_question_id=answer.question.id,
        related_answer_id=answer.id,
    )


def notify_vote(content_object, voter, vote_value):
    """Send notification when content is voted on"""
    if hasattr(content_object, "author") and content_object.author != voter:
        if hasattr(content_object, "question"):
            # It's an answer
            obj_type = "answer"
            title = f'Your answer was {"upvoted" if vote_value == 1 else "downvoted"}'
            message = f'{voter.username} {"upvoted" if vote_value == 1 else "downvoted"} your answer'
            related_question_id = content_object.question.id
            related_answer_id = content_object.id
        else:
            # It's a question
            obj_type = "question"
            title = f'Your question was {"upvoted" if vote_value == 1 else "downvoted"}'
            message = f'{voter.username} {"upvoted" if vote_value == 1 else "downvoted"} your question "{content_object.title}"'
            related_question_id = content_object.id
            related_answer_id = None

        notification_type = (
            f'{obj_type}_{"upvoted" if vote_value == 1 else "downvoted"}'
        )

        create_notification(
            recipient=content_object.author,
            sender=voter,
            notification_type=notification_type,
            title=title,
            message=message,
            related_question_id=related_question_id,
            related_answer_id=related_answer_id,
        )
