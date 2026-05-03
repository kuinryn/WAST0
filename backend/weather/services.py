import requests
from django.conf import settings
from .models import WeatherAlert, NotificationLog
from barangays.models import Barangay
from accounts.models import CustomUser

STORM_CODES = range(200, 233)
DRIZZLE_CODES = range(300, 322)
RAIN_CODES = range(500, 532)

def get_severity(code):
    if code in STORM_CODES:
        return 'high'
    if code in RAIN_CODES:
        return 'moderate'
    if code in DRIZZLE_CODES:
        return 'low'
    return None

def fetch_weather_for_barangay(barangay):
    api_key = settings.OPENWEATHERMAP_API_KEY
    query = f'{barangay.name}, Davao City, PH'
    url = f'https://api.openweathermap.org/data/2.5/weather?q={query}&appid={api_key}'

    try:
        response = requests.get(url, timeout=10)
        response.raise_for_status()
        data = response.json()
    except requests.exceptions.RequestException:
        return {'error': 'Weather API unavailable', 'status': 503}

    weather_id = data['weather'][0]['id']
    condition = data['weather'][0]['description']
    severity = get_severity(weather_id)

    if not severity:
        return {'message': 'No rain or storm detected.'}

    alert = WeatherAlert.objects.create(
        barangay=barangay,
        condition=condition,
        severity=severity,
        message=f'Weather alert for {barangay.name}: {condition}. Please dispose of waste properly.',
    )

    send_fcm_to_barangay(barangay, alert)
    alert.notification_sent = True
    alert.save()

    return {'alert_id': str(alert.id), 'severity': severity, 'condition': condition}

def send_fcm_to_barangay(barangay, alert):
    users = CustomUser.objects.filter(barangay=barangay, fcm_token__isnull=False).exclude(fcm_token='')
    server_key = settings.FIREBASE_SERVER_KEY
    headers = {
        'Authorization': f'key={server_key}',
        'Content-Type': 'application/json',
    }
    for user in users:
        payload = {
            'to': user.fcm_token,
            'notification': {
                'title': f'Weather Alert - {barangay.name}',
                'body': alert.message,
            },
            'data': {
                'alert_id': str(alert.id),
                'severity': alert.severity,
            }
        }
        try:
            r = requests.post('https://fcm.googleapis.com/fcm/send', json=payload, headers=headers, timeout=10)
            log_status = 'sent' if r.status_code == 200 else 'failed'
        except requests.exceptions.RequestException:
            log_status = 'failed'

        NotificationLog.objects.create(user=user, alert=alert, status=log_status)

def fetch_weather_for_all_barangays():
    barangays = Barangay.objects.all()
    results = []
    for barangay in barangays:
        result = fetch_weather_for_barangay(barangay)
        results.append({'barangay': barangay.name, **result})
    return results