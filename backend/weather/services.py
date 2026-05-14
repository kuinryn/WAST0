import requests
from django.conf import settings
from .models import WeatherAlert, NotificationLog, WeatherFetchStatus
from barangays.models import Barangay
from django.utils import timezone
from datetime import timedelta
from accounts.models import CustomUser
try:
    from firebase_admin import messaging
except ImportError:
    messaging = None

DAVAO_LAT = 7.1907
DAVAO_LON = 125.4553

def get_severity(code):
    if 200 <= code <= 232:   # Thunderstorm
        return 'high'
    if 500 <= code <= 531:   # Rain
        return 'moderate'
    if 300 <= code <= 321:   # Drizzle
        return 'low'
    return None

def get_openweather_api_key():
    api_key = settings.OPENWEATHERMAP_API_KEY
    if not api_key or api_key == 'your-openweathermap-key':
        return None
    return api_key

def find_worst_weather(forecasts):
    highest_severity = None
    worst_condition = None

    for forecast in forecasts:
        weather = forecast.get('weather') or []
        if not weather:
            continue
        weather_id = weather[0].get('id')
        condition = weather[0].get('description', 'weather condition')
        severity = get_severity(weather_id)

        if severity == 'high':
            return 'high', condition
        if severity == 'moderate' and highest_severity != 'high':
            highest_severity = 'moderate'
            worst_condition = condition
        elif severity == 'low' and highest_severity is None:
            highest_severity = 'low'
            worst_condition = condition

    return highest_severity, worst_condition

def request_openweather_forecast(params):
    try:
        response = requests.get(
            'https://api.openweathermap.org/data/2.5/forecast',
            params=params,
            timeout=10,
        )
    except requests.exceptions.RequestException:
        return None, {'error': 'Weather API unavailable', 'status': 503}

    if response.status_code >= 400:
        try:
            message = response.json().get('message', 'Weather API request failed')
        except ValueError:
            message = 'Weather API request failed'
        return None, {'error': message, 'status': response.status_code}

    try:
        return response.json(), None
    except ValueError:
        return None, {'error': 'Weather API returned an invalid response', 'status': 502}

def update_fetch_status(barangay, result):
    status, _ = WeatherFetchStatus.objects.get_or_create(barangay=barangay)
    status.last_checked_at = timezone.now()
    status.last_error = result.get('error', '')
    status.last_result = result.get('message') or result.get('condition') or result.get('error', '')
    status.save(update_fields=['last_checked_at', 'last_error', 'last_result'])

def weather_check_is_fresh(barangay):
    refresh_minutes = getattr(settings, 'WEATHER_REFRESH_MINUTES', 60)
    try:
        last_checked_at = barangay.weather_fetch_status.last_checked_at
    except WeatherFetchStatus.DoesNotExist:
        return False
    if not last_checked_at:
        return False
    return last_checked_at >= timezone.now() - timedelta(minutes=refresh_minutes)

def ensure_recent_weather_for_barangay(barangay, force=False):
    if not force and weather_check_is_fresh(barangay):
        return {'message': 'Weather data is already fresh.'}
    return fetch_weather_for_barangay(barangay)

def fetch_weather_for_barangay(barangay):
    api_key = get_openweather_api_key()
    if not api_key:
        result = {'error': 'OpenWeatherMap API key is not configured', 'status': 503}
        update_fetch_status(barangay, result)
        return result
    
    lat = getattr(barangay, 'latitude', DAVAO_LAT)
    lon = getattr(barangay, 'longitude', DAVAO_LON)
    
    data, error = request_openweather_forecast({
        'lat': lat,
        'lon': lon,
        'appid': api_key,
        'cnt': 8,
        'units': 'metric',
    })
    if error:
        update_fetch_status(barangay, error)
        return error

    highest_severity, worst_condition = find_worst_weather(data.get('list', []))

    if not highest_severity:
        result = {'message': 'No rain or storm detected in the next 24 hours.'}
        update_fetch_status(barangay, result)
        return result
    
    recent_alert = WeatherAlert.objects.filter(
        barangay=barangay,
        severity=highest_severity,
        condition=worst_condition,
        triggered_at__gte=timezone.now() - timedelta(hours=3)
    ).exists()

    if recent_alert:
        result = {'message': 'Duplicate alert skipped', 'severity': highest_severity, 'condition': worst_condition}
        update_fetch_status(barangay, result)
        return result

    alert = WeatherAlert.objects.create(
        barangay=barangay,
        condition=worst_condition,
        severity=highest_severity,
        message=f'Weather alert for {barangay.name}: {worst_condition}. Please dispose of waste properly.',
    )

    notification_result = send_fcm_to_barangay(barangay, alert)
    alert.notification_sent = notification_result['sent'] > 0
    alert.save(update_fields=['notification_sent'])

    result = {
        'alert_id': str(alert.id),
        'severity': highest_severity,
        'condition': worst_condition,
        'notifications': notification_result,
    }
    update_fetch_status(barangay, result)
    return result

def send_fcm_to_barangay(barangay, alert):
    users = CustomUser.objects.filter(
        barangay=barangay,
        fcm_token__isnull=False
    ).exclude(fcm_token='')
    sent = 0
    failed = 0

    for user in users:
        log_status = 'failed'
        try:
            if messaging:
                message = messaging.Message(
                    notification=messaging.Notification(
                        title=f'Weather Alert - {barangay.name}',
                        body=alert.message,
                    ),
                    data={
                        'alert_id': str(alert.id),
                        'severity': alert.severity,
                    },
                    token=user.fcm_token,
                )
                messaging.send(message)
                log_status = 'sent'
                sent += 1
            else:
                failed += 1
        except Exception:
            log_status = 'failed'
            failed += 1

        NotificationLog.objects.create(
            user=user,
            alert=alert,
            status=log_status
        )
    return {'sent': sent, 'failed': failed, 'total': users.count()}

# all barangays
def fetch_weather_for_all_barangays():
    api_key = get_openweather_api_key()
    if not api_key:
        return [{'error': 'OpenWeatherMap API key is not configured'}]

    data, error = request_openweather_forecast({
        'lat': DAVAO_LAT,
        'lon': DAVAO_LON,
        'appid': api_key,
        'cnt': 8,
        'units': 'metric',
    })
    if error:
        return [error]

    highest_severity, worst_condition = find_worst_weather(data.get('list', []))

    if not highest_severity:
        result = {'message': 'No rain or storm detected citywide.'}
        for barangay in Barangay.objects.all():
            update_fetch_status(barangay, result)
        return [result]

    # Apply to all barangays
    barangays = Barangay.objects.all()
    results = []
    for barangay in barangays:
        alert = WeatherAlert.objects.create(
            barangay=barangay,
            condition=worst_condition,
            severity=highest_severity,
            message=f'Weather alert for {barangay.name}: {worst_condition}. Please dispose of waste properly.',
        )
        notification_result = send_fcm_to_barangay(barangay, alert)
        alert.notification_sent = notification_result['sent'] > 0
        alert.save(update_fields=['notification_sent'])
        update_fetch_status(barangay, {
            'severity': highest_severity,
            'condition': worst_condition,
        })
        results.append({'barangay': barangay.name, 'severity': highest_severity})

    return results
