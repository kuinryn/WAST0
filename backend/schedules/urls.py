from django.urls import path
from .views import (
    WasteScheduleListCreateView,
    WasteScheduleDetailView,
    ScheduleCalendarSyncView,
    ScheduleICalDownloadView,
    BarangayWeekICalView,
    BulkCalendarSyncView,
)

urlpatterns = [
    # Core CRUD
    path('', WasteScheduleListCreateView.as_view(), name='schedule-list-create'),
    path('<uuid:pk>/', WasteScheduleDetailView.as_view(), name='schedule-detail'),

    # Google Calendar sync (per schedule)
    path('<uuid:pk>/sync/', ScheduleCalendarSyncView.as_view(), name='schedule-calendar-sync'),

    # iCal downloads (no auth required — shareable links)
    path('<uuid:pk>/ical/', ScheduleICalDownloadView.as_view(), name='schedule-ical'),
    path('barangay/<uuid:barangay_id>/ical/', BarangayWeekICalView.as_view(), name='barangay-ical'),

    # Bulk sync all schedules for a barangay
    path('sync-all/', BulkCalendarSyncView.as_view(), name='schedule-sync-all'),
]
