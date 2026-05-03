from django.core.management.base import BaseCommand
from weather.services import fetch_weather_for_all_barangays

class Command(BaseCommand):
    help = 'Fetch weather for all barangays and trigger alerts'

    def handle(self, *args, **kwargs):
        self.stdout.write('Fetching weather for all barangays...')
        results = fetch_weather_for_all_barangays()
        for r in results:
            self.stdout.write(str(r))
        self.stdout.write(self.style.SUCCESS('Done.'))