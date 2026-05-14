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
    path('', WasteScheduleListCreateView.as_view(), name='schedule-list-create'),
    path('sync-all/', BulkCalendarSyncView.as_view(), name='schedule-sync-all'),
    path('barangay/<uuid:barangay_id>/ical/', BarangayWeekICalView.as_view(), name='barangay-ical'),
    path('<uuid:pk>/', WasteScheduleDetailView.as_view(), name='schedule-detail'),
    path('<uuid:pk>/sync/', ScheduleCalendarSyncView.as_view(), name='schedule-calendar-sync'),
    path('<uuid:pk>/ical/', ScheduleICalDownloadView.as_view(), name='schedule-ical'),
]
