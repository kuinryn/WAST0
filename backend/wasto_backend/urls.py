from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse

def health_check(request):
    return JsonResponse({'status': 'ok'})

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/health/', health_check),
    path('api/v1/auth/', include('accounts.urls')),
    path('api/v1/barangays/', include('barangays.urls')),
    path('api/v1/schedules/', include('schedules.urls')),
    path('api/v1/weather/', include('weather.urls')),
    path('api/v1/notifications/', include('weather.notification_urls')),
    path('api/v1/audit/', include('audit.urls')),
]