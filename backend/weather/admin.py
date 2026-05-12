from django.contrib import admin
from .models import WeatherAlert, NotificationLog, WeatherFetchStatus
admin.site.register(WeatherAlert)
admin.site.register(NotificationLog)
admin.site.register(WeatherFetchStatus)
