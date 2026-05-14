from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    AdminUserDetailView,
    AdminUserListCreateView,
    FcmTokenView,
    RegisterView,
    LoginView,
    ProfileView,
)

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', LoginView.as_view(), name='login'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('profile/', ProfileView.as_view(), name='profile'),
    path('me/', ProfileView.as_view(), name='me'),  # alias for v2 frontend compatibility
    path('fcm-token/', FcmTokenView.as_view(), name='fcm_token'),
    path('fcm_token/', FcmTokenView.as_view(), name='fcm_token_alt'),
    path('users/', AdminUserListCreateView.as_view(), name='admin_users'),
    path('users/<uuid:pk>/', AdminUserDetailView.as_view(), name='admin_user_detail'),
]
