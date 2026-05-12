import json
import logging
import os
from datetime import date, datetime, timedelta

logger = logging.getLogger(__name__)

CALENDAR_ID = os.getenv('GOOGLE_CALENDAR_ID', 'primary')
DAY_TO_WEEKDAY = {
    'Monday': 0,
    'Tuesday': 1,
    'Wednesday': 2,
    'Thursday': 3,
    'Friday': 4,
    'Saturday': 5,
    'Sunday': 6,
}
RRULE_DAYS = {
    'Monday': 'MO',
    'Tuesday': 'TU',
    'Wednesday': 'WE',
    'Thursday': 'TH',
    'Friday': 'FR',
    'Saturday': 'SA',
    'Sunday': 'SU',
}


def _get_service():
    try:
        from google.oauth2 import service_account
        from googleapiclient.discovery import build
    except ImportError:
        logger.error('Google Calendar dependencies are not installed.')
        return None

    service_account_file = os.getenv('GOOGLE_SERVICE_ACCOUNT_FILE', '')
    service_account_json = os.getenv('GOOGLE_SERVICE_ACCOUNT_JSON', '')

    try:
        if service_account_json:
            credentials = service_account.Credentials.from_service_account_info(
                json.loads(service_account_json),
                scopes=['https://www.googleapis.com/auth/calendar'],
            )
        elif service_account_file and os.path.exists(service_account_file):
            credentials = service_account.Credentials.from_service_account_file(
                service_account_file,
                scopes=['https://www.googleapis.com/auth/calendar'],
            )
        else:
            logger.warning('No Google Calendar service account configured.')
            return None
        return build('calendar', 'v3', credentials=credentials)
    except Exception as exc:
        logger.error('Failed to initialize Google Calendar service: %s', exc)
        return None


def _next_weekday(weekday_num):
    today = date.today()
    days_ahead = weekday_num - today.weekday()
    if days_ahead <= 0:
        days_ahead += 7
    return today + timedelta(days=days_ahead)


def _schedule_datetimes(schedule):
    start_date = _next_weekday(DAY_TO_WEEKDAY[schedule.collection_day])
    collection_time = schedule.collection_time
    hour = collection_time.hour if hasattr(collection_time, 'hour') else int(str(collection_time).split(':')[0])
    minute = collection_time.minute if hasattr(collection_time, 'minute') else int(str(collection_time).split(':')[1])
    start_dt = datetime(start_date.year, start_date.month, start_date.day, hour, minute)
    return start_dt, start_dt + timedelta(hours=1)


def _recurrence_rule(schedule):
    interval = ';INTERVAL=2' if schedule.frequency == 'bi_weekly' else ''
    return f'RRULE:FREQ=WEEKLY{interval};BYDAY={RRULE_DAYS[schedule.collection_day]}'


def _build_event(schedule):
    start_dt, end_dt = _schedule_datetimes(schedule)
    waste_label = schedule.waste_type.replace('_', ' ').title()
    barangay_name = schedule.barangay.name if schedule.barangay else 'Barangay'
    return {
        'summary': f'{waste_label} Collection - Barangay {barangay_name}',
        'description': (
            f'Waste Type: {waste_label}\n'
            f'Barangay: {barangay_name}\n'
            f'Collection Day: {schedule.collection_day}\n'
            f'Frequency: {schedule.frequency.replace("_", "-").title()}\n'
            f'Time: {start_dt.strftime("%I:%M %p")}\n\n'
            'Managed by Wasto'
        ),
        'start': {'dateTime': start_dt.isoformat(), 'timeZone': 'Asia/Manila'},
        'end': {'dateTime': end_dt.isoformat(), 'timeZone': 'Asia/Manila'},
        'recurrence': [_recurrence_rule(schedule)],
        'reminders': {
            'useDefault': False,
            'overrides': [
                {'method': 'popup', 'minutes': 60},
                {'method': 'popup', 'minutes': 1440},
            ],
        },
    }


def create_calendar_event(schedule):
    service = _get_service()
    if not service:
        return None
    try:
        event = service.events().insert(calendarId=CALENDAR_ID, body=_build_event(schedule)).execute()
        return event.get('id')
    except Exception as exc:
        logger.error('Failed to create Google Calendar event: %s', exc)
        return None


def update_calendar_event(schedule):
    if not schedule.google_calendar_event_id:
        event_id = create_calendar_event(schedule)
        if event_id:
            schedule.google_calendar_event_id = event_id
            schedule.save(update_fields=['google_calendar_event_id'])
        return bool(event_id)

    service = _get_service()
    if not service:
        return False
    try:
        service.events().update(
            calendarId=CALENDAR_ID,
            eventId=schedule.google_calendar_event_id,
            body=_build_event(schedule),
        ).execute()
        return True
    except Exception as exc:
        logger.error('Failed to update Google Calendar event: %s', exc)
        return False


def delete_calendar_event(event_id):
    if not event_id:
        return True
    service = _get_service()
    if not service:
        return False
    try:
        service.events().delete(calendarId=CALENDAR_ID, eventId=event_id).execute()
        return True
    except Exception as exc:
        logger.error('Failed to delete Google Calendar event: %s', exc)
        return False


def generate_ical_event(schedule):
    start_dt, end_dt = _schedule_datetimes(schedule)
    waste_label = schedule.waste_type.replace('_', ' ').title()
    barangay_name = schedule.barangay.name if schedule.barangay else 'Barangay'
    now = datetime.utcnow()
    fmt = '%Y%m%dT%H%M%S'
    return (
        'BEGIN:VCALENDAR\r\n'
        'VERSION:2.0\r\n'
        'PRODID:-//Wasto//Waste Schedule//EN\r\n'
        'CALSCALE:GREGORIAN\r\n'
        'METHOD:PUBLISH\r\n'
        'X-WR-CALNAME:Wasto Waste Collection\r\n'
        'X-WR-TIMEZONE:Asia/Manila\r\n'
        'BEGIN:VEVENT\r\n'
        f'UID:{schedule.id}@wasto\r\n'
        f'DTSTAMP:{now.strftime(fmt)}Z\r\n'
        f'DTSTART;TZID=Asia/Manila:{start_dt.strftime(fmt)}\r\n'
        f'DTEND;TZID=Asia/Manila:{end_dt.strftime(fmt)}\r\n'
        f'{_recurrence_rule(schedule)}\r\n'
        f'SUMMARY:{waste_label} Collection - Barangay {barangay_name}\r\n'
        f'DESCRIPTION:Waste Type: {waste_label}\\nBarangay: {barangay_name}\\nManaged by Wasto\r\n'
        'BEGIN:VALARM\r\n'
        'TRIGGER:-PT60M\r\n'
        'ACTION:DISPLAY\r\n'
        f'DESCRIPTION:Reminder: {waste_label} collection in 1 hour\r\n'
        'END:VALARM\r\n'
        'END:VEVENT\r\n'
        'END:VCALENDAR\r\n'
    )


def generate_week_ical(schedules):
    lines = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//Wasto//Waste Schedule//EN',
        'CALSCALE:GREGORIAN',
        'METHOD:PUBLISH',
        'X-WR-CALNAME:Wasto Waste Collection Schedules',
        'X-WR-TIMEZONE:Asia/Manila',
    ]
    for schedule in schedules:
        event = generate_ical_event(schedule).splitlines()
        lines.extend(event[event.index('BEGIN:VEVENT'):event.index('END:VEVENT') + 1])
    lines.append('END:VCALENDAR')
    return '\r\n'.join(lines) + '\r\n'
