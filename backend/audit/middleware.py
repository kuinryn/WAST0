from .models import AuditLog

SKIP_PATHS = ['/api/v1/auth/', '/api/health/']
WRITE_METHODS = ['POST', 'PUT', 'PATCH', 'DELETE']

class AuditLogMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)
        if (request.method in WRITE_METHODS
                and request.user.is_authenticated
                and not any(request.path.startswith(p) for p in SKIP_PATHS)):
            try:
                AuditLog.objects.create(
                    user=request.user,
                    action=request.method,
                    target_table=request.path,
                )
            except Exception:
                pass
        return response