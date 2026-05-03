from rest_framework import serializers
from .models import WasteSchedule

class WasteScheduleSerializer(serializers.ModelSerializer):
    barangay_name = serializers.CharField(source='barangay.name', read_only=True)
    created_by_name = serializers.CharField(source='created_by.name', read_only=True)

    class Meta:
        model = WasteSchedule
        fields = [
            'id', 'barangay', 'barangay_name', 'waste_type',
            'collection_day', 'collection_time', 'frequency',
            'created_by', 'created_by_name', 'created_at'
        ]
        read_only_fields = ['created_by', 'created_at']