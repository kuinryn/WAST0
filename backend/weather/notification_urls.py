from django.urls import path
from .views import NotificationLogListView

urlpatterns = [
    path('', NotificationLogListView.as_view(), name='notification-logs'),
]