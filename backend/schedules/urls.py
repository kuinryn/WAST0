from django.urls import path
from .views import WasteScheduleListCreateView, WasteScheduleDetailView

urlpatterns = [
    path('', WasteScheduleListCreateView.as_view(), name='schedule-list-create'),
    path('<uuid:pk>/', WasteScheduleDetailView.as_view(), name='schedule-detail'),
]