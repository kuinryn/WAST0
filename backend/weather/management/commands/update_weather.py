# weather/management/commands/update_weather.py

from django.core.management.base import BaseCommand
from weather.services import fetch_weather_for_all_barangays

class Command(BaseCommand):
    help = 'Automatically fetch weather alerts for all barangays'

    def handle(self, *args, **kwargs):
        result = fetch_weather_for_all_barangays()
        self.stdout.write(self.style.SUCCESS(str(result)))
