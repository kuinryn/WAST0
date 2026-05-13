from django.urls import path
from .views import NotificationLogListView, NotificationMarkReadView

urlpatterns = [
    path('', NotificationLogListView.as_view(), name='notification-logs'),
    path('mark-read/', NotificationMarkReadView.as_view(), name='notification-mark-read'),
]
