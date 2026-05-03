from rest_framework import serializers
from .models import Barangay

class BarangaySerializer(serializers.ModelSerializer):
    managed_by_name = serializers.CharField(source='managed_by.name', read_only=True)

    class Meta:
        model = Barangay
        fields = ['id', 'name', 'district', 'managed_by', 'managed_by_name']