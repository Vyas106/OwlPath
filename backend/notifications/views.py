from rest_framework.views import APIView
from rest_framework import permissions
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination
from django.shortcuts import get_object_or_404
from .models import Notification
from .serializers import NotificationSerializer


class NotificationsPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = "page_size"
    max_page_size = 100


class NotificationListAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        # Just grab all the user's notifications
        user_notifications = Notification.objects.filter(recipient=request.user)

        # Let's paginate this so we don't overwhelm the user
        paginator = NotificationsPagination()
        paginated_notifications = paginator.paginate_queryset(
            user_notifications, request
        )

        if paginated_notifications is not None:
            serializer = NotificationSerializer(paginated_notifications, many=True)
            return paginator.get_paginated_response(serializer.data)

        # If no pagination needed, just return everything
        serializer = NotificationSerializer(user_notifications, many=True)
        return Response(serializer.data)


class UnreadNotificationsAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        # Filter for unread notifications only
        unread_notifications = Notification.objects.filter(
            recipient=request.user, is_read=False
        )

        serializer = NotificationSerializer(unread_notifications, many=True)
        return Response(
            {"count": unread_notifications.count(), "notifications": serializer.data}
        )


class MarkNotificationReadAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, notification_id):
        # Find the notification for current user
        notification = get_object_or_404(
            Notification, id=notification_id, recipient=request.user
        )

        # Mark it as read
        notification.mark_as_read()

        return Response({"success": True, "message": "Notification marked as read"})


class MarkAllReadAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        # Update all unread notifications for user
        unread_notifications = Notification.objects.filter(
            recipient=request.user, is_read=False
        )

        count_updated = unread_notifications.update(is_read=True)

        return Response(
            {
                "success": True,
                "marked_read": count_updated,
                "message": f"Marked {count_updated} notifications as read",
            }
        )


class NotificationStatsAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user_notifications = Notification.objects.filter(recipient=request.user)

        unread_count = user_notifications.filter(is_read=False).count()
        total_count = user_notifications.count()

        # Get breakdown by notification type
        notification_types = {}
        for notification in user_notifications:
            ntype = notification.notification_type
            if ntype not in notification_types:
                notification_types[ntype] = {"total": 0, "unread": 0}

            notification_types[ntype]["total"] += 1
            if not notification.is_read:
                notification_types[ntype]["unread"] += 1

        return Response(
            {
                "unread_count": unread_count,
                "total_count": total_count,
                "types_breakdown": notification_types,
            }
        )
