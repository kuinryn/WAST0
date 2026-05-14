import json
import logging
import os
from datetime import date, datetime, timedelta

logger = logging.getLogger(__name__)

CALENDAR_ID = os.getenv('GOOGLE_CALENDAR_ID', 'primary')

WASTE_EMOJIS = {
    'biodegradable': '♻️',
    'non_biodegradable': '🗑️',
    'residual': '🪣',
    'hazardous': '⚠️',
}

DAY_TO_WEEKDAY = {
    'Monday': 0, 'Tuesday': 1, 'Wednesday': 2, 'Thursday': 3,
    'Friday': 4, 'Saturday': 5, 'Sunday': 6,
}

RRULE_DAYS = {
    'Monday': 'MO', 'Tuesday': 'TU', 'Wednesday': 'WE', 'Thursday': 'TH',
    'Friday': 'FR', 'Saturday': 'SA', 'Sunday': 'SU',
}


def _get_service():
    """Build and return a Google Calendar service object."""
    try:
        from google.oauth2 import service_account
        from googleapiclient.discovery import build
    except ImportError:
        logger.error('Google Calendar dependencies are not installed. Run: pip install google-api-python-client google-auth')
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
            logger.warning('No Google Calendar service account configured. Set GOOGLE_SERVICE_ACCOUNT_FILE or GOOGLE_SERVICE_ACCOUNT_JSON.')
            return None
        return build('calendar', 'v3', credentials=credentials)
    except Exception as exc:
        logger.error('Failed to initialize Google Calendar service: %s', exc)
        return None


def _next_weekday(weekday_num):
    """Return the next occurrence of the given weekday (0=Monday)."""
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
    emoji = WASTE_EMOJIS.get(schedule.waste_type, '🗑️')
    barangay_name = schedule.barangay.name if schedule.barangay else 'Barangay'
    return {
        'summary': f'{emoji} {waste_label} Collection — Barangay {barangay_name}',
        'description': (
            f'Waste Type: {waste_label}\n'
            f'Barangay: {barangay_name}\n'
            f'Collection Day: {schedule.collection_day}\n'
            f'Frequency: {schedule.frequency.replace("_", "-").title()}\n'
            f'Time: {start_dt.strftime("%I:%M %p")}\n\n'
            'Managed by WaST0 — Waste Scheduling & Tracking System'
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
    """Create a recurring Google Calendar event. Returns event ID or None."""
    service = _get_service()
    if not service:
        return None
    try:
        event = service.events().insert(calendarId=CALENDAR_ID, body=_build_event(schedule)).execute()
        logger.info('Created Google Calendar event %s for schedule %s', event.get('id'), schedule.id)
        return event.get('id')
    except Exception as exc:
        logger.error('Failed to create Google Calendar event: %s', exc)
        return None


def update_calendar_event(schedule):
    """Update an existing Google Calendar event. Returns True on success."""
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
    """Delete a Google Calendar event by ID. Returns True on success."""
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
    """Generate an iCalendar (.ics) string for a schedule."""
    start_dt, end_dt = _schedule_datetimes(schedule)
    waste_label = schedule.waste_type.replace('_', ' ').title()
    emoji = WASTE_EMOJIS.get(schedule.waste_type, '🗑️')
    barangay_name = schedule.barangay.name if schedule.barangay else 'Barangay'
    now = datetime.utcnow()
    fmt = '%Y%m%dT%H%M%S'
    return (
        'BEGIN:VCALENDAR\r\n'
        'VERSION:2.0\r\n'
        'PRODID:-//WaST0//Waste Schedule//EN\r\n'
        'CALSCALE:GREGORIAN\r\n'
        'METHOD:PUBLISH\r\n'
        'X-WR-CALNAME:WaST0 Waste Collection\r\n'
        'X-WR-TIMEZONE:Asia/Manila\r\n'
        'BEGIN:VEVENT\r\n'
        f'UID:{schedule.id}@wasto\r\n'
        f'DTSTAMP:{now.strftime(fmt)}Z\r\n'
        f'DTSTART;TZID=Asia/Manila:{start_dt.strftime(fmt)}\r\n'
        f'DTEND;TZID=Asia/Manila:{end_dt.strftime(fmt)}\r\n'
        f'{_recurrence_rule(schedule)}\r\n'
        f'SUMMARY:{emoji} {waste_label} Collection - Brgy. {barangay_name}\r\n'
        f'DESCRIPTION:Waste Type: {waste_label}\\nBarangay: {barangay_name}\\n'
        f'Frequency: {schedule.frequency.replace("_", "-").title()}\\nManaged by WaST0\r\n'
        'BEGIN:VALARM\r\n'
        'TRIGGER:-PT60M\r\n'
        'ACTION:DISPLAY\r\n'
        f'DESCRIPTION:Reminder: {waste_label} collection in 1 hour\r\n'
        'END:VALARM\r\n'
        'END:VEVENT\r\n'
        'END:VCALENDAR\r\n'
    )


def generate_week_ical(schedules):
    """Generate a single .ics file containing all schedules."""
    lines = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//WaST0//Waste Schedule//EN',
        'CALSCALE:GREGORIAN',
        'METHOD:PUBLISH',
        'X-WR-CALNAME:WaST0 Waste Collection Schedules',
        'X-WR-TIMEZONE:Asia/Manila',
    ]
    now = datetime.utcnow()
    fmt = '%Y%m%dT%H%M%S'
    for schedule in schedules:
        start_dt, end_dt = _schedule_datetimes(schedule)
        waste_label = schedule.waste_type.replace('_', ' ').title()
        emoji = WASTE_EMOJIS.get(schedule.waste_type, '🗑️')
        barangay_name = schedule.barangay.name if schedule.barangay else 'Barangay'
        lines += [
            'BEGIN:VEVENT',
            f'UID:{schedule.id}@wasto',
            f'DTSTAMP:{now.strftime(fmt)}Z',
            f'DTSTART;TZID=Asia/Manila:{start_dt.strftime(fmt)}',
            f'DTEND;TZID=Asia/Manila:{end_dt.strftime(fmt)}',
            _recurrence_rule(schedule),
            f'SUMMARY:{emoji} {waste_label} Collection - Brgy. {barangay_name}',
            f'DESCRIPTION:Waste Type: {waste_label}\\nBarangay: {barangay_name}\\nManaged by WaST0',
            'BEGIN:VALARM',
            'TRIGGER:-PT60M',
            'ACTION:DISPLAY',
            f'DESCRIPTION:Reminder: {waste_label} collection in 1 hour',
            'END:VALARM',
            'END:VEVENT',
        ]
    lines.append('END:VCALENDAR')
    return '\r\n'.join(lines) + '\r\n'
