from django.urls import path
from .views import BarangayListCreateView, BarangayDetailView

urlpatterns = [
    path('', BarangayListCreateView.as_view(), name='barangay-list-create'),
    path('<uuid:pk>/', BarangayDetailView.as_view(), name='barangay-detail'),
]