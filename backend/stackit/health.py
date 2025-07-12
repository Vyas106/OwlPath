from django.http import JsonResponse
from django.views.decorators.http import require_GET
from django.db import connection
from django.core.cache import cache
import time


@require_GET
def health_check(request):
    """Health check endpoint for monitoring"""
    checks = {
        "database": False,
        "cache": False,
        "timestamp": int(time.time()),
        "status": "unhealthy",
    }

    # Check database connection
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
        checks["database"] = True
    except Exception:
        pass

    # Check cache (try setting and getting a test value)
    try:
        cache.set("health_check", "ok", 10)
        if cache.get("health_check") == "ok":
            checks["cache"] = True
        cache.delete("health_check")
    except Exception:
        pass

    # Overall status
    if checks["database"] and checks["cache"]:
        checks["status"] = "healthy"
        status_code = 200
    else:
        status_code = 503

    return JsonResponse(checks, status=status_code)
