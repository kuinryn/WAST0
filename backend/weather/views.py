from django.utils import timezone
from datetime import timedelta
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from .models import WeatherAlert, NotificationLog
from .serializers import WeatherAlertSerializer, NotificationLogSerializer
from .services import (
    ensure_upcoming_schedule_notifications,
    ensure_recent_weather_for_barangay,
    fetch_weather_for_barangay,
    get_tomorrow_weather_recommendation,
    get_weather_updates,
)
from barangays.models import Barangay
from barangays.permissions import IsSuperAdmin
from schedules.permissions import IsOfficialOrSuperAdmin

class WeatherAlertListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        alerts = WeatherAlert.objects.all().order_by('-triggered_at')
        barangay_id = request.query_params.get('barangay')
        if barangay_id:
            try:
                barangay = Barangay.objects.get(pk=barangay_id)
            except Barangay.DoesNotExist:
                return Response({'error': 'Barangay not found.'}, status=status.HTTP_404_NOT_FOUND)

            ensure_recent_weather_for_barangay(barangay)
            alerts = alerts.filter(barangay=barangay)
        if request.query_params.get('include_expired') not in ['1', 'true', 'True']:
            alerts = alerts.filter(triggered_at__gte=timezone.now() - timedelta(hours=24))
        serializer = WeatherAlertSerializer(alerts, many=True)
        return Response(serializer.data)

class FetchWeatherView(APIView):
    permission_classes = [IsOfficialOrSuperAdmin]

    def post(self, request):
        barangay_id = request.data.get('barangay_id')
        if not barangay_id:
            return Response({'error': 'barangay_id is required.'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            barangay = Barangay.objects.get(pk=barangay_id)
        except Barangay.DoesNotExist:
            return Response({'error': 'Barangay not found.'}, status=status.HTTP_404_NOT_FOUND)

        result = fetch_weather_for_barangay(barangay)
        if 'error' in result:
            response_status = result.get('status', status.HTTP_503_SERVICE_UNAVAILABLE)
            return Response(result, status=response_status)
        return Response(result, status=status.HTTP_200_OK)

class TomorrowWeatherRecommendationView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        barangay_id = request.query_params.get('barangay') or getattr(request.user, 'barangay_id', None)
        if not barangay_id:
            return Response({'error': 'barangay is required.'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            barangay = Barangay.objects.get(pk=barangay_id)
        except Barangay.DoesNotExist:
            return Response({'error': 'Barangay not found.'}, status=status.HTTP_404_NOT_FOUND)

        result = get_tomorrow_weather_recommendation(barangay)
        if 'error' in result:
            response_status = result.get('status', status.HTTP_503_SERVICE_UNAVAILABLE)
            return Response(result, status=response_status)
        return Response(result)

class WeatherUpdatesView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        barangay_id = request.query_params.get('barangay') or getattr(request.user, 'barangay_id', None)
        if not barangay_id:
            return Response({'error': 'barangay is required.'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            barangay = Barangay.objects.get(pk=barangay_id)
        except Barangay.DoesNotExist:
            return Response({'error': 'Barangay not found.'}, status=status.HTTP_404_NOT_FOUND)

        result = get_weather_updates(barangay)
        if 'error' in result:
            response_status = result.get('status', status.HTTP_503_SERVICE_UNAVAILABLE)
            return Response(result, status=response_status)
        return Response(result)

class NotificationLogListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        ensure_upcoming_schedule_notifications(request.user)
        logs = NotificationLog.objects.filter(user=request.user).order_by('-sent_at')
        serializer = NotificationLogSerializer(logs, many=True)
        return Response(serializer.data)


class NotificationMarkReadView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        notification_id = request.data.get('notification_id')
        logs = NotificationLog.objects.filter(user=request.user, read_at__isnull=True)
        if notification_id:
            logs = logs.filter(pk=notification_id)

        updated = logs.update(read_at=timezone.now())
        return Response({'marked_read': updated})
