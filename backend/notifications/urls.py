from django.urls import path
from . import views

urlpatterns = [
    path("", views.NotificationListAPIView.as_view(), name="notification-list"),
    path(
        "unread/",
        views.UnreadNotificationsAPIView.as_view(),
        name="unread-notifications",
    ),
    path("stats/", views.NotificationStatsAPIView.as_view(), name="notification-stats"),
    path(
        "<int:notification_id>/mark-read/",
        views.MarkNotificationReadAPIView.as_view(),
        name="mark-notification-read",
    ),
    path(
        "mark-all-read/",
        views.MarkAllReadAPIView.as_view(),
        name="mark-all-notifications-read",
    ),
]
