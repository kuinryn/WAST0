import logging
from datetime import datetime, timezone

from django.http import HttpResponse
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework import status

from .models import WasteSchedule
from .serializers import WasteScheduleSerializer
from .permissions import IsOfficialOrSuperAdmin, IsOfficialOfBarangay
from .google_calendar import (
    create_calendar_event,
    update_calendar_event,
    delete_calendar_event,
    generate_ical_event,
    generate_week_ical,
)

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
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        schedule = serializer.save(created_by=request.user)

        # Sync to Google Calendar
        if schedule.calendar_sync_enabled:
            event_id = create_calendar_event(schedule)
            if event_id:
                schedule.google_calendar_event_id = event_id
                schedule.last_synced_at = datetime.now(timezone.utc)
                schedule.save(update_fields=['google_calendar_event_id', 'last_synced_at'])

        return Response(WasteScheduleSerializer(schedule).data, status=status.HTTP_201_CREATED)


class WasteScheduleDetailView(APIView):
    permission_classes = [IsOfficialOrSuperAdmin]

    def get_object(self, pk):
        try:
            return WasteSchedule.objects.select_related('barangay', 'created_by').get(pk=pk)
        except WasteSchedule.DoesNotExist:
            return None

    def get(self, request, pk):
        """Public detail view — no auth needed."""
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
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        updated = serializer.save()

        # Sync update to Google Calendar
        if updated.calendar_sync_enabled:
            success = update_calendar_event(updated)
            if success:
                updated.last_synced_at = datetime.now(timezone.utc)
                updated.save(update_fields=['last_synced_at'])

        return Response(WasteScheduleSerializer(updated).data)

    def delete(self, request, pk):
        schedule = self.get_object(pk)
        if not schedule:
            return Response({'error': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)
        perm = IsOfficialOfBarangay()
        if not perm.has_object_permission(request, self, schedule):
            return Response({'error': 'Forbidden.'}, status=status.HTTP_403_FORBIDDEN)

        # Remove from Google Calendar first
        if schedule.google_calendar_event_id:
            delete_calendar_event(schedule.google_calendar_event_id)

        schedule.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class ScheduleCalendarSyncView(APIView):
    """
    POST /api/v1/schedules/<uuid:pk>/sync/
    Manually trigger a Google Calendar sync for a single schedule.
    """
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

        if success:
            schedule.last_synced_at = datetime.now(timezone.utc)
            schedule.save(update_fields=['google_calendar_event_id', 'last_synced_at'])
            return Response({
                'message': 'Schedule synced to Google Calendar.',
                'event_id': schedule.google_calendar_event_id,
                'synced_at': schedule.last_synced_at,
            })
        else:
            return Response(
                {'error': 'Failed to sync with Google Calendar. Check server logs and ensure GOOGLE_SERVICE_ACCOUNT_FILE is configured.'},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )


class ScheduleICalDownloadView(APIView):
    """
    GET /api/v1/schedules/<uuid:pk>/ical/
    Download a single schedule as an .ics file for any calendar app.
    No authentication required — public download.
    """
    permission_classes = [AllowAny]

    def get(self, request, pk):
        try:
            schedule = WasteSchedule.objects.select_related('barangay').get(pk=pk)
        except WasteSchedule.DoesNotExist:
            return Response({'error': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)

        ical_content = generate_ical_event(schedule)
        waste_label = schedule.waste_type.replace('_', '-')
        filename = f'wasto-{schedule.barangay.name}-{waste_label}.ics'

        response = HttpResponse(ical_content, content_type='text/calendar; charset=utf-8')
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        return response


class BarangayWeekICalView(APIView):
    """
    GET /api/v1/schedules/barangay/<uuid:barangay_id>/ical/
    Download all schedules for a barangay as a single .ics file.
    No authentication required — public download.
    """
    permission_classes = [AllowAny]

    def get(self, request, barangay_id):
        schedules = WasteSchedule.objects.filter(
            barangay__id=barangay_id
        ).select_related('barangay').order_by('collection_day', 'collection_time')

        if not schedules.exists():
            return Response({'error': 'No schedules found for this barangay.'}, status=status.HTTP_404_NOT_FOUND)

        barangay_name = schedules.first().barangay.name
        ical_content = generate_week_ical(schedules)
        filename = f'wasto-{barangay_name}-all-schedules.ics'

        response = HttpResponse(ical_content, content_type='text/calendar; charset=utf-8')
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        return response


class BulkCalendarSyncView(APIView):
    """
    POST /api/v1/schedules/sync-all/
    Sync all schedules for the official's barangay to Google Calendar.
    Super admin can optionally pass ?barangay=<id> to sync a specific barangay.
    """
    permission_classes = [IsOfficialOrSuperAdmin]

    def post(self, request):
        user = request.user

        if user.role == 'super_admin':
            barangay_id = request.data.get('barangay_id') or request.query_params.get('barangay')
            if barangay_id:
                schedules = WasteSchedule.objects.filter(barangay__id=barangay_id).select_related('barangay')
            else:
                schedules = WasteSchedule.objects.select_related('barangay').all()
        else:
            if not user.barangay:
                return Response({'error': 'No barangay assigned.'}, status=status.HTTP_400_BAD_REQUEST)
            schedules = WasteSchedule.objects.filter(barangay=user.barangay).select_related('barangay')

        synced, failed = 0, 0
        for schedule in schedules:
            try:
                if schedule.google_calendar_event_id:
                    ok = update_calendar_event(schedule)
                else:
                    event_id = create_calendar_event(schedule)
                    ok = bool(event_id)
                    if ok:
                        schedule.google_calendar_event_id = event_id

                if ok:
                    schedule.last_synced_at = datetime.now(timezone.utc)
                    schedule.save(update_fields=['google_calendar_event_id', 'last_synced_at'])
                    synced += 1
                else:
                    failed += 1
            except Exception as e:
                logger.error(f"Bulk sync error for schedule {schedule.id}: {e}")
                failed += 1

        return Response({
            'message': f'Bulk sync complete: {synced} synced, {failed} failed.',
            'synced': synced,
            'failed': failed,
        })
