from django.contrib import admin
from .models import WeatherAlert, NotificationLog
admin.site.register(WeatherAlert)
admin.site.register(NotificationLog)