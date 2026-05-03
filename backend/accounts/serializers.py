from rest_framework import serializers
from django.contrib.auth import authenticate
from .models import CustomUser
from barangays.models import Barangay

class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    confirm_password = serializers.CharField(write_only=True)
    barangay = serializers.PrimaryKeyRelatedField(
        queryset=Barangay.objects.all(), required=False, allow_null=True
    )

    class Meta:
        model = CustomUser
        fields = ['name', 'email', 'password', 'confirm_password', 'barangay']

    def validate(self, data):
        if data['password'] != data['confirm_password']:
            raise serializers.ValidationError({'confirm_password': 'Passwords do not match.'})
        return data

    def create(self, validated_data):
        validated_data.pop('confirm_password')
        validated_data['role'] = 'resident'
        user = CustomUser.objects.create_user(**validated_data)
        return user

class UserLoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate(self, data):
        user = authenticate(email=data['email'], password=data['password'])
        if not user:
            raise serializers.ValidationError('Invalid email or password.')
        if not user.is_active:
            raise serializers.ValidationError('Account is disabled.')
        data['user'] = user
        return data

class UserProfileSerializer(serializers.ModelSerializer):
    barangay_name = serializers.CharField(source='barangay.name', read_only=True)

    class Meta:
        model = CustomUser
        fields = ['id', 'name', 'email', 'role', 'barangay', 'barangay_name', 'created_at']
        read_only_fields = fields