from rest_framework import serializers
from django.utils import timezone
from datetime import timedelta
from .models import WeatherAlert, NotificationLog

class WeatherAlertSerializer(serializers.ModelSerializer):
    barangay_name = serializers.CharField(source='barangay.name', read_only=True)
    expires_at = serializers.SerializerMethodField()
    is_active = serializers.SerializerMethodField()

    def get_expires_at(self, obj):
        return obj.triggered_at + timedelta(hours=24)

    def get_is_active(self, obj):
        return obj.triggered_at >= timezone.now() - timedelta(hours=24)

    class Meta:
        model = WeatherAlert
        fields = [
            'id', 'barangay', 'barangay_name', 'condition', 'severity',
            'message', 'notification_sent', 'triggered_at', 'expires_at',
            'is_active',
        ]

class NotificationLogSerializer(serializers.ModelSerializer):
    is_read = serializers.SerializerMethodField()

    def get_is_read(self, obj):
        return obj.read_at is not None

    class Meta:
        model = NotificationLog
        fields = ['id', 'user', 'alert', 'category', 'title', 'message', 'status', 'sent_at', 'read_at', 'is_read']
