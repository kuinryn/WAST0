from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import CustomUser

@admin.register(CustomUser)
class CustomUserAdmin(UserAdmin):
    model = CustomUser

    list_display = [
        'email',
        'name',
        'role',
        'barangay',
        'is_active'
    ]

    list_filter = [
        'role',
        'is_active',
        'is_staff',
    ]

    fieldsets = (
        (None, {
            'fields': ('email', 'password')
        }),

        ('Personal Info', {
            'fields': (
                'name',
                'role',
                'barangay',
                'fcm_token'
            )
        }),

        ('Permissions', {
            'fields': (
                'is_active',
                'is_staff',
                'is_superuser',
                'groups',
                'user_permissions'
            )
        }),
    )

    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': (
                'email',
                'name',
                'password1',
                'password2',
                'role',
                'barangay',
                'is_active',
                'is_staff'
            ),
        }),
    )

    search_fields = ('email', 'name')
    ordering = ('email',)