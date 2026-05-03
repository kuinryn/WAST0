from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from .models import WeatherAlert, NotificationLog
from .serializers import WeatherAlertSerializer, NotificationLogSerializer
from .services import fetch_weather_for_barangay
from barangays.models import Barangay
from barangays.permissions import IsSuperAdmin
from schedules.permissions import IsOfficialOrSuperAdmin

class WeatherAlertListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        alerts = WeatherAlert.objects.all().order_by('-triggered_at')
        barangay_id = request.query_params.get('barangay')
        if barangay_id:
            alerts = alerts.filter(barangay__id=barangay_id)
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
            return Response(result, status=status.HTTP_503_SERVICE_UNAVAILABLE)
        return Response(result, status=status.HTTP_200_OK)

class NotificationLogListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        logs = NotificationLog.objects.filter(user=request.user).order_by('-sent_at')
        serializer = NotificationLogSerializer(logs, many=True)
        return Response(serializer.data)