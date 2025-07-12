"""
Real-time WebSocket consumers for live updates and notifications.
Implements real-time synchronization requirement for enhanced user experience.
"""

import json
import logging
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model
from django.utils import timezone
from asgiref.sync import sync_to_async

User = get_user_model()
logger = logging.getLogger(__name__)


class NotificationConsumer(AsyncWebsocketConsumer):
    """
    WebSocket consumer for real-time notifications.
    Provides instant updates for user notifications, votes, and activity.
    """

    async def connect(self):
        """Handle WebSocket connection"""
        self.user = self.scope["user"]

        # Only allow authenticated users
        if not self.user.is_authenticated:
            await self.close(code=4001)
            return

        # Join user-specific notification group
        self.notification_group = f"notifications_{self.user.id}"
        await self.channel_layer.group_add(self.notification_group, self.channel_name)

        # Join global updates group
        self.global_group = "global_updates"
        await self.channel_layer.group_add(self.global_group, self.channel_name)

        await self.accept()

        # Send connection confirmation
        await self.send(
            text_data=json.dumps(
                {
                    "type": "connection_established",
                    "message": "Connected to real-time notifications",
                    "timestamp": timezone.now().isoformat(),
                }
            )
        )

        # Send any pending notifications
        await self.send_pending_notifications()

        logger.info(f"WebSocket connected: user {self.user.username}")

    async def disconnect(self, close_code):
        """Handle WebSocket disconnection"""
        if hasattr(self, "notification_group"):
            await self.channel_layer.group_discard(
                self.notification_group, self.channel_name
            )

        if hasattr(self, "global_group"):
            await self.channel_layer.group_discard(self.global_group, self.channel_name)

        logger.info(
            f"WebSocket disconnected: user {getattr(self.user, 'username', 'unknown')} (code: {close_code})"
        )

    async def receive(self, text_data):
        """Handle incoming WebSocket messages"""
        try:
            data = json.loads(text_data)
            message_type = data.get("type")

            if message_type == "mark_notification_read":
                await self.handle_mark_notification_read(data)
            elif message_type == "subscribe_to_question":
                await self.handle_question_subscription(data)
            elif message_type == "heartbeat":
                await self.handle_heartbeat()
            else:
                await self.send_error("Unknown message type")

        except json.JSONDecodeError:
            await self.send_error("Invalid JSON format")
        except Exception as e:
            logger.error(f"WebSocket message error: {str(e)}")
            await self.send_error("Message processing failed")

    async def handle_mark_notification_read(self, data):
        """Mark notification as read"""
        notification_id = data.get("notification_id")

        if notification_id:
            success = await self.mark_notification_read(notification_id)
            if success:
                await self.send(
                    text_data=json.dumps(
                        {
                            "type": "notification_marked_read",
                            "notification_id": notification_id,
                            "timestamp": timezone.now().isoformat(),
                        }
                    )
                )

    async def handle_question_subscription(self, data):
        """Subscribe to question-specific updates"""
        question_id = data.get("question_id")

        if question_id:
            question_group = f"question_{question_id}"
            await self.channel_layer.group_add(question_group, self.channel_name)

            await self.send(
                text_data=json.dumps(
                    {
                        "type": "question_subscribed",
                        "question_id": question_id,
                        "message": f"Subscribed to question {question_id} updates",
                        "timestamp": timezone.now().isoformat(),
                    }
                )
            )

    async def handle_heartbeat(self):
        """Handle heartbeat for connection monitoring"""
        await self.send(
            text_data=json.dumps(
                {"type": "heartbeat_response", "timestamp": timezone.now().isoformat()}
            )
        )

    async def send_error(self, message):
        """Send error message to client"""
        await self.send(
            text_data=json.dumps(
                {
                    "type": "error",
                    "message": message,
                    "timestamp": timezone.now().isoformat(),
                }
            )
        )

    @database_sync_to_async
    def mark_notification_read(self, notification_id):
        """Mark notification as read in database"""
        try:
            from notifications.models import Notification

            notification = Notification.objects.get(
                id=notification_id, recipient=self.user
            )
            notification.is_read = True
            notification.save(update_fields=["is_read"])
            return True
        except Notification.DoesNotExist:
            return False

    @database_sync_to_async
    def get_pending_notifications(self):
        """Get unread notifications for user"""
        from notifications.models import Notification

        notifications = Notification.objects.filter(
            recipient=self.user, is_read=False
        ).order_by("-created_at")[:10]

        return [
            {
                "id": notif.id,
                "type": notif.notification_type,
                "title": notif.title,
                "message": notif.message,
                "created_at": notif.created_at.isoformat(),
                "sender": notif.sender.username if notif.sender else None,
            }
            for notif in notifications
        ]

    async def send_pending_notifications(self):
        """Send pending notifications to newly connected user"""
        notifications = await self.get_pending_notifications()

        if notifications:
            await self.send(
                text_data=json.dumps(
                    {
                        "type": "pending_notifications",
                        "notifications": notifications,
                        "count": len(notifications),
                        "timestamp": timezone.now().isoformat(),
                    }
                )
            )

    # Channel layer message handlers
    async def new_notification(self, event):
        """Handle new notification from channel layer"""
        await self.send(
            text_data=json.dumps(
                {
                    "type": "new_notification",
                    "notification": event["notification"],
                    "timestamp": event.get("timestamp", timezone.now().isoformat()),
                }
            )
        )

    async def reputation_update(self, event):
        """Handle reputation update from channel layer"""
        await self.send(
            text_data=json.dumps(
                {
                    "type": "reputation_update",
                    "new_reputation": event["new_reputation"],
                    "change": event["change"],
                    "reason": event["reason"],
                    "timestamp": event.get("timestamp", timezone.now().isoformat()),
                }
            )
        )

    async def vote_update(self, event):
        """Handle vote update from channel layer"""
        await self.send(
            text_data=json.dumps(
                {
                    "type": "vote_update",
                    "content_type": event["content_type"],
                    "object_id": event["object_id"],
                    "vote_score": event["vote_score"],
                    "user_vote": event.get("user_vote"),
                    "timestamp": event.get("timestamp", timezone.now().isoformat()),
                }
            )
        )

    async def answer_update(self, event):
        """Handle new answer from channel layer"""
        await self.send(
            text_data=json.dumps(
                {
                    "type": "new_answer",
                    "question_id": event["question_id"],
                    "answer": event["answer"],
                    "timestamp": event.get("timestamp", timezone.now().isoformat()),
                }
            )
        )


class QuestionConsumer(AsyncWebsocketConsumer):
    """
    WebSocket consumer for question-specific real-time updates.
    Provides live updates for question votes, answers, and comments.
    """

    async def connect(self):
        """Handle connection to question-specific updates"""
        self.question_id = self.scope["url_route"]["kwargs"]["question_id"]
        self.question_group = f"question_{self.question_id}"

        # Join question-specific group
        await self.channel_layer.group_add(self.question_group, self.channel_name)

        await self.accept()

        # Send current question data
        await self.send_question_data()

        logger.info(f"Connected to question {self.question_id} updates")

    async def disconnect(self, close_code):
        """Handle disconnection from question updates"""
        await self.channel_layer.group_discard(self.question_group, self.channel_name)

    @database_sync_to_async
    def get_question_data(self):
        """Get current question data"""
        try:
            from questions.models import Question

            question = Question.objects.select_related("author").get(
                id=self.question_id
            )

            return {
                "id": question.id,
                "title": question.title,
                "vote_score": question.vote_score,
                "answer_count": question.answer_count,
                "views": question.views,
                "is_answered": question.is_answered,
                "author": question.author.username,
            }
        except Question.DoesNotExist:
            return None

    async def send_question_data(self):
        """Send current question data to client"""
        question_data = await self.get_question_data()

        if question_data:
            await self.send(
                text_data=json.dumps(
                    {
                        "type": "question_data",
                        "question": question_data,
                        "timestamp": timezone.now().isoformat(),
                    }
                )
            )

    # Channel layer message handlers
    async def question_vote_update(self, event):
        """Handle question vote update"""
        await self.send(
            text_data=json.dumps(
                {
                    "type": "vote_update",
                    "vote_score": event["vote_score"],
                    "upvotes": event.get("upvotes", 0),
                    "downvotes": event.get("downvotes", 0),
                    "timestamp": event.get("timestamp", timezone.now().isoformat()),
                }
            )
        )

    async def new_answer(self, event):
        """Handle new answer"""
        await self.send(
            text_data=json.dumps(
                {
                    "type": "new_answer",
                    "answer": event["answer"],
                    "answer_count": event.get("answer_count", 0),
                    "timestamp": event.get("timestamp", timezone.now().isoformat()),
                }
            )
        )

    async def answer_accepted(self, event):
        """Handle answer acceptance"""
        await self.send(
            text_data=json.dumps(
                {
                    "type": "answer_accepted",
                    "answer_id": event["answer_id"],
                    "question_answered": True,
                    "timestamp": event.get("timestamp", timezone.now().isoformat()),
                }
            )
        )

    async def view_count_update(self, event):
        """Handle view count update"""
        await self.send(
            text_data=json.dumps(
                {
                    "type": "view_update",
                    "views": event["views"],
                    "unique_views": event.get("unique_views"),
                    "timestamp": event.get("timestamp", timezone.now().isoformat()),
                }
            )
        )


class LiveFeedConsumer(AsyncWebsocketConsumer):
    """
    WebSocket consumer for live site activity feed.
    Provides real-time updates of site-wide activities.
    """

    async def connect(self):
        """Handle connection to live feed"""
        self.feed_group = "live_feed"

        await self.channel_layer.group_add(self.feed_group, self.channel_name)

        await self.accept()

        # Send recent activities
        await self.send_recent_activities()

        logger.info("Connected to live activity feed")

    async def disconnect(self, close_code):
        """Handle disconnection from live feed"""
        await self.channel_layer.group_discard(self.feed_group, self.channel_name)

    @database_sync_to_async
    def get_recent_activities(self, limit=20):
        """Get recent site activities"""
        from core.models import UserActivity

        activities = (
            UserActivity.objects.select_related("user")
            .filter(activity_type__in=["question_create", "answer_create", "vote_cast"])
            .order_by("-created_at")[:limit]
        )

        return [
            {
                "id": activity.id,
                "type": activity.activity_type,
                "description": activity.description,
                "user": activity.user.username,
                "created_at": activity.created_at.isoformat(),
                "metadata": activity.metadata,
            }
            for activity in activities
        ]

    async def send_recent_activities(self):
        """Send recent activities to client"""
        activities = await self.get_recent_activities()

        await self.send(
            text_data=json.dumps(
                {
                    "type": "recent_activities",
                    "activities": activities,
                    "timestamp": timezone.now().isoformat(),
                }
            )
        )

    # Channel layer message handlers
    async def new_activity(self, event):
        """Handle new site activity"""
        await self.send(
            text_data=json.dumps(
                {
                    "type": "new_activity",
                    "activity": event["activity"],
                    "timestamp": event.get("timestamp", timezone.now().isoformat()),
                }
            )
        )

    async def trending_update(self, event):
        """Handle trending content update"""
        await self.send(
            text_data=json.dumps(
                {
                    "type": "trending_update",
                    "content": event["content"],
                    "timestamp": event.get("timestamp", timezone.now().isoformat()),
                }
            )
        )


class AdminMonitoringConsumer(AsyncWebsocketConsumer):
    """
    WebSocket consumer for admin monitoring and alerts.
    Provides real-time administrative notifications and system monitoring.
    """

    async def connect(self):
        """Handle admin monitoring connection"""
        self.user = self.scope["user"]

        # Only allow admin users
        if not self.user.is_authenticated or not self.user.is_admin_user:
            await self.close(code=4003)
            return

        self.admin_group = "admin_monitoring"
        await self.channel_layer.group_add(self.admin_group, self.channel_name)

        await self.accept()

        # Send system status
        await self.send_system_status()

        logger.info(f"Admin monitoring connected: {self.user.username}")

    async def disconnect(self, close_code):
        """Handle admin monitoring disconnection"""
        if hasattr(self, "admin_group"):
            await self.channel_layer.group_discard(self.admin_group, self.channel_name)

    @database_sync_to_async
    def get_system_status(self):
        """Get current system status"""
        from django.db import connection
        from core.models import PerformanceMetric

        # Get database status
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
            db_status = "healthy" if cursor.fetchone() else "error"

        # Get recent performance metrics
        recent_metrics = PerformanceMetric.objects.filter(
            metric_type="api_response_time"
        ).order_by("-recorded_at")[:10]

        avg_response_time = (
            sum(m.value for m in recent_metrics) / len(recent_metrics)
            if recent_metrics
            else 0
        )

        return {
            "database": db_status,
            "avg_response_time": avg_response_time,
            "active_users": User.objects.filter(
                last_seen__gte=timezone.now() - timezone.timedelta(minutes=30)
            ).count(),
            "timestamp": timezone.now().isoformat(),
        }

    async def send_system_status(self):
        """Send system status to admin"""
        status = await self.get_system_status()

        await self.send(
            text_data=json.dumps({"type": "system_status", "status": status})
        )

    # Channel layer message handlers
    async def system_alert(self, event):
        """Handle system alerts"""
        await self.send(
            text_data=json.dumps(
                {
                    "type": "system_alert",
                    "alert": event["alert"],
                    "severity": event.get("severity", "info"),
                    "timestamp": event.get("timestamp", timezone.now().isoformat()),
                }
            )
        )

    async def performance_warning(self, event):
        """Handle performance warnings"""
        await self.send(
            text_data=json.dumps(
                {
                    "type": "performance_warning",
                    "metric": event["metric"],
                    "value": event["value"],
                    "threshold": event.get("threshold"),
                    "timestamp": event.get("timestamp", timezone.now().isoformat()),
                }
            )
        )
