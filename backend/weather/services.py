import requests
from django.conf import settings
from .models import WeatherAlert, NotificationLog, WeatherFetchStatus
from barangays.models import Barangay
from django.utils import timezone
from datetime import datetime, timedelta
from accounts.models import CustomUser
from schedules.models import WasteSchedule
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

def classify_weather(code):
    if code is None:
        return 'cloudy'
    if 200 <= code <= 232:
        return 'thunderstorm'
    if 300 <= code <= 321:
        return 'drizzle'
    if 500 <= code <= 531:
        return 'rainy'
    if 600 <= code <= 622:
        return 'snowy'
    if 701 <= code <= 781:
        return 'misty'
    if code == 800:
        return 'sunny'
    if 801 <= code <= 804:
        return 'cloudy'
    return 'cloudy'

def build_disposal_suggestion(weather_type, severity, has_schedule):
    if not has_schedule:
        return {
            'active': False,
            'label': 'No disposal scheduled',
            'message': 'Keep waste secured and follow your barangay collection timetable.',
        }
    if weather_type in ['thunderstorm'] or severity == 'high':
        return {
            'active': True,
            'label': 'Recommended to cancel disposal',
            'message': 'Severe weather may make collection unsafe. Wait for the barangay advisory.',
        }
    if weather_type in ['rainy', 'drizzle'] or severity == 'moderate':
        return {
            'active': True,
            'label': 'Prepare waste carefully',
            'message': 'Tie bags securely, cover bins, and keep waste away from drainage paths.',
        }
    return {
        'active': True,
        'label': 'Dispose your garbage properly',
        'message': 'Bring waste out on time and keep it segregated before collection.',
    }

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

def get_forecast_time(forecast):
    timestamp = forecast.get('dt')
    if timestamp:
        return datetime.fromtimestamp(timestamp, tz=timezone.get_current_timezone())
    text_time = forecast.get('dt_txt')
    if text_time:
        naive = datetime.strptime(text_time, '%Y-%m-%d %H:%M:%S')
        return timezone.make_aware(naive, timezone.get_current_timezone())
    return None

def get_tomorrow_forecasts(forecasts):
    tomorrow = (timezone.localdate() + timedelta(days=1))
    tomorrow_items = []
    for forecast in forecasts:
        forecast_time = get_forecast_time(forecast)
        if forecast_time and forecast_time.date() == tomorrow:
            tomorrow_items.append(forecast)
    return tomorrow_items

def group_forecast_by_day(forecasts, schedules=None):
    schedules = schedules or []
    schedules_by_day = {}
    for schedule in schedules:
        schedules_by_day.setdefault(schedule.collection_day, []).append(schedule)

    grouped = {}
    for forecast in forecasts:
        forecast_time = get_forecast_time(forecast)
        if not forecast_time:
            continue
        day_key = str(forecast_time.date())
        grouped.setdefault(day_key, []).append(forecast)

    today = timezone.localdate()
    days = []
    for date_text in sorted(grouped.keys()):
        date_value = datetime.strptime(date_text, '%Y-%m-%d').date()
        day_name = date_value.strftime('%A')
        items = grouped[date_text]
        worst_severity, worst_condition = find_worst_weather(items)
        max_pop = max(float(item.get('pop') or 0) for item in items)
        max_rain = max(float((item.get('rain') or {}).get('3h') or 0) for item in items)
        codes = [
            weather.get('id')
            for item in items
            for weather in (item.get('weather') or [])
            if weather.get('id') is not None
        ]
        descriptions = [
            weather.get('description')
            for item in items
            for weather in (item.get('weather') or [])
            if weather.get('description')
        ]
        weather_type = classify_weather(codes[0] if codes else None)
        day_schedules = schedules_by_day.get(day_name, [])
        suggestion_is_active = date_value in [today, today + timedelta(days=1)] and bool(day_schedules)

        days.append({
            'date': date_text,
            'day': day_name,
            'label': 'Today' if date_value == today else 'Tomorrow' if date_value == today + timedelta(days=1) else day_name,
            'condition': worst_condition or (descriptions[0] if descriptions else weather_type),
            'weather_type': weather_type,
            'severity': worst_severity or 'none',
            'rain_probability': round(max_pop * 100),
            'rain_volume_mm': round(max_rain, 2),
            'schedules': [
                {
                    'id': str(schedule.id),
                    'waste_type': schedule.waste_type,
                    'collection_time': schedule.collection_time.strftime('%H:%M:%S'),
                    'status': schedule.status,
                    'reschedule_date': schedule.reschedule_date,
                }
                for schedule in day_schedules
            ],
            'suggestion': build_disposal_suggestion(weather_type, worst_severity, suggestion_is_active),
        })
    return days

def analyze_tomorrow_weather(forecasts):
    tomorrow_items = get_tomorrow_forecasts(forecasts)
    if not tomorrow_items:
        return None

    worst_severity, worst_condition = find_worst_weather(tomorrow_items)
    max_pop = max(float(item.get('pop') or 0) for item in tomorrow_items)
    max_rain = max(float((item.get('rain') or {}).get('3h') or 0) for item in tomorrow_items)
    weather_codes = [
        weather.get('id')
        for item in tomorrow_items
        for weather in (item.get('weather') or [])
        if weather.get('id') is not None
    ]
    conditions = [
        weather.get('description')
        for item in tomorrow_items
        for weather in (item.get('weather') or [])
        if weather.get('description')
    ]

    has_thunderstorm = any(200 <= code <= 232 for code in weather_codes)
    has_heavy_rain = any(502 <= code <= 531 for code in weather_codes) or max_rain >= 15
    has_rain = any(500 <= code <= 531 for code in weather_codes) or max_pop >= 0.4 or max_rain > 0

    if has_thunderstorm or max_pop >= 0.85 or max_rain >= 25:
        recommendation = 'cancel'
        reason = 'High chance of severe rain or thunderstorm tomorrow.'
    elif has_heavy_rain or max_pop >= 0.6:
        recommendation = 'postpone'
        reason = 'Rain is likely tomorrow and may disrupt collection.'
    elif has_rain:
        recommendation = 'continue'
        reason = 'Some rain is possible, but collection can continue with caution.'
    else:
        recommendation = 'continue'
        reason = 'No disruptive rain is expected tomorrow.'

    return {
        'date': str(timezone.localdate() + timedelta(days=1)),
        'condition': worst_condition or (conditions[0] if conditions else 'clear weather'),
        'severity': worst_severity or 'none',
        'rain_probability': round(max_pop * 100),
        'rain_volume_mm': round(max_rain, 2),
        'recommendation': recommendation,
        'reason': reason,
    }

def get_tomorrow_collection_schedules(barangay):
    tomorrow_day = (timezone.localdate() + timedelta(days=1)).strftime('%A')
    return WasteSchedule.objects.filter(barangay=barangay, collection_day=tomorrow_day).order_by('collection_time')

def get_tomorrow_weather_recommendation(barangay):
    api_key = get_openweather_api_key()
    if not api_key:
        return {'error': 'OpenWeatherMap API key is not configured', 'status': 503}

    lat = getattr(barangay, 'latitude', DAVAO_LAT)
    lon = getattr(barangay, 'longitude', DAVAO_LON)
    data, error = request_openweather_forecast({
        'lat': lat,
        'lon': lon,
        'appid': api_key,
        'cnt': 16,
        'units': 'metric',
    })
    if error:
        return error

    weather = analyze_tomorrow_weather(data.get('list', []))
    if not weather:
        return {'error': 'No forecast data available for tomorrow.', 'status': 502}

    schedules = get_tomorrow_collection_schedules(barangay)
    return {
        'barangay': str(barangay.id),
        'barangay_name': barangay.name,
        'weather': weather,
        'schedules': [
            {
                'id': str(schedule.id),
                'waste_type': schedule.waste_type,
                'collection_day': schedule.collection_day,
                'collection_time': schedule.collection_time.strftime('%H:%M:%S'),
                'status': schedule.status,
                'weather_recommendation': schedule.weather_recommendation,
                'reschedule_date': schedule.reschedule_date,
            }
            for schedule in schedules
        ],
    }

def get_weather_updates(barangay):
    api_key = get_openweather_api_key()
    if not api_key:
        return {'error': 'OpenWeatherMap API key is not configured', 'status': 503}

    lat = getattr(barangay, 'latitude', DAVAO_LAT)
    lon = getattr(barangay, 'longitude', DAVAO_LON)
    data, error = request_openweather_forecast({
        'lat': lat,
        'lon': lon,
        'appid': api_key,
        'cnt': 40,
        'units': 'metric',
    })
    if error:
        return error

    schedules = WasteSchedule.objects.filter(barangay=barangay).order_by('collection_day', 'collection_time')
    days = group_forecast_by_day(data.get('list', []), schedules)
    return {
        'barangay': str(barangay.id),
        'barangay_name': barangay.name,
        'days': days,
    }

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
        role='resident',
    )
    sent = 0
    failed = 0

    for user in users:
        title = f'Weather Alert - {barangay.name}'
        log_status = 'sent'
        try:
            if messaging and user.fcm_token:
                message = messaging.Message(
                    notification=messaging.Notification(
                        title=title,
                        body=alert.message,
                    ),
                    data={
                        'alert_id': str(alert.id),
                        'severity': alert.severity,
                        'category': 'weather',
                    },
                    token=user.fcm_token,
                )
                messaging.send(message)
                sent += 1
        except Exception:
            log_status = 'failed'
            failed += 1

        NotificationLog.objects.create(
            user=user,
            alert=alert,
            category='weather',
            title=title,
            message=alert.message,
            status=log_status,
        )
    return {'sent': sent, 'failed': failed, 'total': users.count()}

def notify_schedule_change(schedule, action='updated'):
    users = CustomUser.objects.filter(barangay=schedule.barangay, role='resident')
    waste_label = schedule.waste_type.replace('_', ' ').title()
    barangay_name = schedule.barangay.name if schedule.barangay else 'your barangay'
    title = 'New collection schedule' if action == 'created' else 'Collection schedule updated'

    if action in ['postpone', 'reschedule'] and schedule.reschedule_date:
        message = (
            f'{waste_label} collection in {barangay_name} has been rescheduled '
            f'to {schedule.reschedule_date}.'
        )
    elif action == 'cancel':
        message = f'{waste_label} collection in {barangay_name} has been cancelled.'
    elif action == 'continue':
        message = f'{waste_label} collection in {barangay_name} will continue as scheduled.'
    elif action == 'created':
        message = (
            f'New {waste_label} collection in {barangay_name} is scheduled for '
            f'{schedule.collection_day} at {schedule.collection_time.strftime("%H:%M")}.'
        )
    else:
        message = (
            f'{waste_label} collection in {barangay_name} is now set for '
            f'{schedule.collection_day} at {schedule.collection_time.strftime("%H:%M")}.'
        )

    sent = 0
    failed = 0
    for user in users:
        log_status = 'sent'
        try:
            if messaging and user.fcm_token:
                message_payload = messaging.Message(
                    notification=messaging.Notification(title=title, body=message),
                    data={
                        'category': 'schedule',
                        'schedule_id': str(schedule.id),
                        'status': schedule.status,
                    },
                    token=user.fcm_token,
                )
                messaging.send(message_payload)
                sent += 1
        except Exception:
            log_status = 'failed'
            failed += 1

        NotificationLog.objects.create(
            user=user,
            category='schedule',
            title=title,
            message=message,
            status=log_status,
        )

    return {'sent': sent, 'failed': failed, 'total': users.count()}

def ensure_upcoming_schedule_notifications(user):
    if not user.barangay_id or user.role != 'resident':
        return 0

    tomorrow = timezone.localdate() + timedelta(days=1)
    tomorrow_day = tomorrow.strftime('%A')
    schedules = WasteSchedule.objects.filter(
        barangay=user.barangay,
        collection_day=tomorrow_day,
        status__in=['scheduled', 'continued'],
    )
    created = 0
    for schedule in schedules:
        waste_label = schedule.waste_type.replace('_', ' ').title()
        title = 'Collection schedule tomorrow'
        message = f'{waste_label} collection is scheduled tomorrow at {schedule.collection_time.strftime("%H:%M")}.'
        already_sent = NotificationLog.objects.filter(
            user=user,
            category='schedule',
            title=title,
            message=message,
            sent_at__date=timezone.localdate(),
        ).exists()
        if not already_sent:
            NotificationLog.objects.create(
                user=user,
                category='schedule',
                title=title,
                message=message,
                status='sent',
            )
            created += 1
    return created

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
