from rest_framework import serializers
from .models import WeatherAlert, NotificationLog

class WeatherAlertSerializer(serializers.ModelSerializer):
    barangay_name = serializers.CharField(source='barangay.name', read_only=True)

    class Meta:
        model = WeatherAlert
        fields = ['id', 'barangay', 'barangay_name', 'condition', 'severity', 'message', 'notification_sent', 'triggered_at']

class NotificationLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = NotificationLog
        fields = ['id', 'user', 'alert', 'status', 'sent_at']