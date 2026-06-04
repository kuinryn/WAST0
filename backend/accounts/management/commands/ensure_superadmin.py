import os

from django.core.management.base import BaseCommand

from accounts.models import CustomUser


class Command(BaseCommand):
    help = 'Create or update the deployment super admin from environment variables.'

    def handle(self, *args, **options):
        email = os.getenv('SUPER_ADMIN_EMAIL', '').strip()
        name = os.getenv('SUPER_ADMIN_NAME', 'Super Admin').strip() or 'Super Admin'
        password = os.getenv('SUPER_ADMIN_PASSWORD', '')

        if not email or not password:
            self.stdout.write(
                self.style.WARNING(
                    'Skipping super admin setup: SUPER_ADMIN_EMAIL or SUPER_ADMIN_PASSWORD is missing.'
                )
            )
            return

        user, created = CustomUser.objects.get_or_create(
            email=CustomUser.objects.normalize_email(email),
            defaults={
                'name': name,
                'role': 'super_admin',
                'is_staff': True,
                'is_superuser': True,
                'is_active': True,
            },
        )

        user.name = name
        user.role = 'super_admin'
        user.is_staff = True
        user.is_superuser = True
        user.is_active = True
        user.set_password(password)
        user.save()

        action = 'Created' if created else 'Updated'
        self.stdout.write(self.style.SUCCESS(f'{action} super admin account: {user.email}'))
