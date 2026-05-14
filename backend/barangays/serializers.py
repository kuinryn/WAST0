from rest_framework import serializers
from .models import Barangay

class BarangaySerializer(serializers.ModelSerializer):
    managed_by_name = serializers.CharField(source='managed_by.name', read_only=True)
    official_status = serializers.SerializerMethodField()
    official_name = serializers.SerializerMethodField()
    official_id = serializers.SerializerMethodField()

    def get_official_status(self, obj):
        return 'Active' if obj.members.filter(role='official', is_active=True).exists() else 'Inactive'

    def get_official_name(self, obj):
        official = obj.members.filter(role='official', is_active=True).order_by('name').first()
        return official.name if official else ''

    def get_official_id(self, obj):
        official = obj.members.filter(role='official', is_active=True).order_by('name').first()
        return official.id if official else None

    class Meta:
        model = Barangay
        fields = [
            'id', 'name', 'district', 'managed_by', 'managed_by_name',
            'official_status', 'official_name', 'official_id',
        ]
