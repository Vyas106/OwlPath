import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth.models import AnonymousUser


class NotificationConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        """Handle WebSocket connection"""
        self.user = self.scope["user"]

        if isinstance(self.user, AnonymousUser):
            await self.close()
        else:
            self.group_name = f"notifications_{self.user.id}"

            # Join notification group
            await self.channel_layer.group_add(self.group_name, self.channel_name)

            await self.accept()

            # Send unread notification count
            unread_count = await self.get_unread_count()
            await self.send(
                text_data=json.dumps({"type": "unread_count", "count": unread_count})
            )

    async def disconnect(self, close_code):
        """Handle WebSocket disconnection"""
        if hasattr(self, "group_name"):
            await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def receive(self, text_data):
        """Handle messages from WebSocket"""
        try:
            text_data_json = json.loads(text_data)
            message_type = text_data_json.get("type")

            if message_type == "mark_as_read":
                notification_id = text_data_json.get("notification_id")
                await self.mark_notification_as_read(notification_id)

        except json.JSONDecodeError:
            pass

    async def notification_message(self, event):
        """Send notification to WebSocket"""
        await self.send(
            text_data=json.dumps(
                {"type": "notification", "notification": event["notification"]}
            )
        )

    @database_sync_to_async
    def get_unread_count(self):
        """Get unread notification count for user"""
        from .models import Notification

        return Notification.objects.filter(recipient=self.user, is_read=False).count()

    @database_sync_to_async
    def mark_notification_as_read(self, notification_id):
        """Mark notification as read"""
        from .models import Notification

        try:
            notification = Notification.objects.get(
                id=notification_id, recipient=self.user
            )
            notification.mark_as_read()
            return True
        except Notification.DoesNotExist:
            return False
