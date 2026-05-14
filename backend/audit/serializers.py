from rest_framework import serializers
from django.utils import timezone
from .models import AuditLog

class AuditLogSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.name', read_only=True)
    resource = serializers.CharField(source='target_table', read_only=True)
    detail = serializers.SerializerMethodField()
    date = serializers.SerializerMethodField()
    time = serializers.SerializerMethodField()
    timestamp = serializers.DateTimeField(source='performed_at', read_only=True)

    def get_detail(self, obj):
        return str(obj.target_id) if obj.target_id else ''

    def get_local_performed_at(self, obj):
        return timezone.localtime(obj.performed_at) if obj.performed_at else None

    def get_date(self, obj):
        performed_at = self.get_local_performed_at(obj)
        return performed_at.date().isoformat() if performed_at else ''

    def get_time(self, obj):
        performed_at = self.get_local_performed_at(obj)
        return performed_at.strftime('%I:%M %p').lstrip('0') if performed_at else ''

    class Meta:
        model = AuditLog
        fields = [
            'id', 'user', 'user_name', 'action', 'target_table', 'target_id',
            'performed_at', 'resource', 'detail', 'date', 'time', 'timestamp',
        ]
