from django.urls import path
from .views import WeatherAlertListView, FetchWeatherView

urlpatterns = [
    path('alerts/', WeatherAlertListView.as_view(), name='weather-alerts'),
    path('fetch/', FetchWeatherView.as_view(), name='fetch-weather'),
]