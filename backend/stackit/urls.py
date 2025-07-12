"""
URL configuration for stackit project.
"""

from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework import permissions
from drf_yasg.views import get_schema_view
from drf_yasg import openapi
from .health import health_check

schema_view = get_schema_view(
    openapi.Info(
        title="StackIt API",
        default_version="v1",
        description="A minimal Q&A platform API inspired by StackOverflow",
        terms_of_service="https://www.google.com/policies/terms/",
        contact=openapi.Contact(email="contact@stackit.local"),
        license=openapi.License(name="BSD License"),
    ),
    public=True,
    permission_classes=(permissions.AllowAny,),
)

urlpatterns = [
    path("admin/", admin.site.urls),
    path("health/", health_check, name="health-check"),
    path("api/auth/", include("accounts.urls")),
    path("api/questions/", include("questions.urls")),
    path("api/answers/", include("answers.urls")),
    path("api/votes/", include("votes.urls")),
    path("api/tags/", include("tags.urls")),
    path("api/notifications/", include("notifications.urls")),
    # Swagger documentation
    path(
        "swagger/",
        schema_view.with_ui("swagger", cache_timeout=0),
        name="schema-swagger-ui",
    ),
    path(
        "redoc/",
        schema_view.with_ui("redoc", cache_timeout=0),
        name="schema-redoc",
    ),
    path(
        "api/schema/",
        schema_view.without_ui(cache_timeout=0),
        name="schema-json",
    ),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
