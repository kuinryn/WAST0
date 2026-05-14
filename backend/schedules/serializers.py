from rest_framework import serializers
from .models import WasteSchedule


class WasteScheduleSerializer(serializers.ModelSerializer):
    barangay_name = serializers.CharField(source='barangay.name', read_only=True)
    created_by_name = serializers.CharField(source='created_by.name', read_only=True)
    has_calendar_event = serializers.SerializerMethodField()

    class Meta:
        model = WasteSchedule
        fields = [
            'id', 'barangay', 'barangay_name', 'waste_type',
            'collection_day', 'collection_time', 'frequency',
            'created_by', 'created_by_name', 'created_at', 'updated_at',
            'google_calendar_event_id', 'calendar_sync_enabled',
            'last_synced_at', 'has_calendar_event', 'status',
            'weather_recommendation', 'reschedule_date',
        ]
        read_only_fields = [
            'created_by', 'created_at', 'updated_at',
            'google_calendar_event_id', 'last_synced_at',
        ]

    def get_has_calendar_event(self, obj):
        return bool(obj.google_calendar_event_id)
