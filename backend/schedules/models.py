import uuid
from django.db import models

class WasteSchedule(models.Model):
    WASTE_TYPES = [
        ('biodegradable', 'Biodegradable'),
        ('non_biodegradable', 'Non-Biodegradable'),
        ('residual', 'Residual'),
        ('hazardous', 'Hazardous'),
    ]
    DAYS = [
        ('Monday', 'Monday'), ('Tuesday', 'Tuesday'),
        ('Wednesday', 'Wednesday'), ('Thursday', 'Thursday'),
        ('Friday', 'Friday'), ('Saturday', 'Saturday'),
        ('Sunday', 'Sunday'),
    ]
    FREQUENCY = [
        ('weekly', 'Weekly'),
        ('bi_weekly', 'Bi-Weekly'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    barangay = models.ForeignKey('barangays.Barangay', on_delete=models.CASCADE, related_name='schedules')
    waste_type = models.CharField(max_length=30, choices=WASTE_TYPES)
    collection_day = models.CharField(max_length=10, choices=DAYS)
    collection_time = models.TimeField()
    frequency = models.CharField(max_length=20, choices=FREQUENCY, default='weekly')
    created_by = models.ForeignKey('accounts.CustomUser', on_delete=models.SET_NULL, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    # Google Calendar integration
    google_calendar_event_id = models.CharField(max_length=255, blank=True, null=True)
    calendar_sync_enabled = models.BooleanField(default=True)
    last_synced_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f'{self.barangay.name} - {self.waste_type} - {self.collection_day}'
