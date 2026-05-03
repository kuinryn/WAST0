from rest_framework.views import APIView
from rest_framework.response import Response
from barangays.permissions import IsSuperAdmin
from .models import AuditLog
from .serializers import AuditLogSerializer

class AuditLogListView(APIView):
    permission_classes = [IsSuperAdmin]

    def get(self, request):
        logs = AuditLog.objects.all().order_by('-performed_at')
        serializer = AuditLogSerializer(logs, many=True)
        return Response(serializer.data)