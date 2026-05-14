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


class UserProfileUpdateSerializer(serializers.ModelSerializer):
    barangay = serializers.PrimaryKeyRelatedField(
        queryset=Barangay.objects.all(), required=False, allow_null=True
    )
    barangay_name = serializers.CharField(source='barangay.name', read_only=True)

    class Meta:
        model = CustomUser
        fields = ['id', 'name', 'email', 'role', 'barangay', 'barangay_name', 'created_at']
        read_only_fields = ['id', 'email', 'role', 'created_at']

    def update(self, instance, validated_data):
        instance.name = validated_data.get('name', instance.name)
        instance.barangay = validated_data.get('barangay', instance.barangay)
        instance.save()
        return instance


class FcmTokenSerializer(serializers.Serializer):
    fcm_token = serializers.CharField(allow_blank=False, trim_whitespace=True)


class AdminUserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=False, min_length=8, allow_blank=True)
    barangay_name = serializers.CharField(source='barangay.name', read_only=True)
    barangay = serializers.PrimaryKeyRelatedField(
        queryset=Barangay.objects.all(), required=False, allow_null=True
    )

    class Meta:
        model = CustomUser
        fields = [
            'id', 'name', 'email', 'password', 'role', 'barangay',
            'barangay_name', 'is_active', 'created_at',
        ]
        read_only_fields = ['id', 'barangay_name', 'created_at']

    def validate(self, data):
        role = data.get('role', getattr(self.instance, 'role', None))
        barangay = data.get('barangay', getattr(self.instance, 'barangay', None))
        password = data.get('password')
        if not self.instance and not password:
            raise serializers.ValidationError({'password': 'Password is required.'})
        if role == 'official' and not barangay:
            raise serializers.ValidationError({'barangay': 'Barangay is required for barangay officials.'})
        is_active = data.get('is_active', getattr(self.instance, 'is_active', True))
        if role == 'official' and barangay and is_active:
            existing_official = CustomUser.objects.filter(role='official', barangay=barangay, is_active=True)
            if self.instance:
                existing_official = existing_official.exclude(pk=self.instance.pk)
            if existing_official.exists():
                raise serializers.ValidationError({
                    'barangay': 'This barangay already has a barangay official account.'
                })
        return data

    def apply_role_flags(self, user):
        user.is_staff = user.role == 'super_admin'
        user.is_superuser = user.role == 'super_admin'

    def create(self, validated_data):
        password = validated_data.pop('password', None)
        user = CustomUser.objects.create_user(password=password, **validated_data)
        self.apply_role_flags(user)
        user.save()
        return user

    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        if password:
            instance.set_password(password)
        self.apply_role_flags(instance)
        instance.save()
        return instance
