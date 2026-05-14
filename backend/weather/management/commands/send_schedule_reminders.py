from django.core.management.base import BaseCommand

from weather.services import send_tomorrow_schedule_reminders


class Command(BaseCommand):
    help = 'Send reminder notifications for collection schedules happening tomorrow.'

    def handle(self, *args, **kwargs):
        created = send_tomorrow_schedule_reminders()
        self.stdout.write(self.style.SUCCESS(f'Sent {created} schedule reminder notification(s).'))
