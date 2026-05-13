from django.urls import path
from .views import NotificationLogDetailView, NotificationLogListView, NotificationMarkReadView

urlpatterns = [
    path('', NotificationLogListView.as_view(), name='notification-logs'),
    path('<uuid:pk>/', NotificationLogDetailView.as_view(), name='notification-detail'),
    path('mark-read/', NotificationMarkReadView.as_view(), name='notification-mark-read'),
]
