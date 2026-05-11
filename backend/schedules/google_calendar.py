"""
Google Calendar integration for WaST0 waste collection schedules.

Setup instructions:
1. Go to https://console.cloud.google.com/
2. Create a project and enable the Google Calendar API
3. Create a Service Account and download the JSON key file
4. Set GOOGLE_SERVICE_ACCOUNT_FILE and GOOGLE_CALENDAR_ID in your .env
5. Share your Google Calendar with the service account email (Editor access)

Alternatively, use API Key + Public calendar:
- Set GOOGLE_API_KEY in .env for read-only access
- For write access, a service account or OAuth2 is required
"""

import os
import json
import logging
from datetime import datetime, timedelta, date

logger = logging.getLogger(__name__)

# Lazy import so the app still starts if google libs aren't installed
def _get_service():
    """Build and return a Google Calendar service object."""
    try:
        from google.oauth2 import service_account
        from googleapiclient.discovery import build
    except ImportError:
        logger.error("google-api-python-client not installed. Run: pip install google-api-python-client google-auth")
        return None

    service_account_file = os.getenv('GOOGLE_SERVICE_ACCOUNT_FILE', '')
    service_account_info_json = os.getenv('GOOGLE_SERVICE_ACCOUNT_JSON', '')

    credentials = None

    if service_account_info_json:
        # JSON string in env var (useful for deployment)
        try:
            info = json.loads(service_account_info_json)
            credentials = service_account.Credentials.from_service_account_info(
                info,
                scopes=['https://www.googleapis.com/auth/calendar']
            )
        except Exception as e:
            logger.error(f"Failed to parse GOOGLE_SERVICE_ACCOUNT_JSON: {e}")
            return None
    elif service_account_file and os.path.exists(service_account_file):
        try:
            credentials = service_account.Credentials.from_service_account_file(
                service_account_file,
                scopes=['https://www.googleapis.com/auth/calendar']
            )
        except Exception as e:
            logger.error(f"Failed to load service account file: {e}")
            return None
    else:
        logger.warning("No Google service account configured. Set GOOGLE_SERVICE_ACCOUNT_FILE or GOOGLE_SERVICE_ACCOUNT_JSON.")
        return None

    try:
        service = build('calendar', 'v3', credentials=credentials)
        return service
    except Exception as e:
        logger.error(f"Failed to build Google Calendar service: {e}")
        return None


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


def _next_weekday(weekday_num: int) -> date:
    """Return the next occurrence of the given weekday (0=Monday)."""
    today = date.today()
    days_ahead = weekday_num - today.weekday()
    if days_ahead <= 0:
        days_ahead += 7
    return today + timedelta(days=days_ahead)


def _build_event(schedule) -> dict:
    """Build a Google Calendar event dict from a WasteSchedule instance."""
    waste_label = schedule.waste_type.replace('_', ' ').title()
    emoji = WASTE_EMOJIS.get(schedule.waste_type, '🗑️')
    barangay_name = schedule.barangay.name if schedule.barangay else 'Barangay'
    day_num = DAY_TO_WEEKDAY[schedule.collection_day]
    start_date = _next_weekday(day_num)

    # Parse collection_time (could be a time object or HH:MM string)
    ct = schedule.collection_time
    if hasattr(ct, 'hour'):
        hour, minute = ct.hour, ct.minute
    else:
        parts = str(ct).split(':')
        hour, minute = int(parts[0]), int(parts[1])

    start_dt = datetime(start_date.year, start_date.month, start_date.day, hour, minute)
    end_dt = start_dt + timedelta(hours=1)

    # Build recurrence rule
    rrule_day = RRULE_DAYS[schedule.collection_day]
    if schedule.frequency == 'bi_weekly':
        rrule = f'RRULE:FREQ=WEEKLY;INTERVAL=2;BYDAY={rrule_day}'
    else:
        rrule = f'RRULE:FREQ=WEEKLY;BYDAY={rrule_day}'

    return {
        'summary': f'{emoji} {waste_label} Collection — Barangay {barangay_name}',
        'description': (
            f'Waste Type: {waste_label}\n'
            f'Barangay: {barangay_name}\n'
            f'Collection Day: {schedule.collection_day}\n'
            f'Frequency: {schedule.frequency.replace("_", "-").title()}\n'
            f'Time: {start_dt.strftime("%I:%M %p")}\n\n'
            f'Managed by WaST0 — Waste Scheduling & Tracking System'
        ),
        'start': {
            'dateTime': start_dt.isoformat(),
            'timeZone': 'Asia/Manila',
        },
        'end': {
            'dateTime': end_dt.isoformat(),
            'timeZone': 'Asia/Manila',
        },
        'recurrence': [rrule],
        'reminders': {
            'useDefault': False,
            'overrides': [
                {'method': 'popup', 'minutes': 60},
                {'method': 'popup', 'minutes': 1440},  # 1 day before
            ],
        },
        'colorId': _get_color_id(schedule.waste_type),
        'source': {
            'title': 'WaST0',
            'url': 'http://localhost:5173',
        },
    }


def _get_color_id(waste_type: str) -> str:
    """Map waste type to Google Calendar color ID."""
    return {
        'biodegradable': '10',      # Sage/green
        'non_biodegradable': '5',   # Banana/yellow
        'residual': '8',            # Graphite/gray
        'hazardous': '11',          # Tomato/red
    }.get(waste_type, '1')


def create_calendar_event(schedule) -> str | None:
    """
    Create a recurring Google Calendar event for the schedule.
    Returns the event ID on success, None on failure.
    """
    service = _get_service()
    if not service:
        return None
    try:
        event_body = _build_event(schedule)
        event = service.events().insert(
            calendarId=CALENDAR_ID,
            body=event_body,
        ).execute()
        logger.info(f"Created Google Calendar event {event['id']} for schedule {schedule.id}")
        return event['id']
    except Exception as e:
        logger.error(f"Failed to create Google Calendar event: {e}")
        return None


def update_calendar_event(schedule) -> bool:
    """
    Update an existing Google Calendar event.
    Returns True on success, False on failure.
    """
    if not schedule.google_calendar_event_id:
        # No event to update — try creating one
        event_id = create_calendar_event(schedule)
        if event_id:
            schedule.google_calendar_event_id = event_id
            schedule.save(update_fields=['google_calendar_event_id'])
        return bool(event_id)

    service = _get_service()
    if not service:
        return False
    try:
        event_body = _build_event(schedule)
        service.events().update(
            calendarId=CALENDAR_ID,
            eventId=schedule.google_calendar_event_id,
            body=event_body,
        ).execute()
        logger.info(f"Updated Google Calendar event {schedule.google_calendar_event_id}")
        return True
    except Exception as e:
        logger.error(f"Failed to update Google Calendar event: {e}")
        return False


def delete_calendar_event(event_id: str) -> bool:
    """
    Delete a Google Calendar event by ID.
    Returns True on success, False on failure.
    """
    if not event_id:
        return True  # Nothing to delete
    service = _get_service()
    if not service:
        return False
    try:
        service.events().delete(
            calendarId=CALENDAR_ID,
            eventId=event_id,
        ).execute()
        logger.info(f"Deleted Google Calendar event {event_id}")
        return True
    except Exception as e:
        logger.error(f"Failed to delete Google Calendar event: {e}")
        return False


def generate_ical_event(schedule) -> str:
    """
    Generate an iCalendar (.ics) string for a schedule so residents
    can import it into any calendar app without OAuth.
    """
    waste_label = schedule.waste_type.replace('_', ' ').title()
    emoji = WASTE_EMOJIS.get(schedule.waste_type, '🗑️')
    barangay_name = schedule.barangay.name if schedule.barangay else 'Barangay'
    day_num = DAY_TO_WEEKDAY[schedule.collection_day]
    start_date = _next_weekday(day_num)

    ct = schedule.collection_time
    if hasattr(ct, 'hour'):
        hour, minute = ct.hour, ct.minute
    else:
        parts = str(ct).split(':')
        hour, minute = int(parts[0]), int(parts[1])

    start_dt = datetime(start_date.year, start_date.month, start_date.day, hour, minute)
    end_dt = start_dt + timedelta(hours=1)
    now = datetime.utcnow()

    rrule_day = RRULE_DAYS[schedule.collection_day]
    if schedule.frequency == 'bi_weekly':
        rrule = f'RRULE:FREQ=WEEKLY;INTERVAL=2;BYDAY={rrule_day}'
    else:
        rrule = f'RRULE:FREQ=WEEKLY;BYDAY={rrule_day}'

    # Format for iCal (YYYYMMDDTHHMMSS)
    fmt = '%Y%m%dT%H%M%S'

    ical = (
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
        f'{rrule}\r\n'
        f'SUMMARY:{emoji} {waste_label} Collection - Brgy. {barangay_name}\r\n'
        f'DESCRIPTION:Waste Type: {waste_label}\\nBarangay: {barangay_name}\\n'
        f'Frequency: {schedule.frequency.replace("_", "-").title()}\\n'
        f'Managed by WaST0\r\n'
        'BEGIN:VALARM\r\n'
        'TRIGGER:-PT60M\r\n'
        'ACTION:DISPLAY\r\n'
        f'DESCRIPTION:Reminder: {waste_label} collection in 1 hour\r\n'
        'END:VALARM\r\n'
        'END:VEVENT\r\n'
        'END:VCALENDAR\r\n'
    )
    return ical


def generate_week_ical(schedules) -> str:
    """Generate a single .ics file containing all schedules for the week."""
    waste_emojis = WASTE_EMOJIS
    now = datetime.utcnow()
    fmt = '%Y%m%dT%H%M%S'

    lines = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//WaST0//Waste Schedule//EN',
        'CALSCALE:GREGORIAN',
        'METHOD:PUBLISH',
        'X-WR-CALNAME:WaST0 Waste Collection Schedules',
        'X-WR-TIMEZONE:Asia/Manila',
    ]

    for schedule in schedules:
        waste_label = schedule.waste_type.replace('_', ' ').title()
        emoji = waste_emojis.get(schedule.waste_type, '🗑️')
        barangay_name = schedule.barangay.name if schedule.barangay else 'Barangay'
        day_num = DAY_TO_WEEKDAY[schedule.collection_day]
        start_date = _next_weekday(day_num)

        ct = schedule.collection_time
        if hasattr(ct, 'hour'):
            hour, minute = ct.hour, ct.minute
        else:
            parts = str(ct).split(':')
            hour, minute = int(parts[0]), int(parts[1])

        start_dt = datetime(start_date.year, start_date.month, start_date.day, hour, minute)
        end_dt = start_dt + timedelta(hours=1)
        rrule_day = RRULE_DAYS[schedule.collection_day]
        rrule = f'RRULE:FREQ=WEEKLY;INTERVAL={"2" if schedule.frequency == "bi_weekly" else "1"};BYDAY={rrule_day}'

        lines += [
            'BEGIN:VEVENT',
            f'UID:{schedule.id}@wasto',
            f'DTSTAMP:{now.strftime(fmt)}Z',
            f'DTSTART;TZID=Asia/Manila:{start_dt.strftime(fmt)}',
            f'DTEND;TZID=Asia/Manila:{end_dt.strftime(fmt)}',
            rrule,
            f'SUMMARY:{emoji} {waste_label} Collection - Brgy. {barangay_name}',
            f'DESCRIPTION:Waste Type: {waste_label}\\nBarangay: {barangay_name}\\nFrequency: {schedule.frequency.replace("_", "-").title()}\\nManaged by WaST0',
            'BEGIN:VALARM',
            'TRIGGER:-PT60M',
            'ACTION:DISPLAY',
            f'DESCRIPTION:Reminder: {waste_label} collection in 1 hour',
            'END:VALARM',
            'END:VEVENT',
        ]

    lines.append('END:VCALENDAR')
    return '\r\n'.join(lines) + '\r\n'
