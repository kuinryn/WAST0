import logging
from datetime import timedelta

from django.http import HttpResponse
from django.utils import timezone
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from rest_framework import status
from .models import WasteSchedule
from .serializers import WasteScheduleSerializer
from .permissions import IsOfficialOrSuperAdmin, IsOfficialOfBarangay
from .google_calendar import (
    create_calendar_event,
    delete_calendar_event,
    generate_ical_event,
    generate_week_ical,
    update_calendar_event,
)
from weather.services import notify_schedule_change

logger = logging.getLogger(__name__)

class WasteScheduleListCreateView(APIView):
    def get_permissions(self):
        if self.request.method == 'GET':
            return [AllowAny()]
        return [IsOfficialOrSuperAdmin()]

    def get(self, request):
        schedules = WasteSchedule.objects.select_related('barangay', 'created_by').all()
        barangay_id = request.query_params.get('barangay')
        if barangay_id:
            schedules = schedules.filter(barangay__id=barangay_id)
        serializer = WasteScheduleSerializer(schedules, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = WasteScheduleSerializer(data=request.data)
        if serializer.is_valid():
            schedule = serializer.save(created_by=request.user)
            if schedule.calendar_sync_enabled:
                event_id = create_calendar_event(schedule)
                if event_id:
                    schedule.google_calendar_event_id = event_id
                    schedule.last_synced_at = timezone.now()
                    schedule.save(update_fields=['google_calendar_event_id', 'last_synced_at'])
            notify_schedule_change(schedule, 'created')
            return Response(WasteScheduleSerializer(schedule).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class WasteScheduleDetailView(APIView):
    permission_classes = [IsOfficialOrSuperAdmin]

    def get_object(self, pk):
        try:
            return WasteSchedule.objects.select_related('barangay', 'created_by').get(pk=pk)
        except WasteSchedule.DoesNotExist:
            return None

    def get(self, request, pk):
        schedule = self.get_object(pk)
        if not schedule:
            return Response({'error': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)
        return Response(WasteScheduleSerializer(schedule).data)

    def put(self, request, pk):
        schedule = self.get_object(pk)
        if not schedule:
            return Response({'error': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)
        perm = IsOfficialOfBarangay()
        if not perm.has_object_permission(request, self, schedule):
            return Response({'error': 'Forbidden.'}, status=status.HTTP_403_FORBIDDEN)
        serializer = WasteScheduleSerializer(schedule, data=request.data, partial=True)
        if serializer.is_valid():
            previous = {
                'waste_type': schedule.waste_type,
                'collection_day': schedule.collection_day,
                'collection_time': schedule.collection_time,
                'frequency': schedule.frequency,
                'status': schedule.status,
                'reschedule_date': schedule.reschedule_date,
            }
            updated = serializer.save()
            if updated.calendar_sync_enabled:
                if update_calendar_event(updated):
                    updated.last_synced_at = timezone.now()
                    updated.save(update_fields=['last_synced_at'])
            changed = any(getattr(updated, field) != value for field, value in previous.items())
            if changed:
                notify_schedule_change(updated)
            return Response(WasteScheduleSerializer(updated).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        schedule = self.get_object(pk)
        if not schedule:
            return Response({'error': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)
        perm = IsOfficialOfBarangay()
        if not perm.has_object_permission(request, self, schedule):
            return Response({'error': 'Forbidden.'}, status=status.HTTP_403_FORBIDDEN)
        if schedule.google_calendar_event_id:
            delete_calendar_event(schedule.google_calendar_event_id)
        schedule.status = 'cancelled'
        schedule.weather_recommendation = 'cancel'
        schedule.reschedule_date = None
        notify_schedule_change(schedule, 'deleted')
        schedule.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

class ScheduleCalendarSyncView(APIView):
    permission_classes = [IsOfficialOrSuperAdmin]

    def post(self, request, pk):
        try:
            schedule = WasteSchedule.objects.select_related('barangay').get(pk=pk)
        except WasteSchedule.DoesNotExist:
            return Response({'error': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)

        perm = IsOfficialOfBarangay()
        if not perm.has_object_permission(request, self, schedule):
            return Response({'error': 'Forbidden.'}, status=status.HTTP_403_FORBIDDEN)

        if schedule.google_calendar_event_id:
            success = update_calendar_event(schedule)
        else:
            event_id = create_calendar_event(schedule)
            success = bool(event_id)
            if success:
                schedule.google_calendar_event_id = event_id

        if not success:
            return Response(
                {'error': 'Failed to sync with Google Calendar. Check Google Calendar configuration.'},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        schedule.last_synced_at = timezone.now()
        schedule.save(update_fields=['google_calendar_event_id', 'last_synced_at'])
        return Response({
            'message': 'Schedule synced to Google Calendar.',
            'event_id': schedule.google_calendar_event_id,
            'synced_at': schedule.last_synced_at,
        })

class ScheduleICalDownloadView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, pk):
        try:
            schedule = WasteSchedule.objects.select_related('barangay').get(pk=pk)
        except WasteSchedule.DoesNotExist:
            return Response({'error': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)

        filename = f'wasto-{schedule.barangay.name}-{schedule.waste_type}.ics'
        response = HttpResponse(generate_ical_event(schedule), content_type='text/calendar; charset=utf-8')
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        return response

class BarangayWeekICalView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, barangay_id):
        schedules = WasteSchedule.objects.filter(
            barangay__id=barangay_id
        ).select_related('barangay').order_by('collection_day', 'collection_time')

        if not schedules.exists():
            return Response({'error': 'No schedules found for this barangay.'}, status=status.HTTP_404_NOT_FOUND)

        filename = f'wasto-{schedules.first().barangay.name}-all-schedules.ics'
        response = HttpResponse(generate_week_ical(schedules), content_type='text/calendar; charset=utf-8')
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        return response

class BulkCalendarSyncView(APIView):
    permission_classes = [IsOfficialOrSuperAdmin]

    def post(self, request):
        user = request.user
        if user.role == 'super_admin':
            barangay_id = request.data.get('barangay_id') or request.query_params.get('barangay')
            schedules = WasteSchedule.objects.select_related('barangay').all()
            if barangay_id:
                schedules = schedules.filter(barangay__id=barangay_id)
        else:
            if not user.barangay:
                return Response({'error': 'No barangay assigned.'}, status=status.HTTP_400_BAD_REQUEST)
            schedules = WasteSchedule.objects.filter(barangay=user.barangay).select_related('barangay')

        synced = 0
        failed = 0
        for schedule in schedules:
            try:
                if schedule.google_calendar_event_id:
                    success = update_calendar_event(schedule)
                else:
                    event_id = create_calendar_event(schedule)
                    success = bool(event_id)
                    if success:
                        schedule.google_calendar_event_id = event_id
                if success:
                    schedule.last_synced_at = timezone.now()
                    schedule.save(update_fields=['google_calendar_event_id', 'last_synced_at'])
                    synced += 1
                else:
                    failed += 1
            except Exception as exc:
                logger.error('Bulk sync error for schedule %s: %s', schedule.id, exc)
                failed += 1

        return Response({
            'message': f'Bulk sync complete: {synced} synced, {failed} failed.',
            'synced': synced,
            'failed': failed,
        })

class ScheduleWeatherActionView(APIView):
    permission_classes = [IsOfficialOrSuperAdmin]

    VALID_ACTIONS = {
        'continue': 'continued',
        'postpone': 'postponed',
        'cancel': 'cancelled',
        'reschedule': 'postponed',
    }

    def post(self, request, pk):
        try:
            schedule = WasteSchedule.objects.select_related('barangay').get(pk=pk)
        except WasteSchedule.DoesNotExist:
            return Response({'error': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)

        perm = IsOfficialOfBarangay()
        if not perm.has_object_permission(request, self, schedule):
            return Response({'error': 'Forbidden.'}, status=status.HTTP_403_FORBIDDEN)

        action = request.data.get('action')
        if action not in self.VALID_ACTIONS:
            return Response({'error': 'action must be continue, postpone, cancel, or reschedule.'}, status=status.HTTP_400_BAD_REQUEST)

        recommendation = request.data.get('weather_recommendation') or action
        schedule.status = self.VALID_ACTIONS[action]
        schedule.weather_recommendation = recommendation

        if action in ['postpone', 'reschedule']:
            reschedule_date = request.data.get('reschedule_date')
            if not reschedule_date:
                reschedule_date = timezone.localdate() + timedelta(days=2)
            schedule.reschedule_date = reschedule_date
        else:
            schedule.reschedule_date = None

        schedule.save(update_fields=['status', 'weather_recommendation', 'reschedule_date', 'updated_at'])
        notify_schedule_change(schedule, action)
        return Response(WasteScheduleSerializer(schedule).data)
