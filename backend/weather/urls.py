from django.urls import path
from .views import FetchWeatherView, TomorrowWeatherRecommendationView, WeatherAlertListView, WeatherUpdatesView

urlpatterns = [
    path('alerts/', WeatherAlertListView.as_view(), name='weather-alerts'),
    path('fetch/', FetchWeatherView.as_view(), name='fetch-weather'),
    path('updates/', WeatherUpdatesView.as_view(), name='weather-updates'),
    path('tomorrow-recommendation/', TomorrowWeatherRecommendationView.as_view(), name='tomorrow-weather-recommendation'),
]
