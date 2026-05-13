import uuid
from django.db import models

class WeatherAlert(models.Model):
    SEVERITY = [
        ('low', 'Low'),
        ('moderate', 'Moderate'),
        ('high', 'High'),
    ]
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    barangay = models.ForeignKey('barangays.Barangay', on_delete=models.CASCADE, related_name='weather_alerts')
    condition = models.CharField(max_length=255)
    severity = models.CharField(max_length=10, choices=SEVERITY)
    message = models.TextField()
    notification_sent = models.BooleanField(default=False)
    triggered_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f'{self.barangay.name} - {self.severity} - {self.triggered_at}'

class NotificationLog(models.Model):
    STATUS = [
        ('sent', 'Sent'),
        ('failed', 'Failed'),
    ]
    CATEGORY = [
        ('weather', 'Weather'),
        ('schedule', 'Schedule'),
    ]
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey('accounts.CustomUser', on_delete=models.CASCADE, related_name='notifications')
    alert = models.ForeignKey(WeatherAlert, on_delete=models.SET_NULL, null=True, blank=True, related_name='logs')
    category = models.CharField(max_length=20, choices=CATEGORY, default='weather')
    title = models.CharField(max_length=255, default='Wasto notification')
    message = models.TextField(blank=True)
    status = models.CharField(max_length=10, choices=STATUS)
    sent_at = models.DateTimeField(auto_now_add=True)
    read_at = models.DateTimeField(null=True, blank=True)


class WeatherFetchStatus(models.Model):
    barangay = models.OneToOneField(
        'barangays.Barangay',
        on_delete=models.CASCADE,
        related_name='weather_fetch_status',
    )
    last_checked_at = models.DateTimeField(null=True, blank=True)
    last_result = models.CharField(max_length=255, blank=True)
    last_error = models.TextField(blank=True)

    def __str__(self):
        return f'{self.barangay.name} weather checked at {self.last_checked_at}'
