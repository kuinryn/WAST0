from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('schedules', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='wasteschedule',
            name='updated_at',
            field=models.DateTimeField(auto_now=True),
        ),
        migrations.AddField(
            model_name='wasteschedule',
            name='google_calendar_event_id',
            field=models.CharField(blank=True, max_length=255, null=True),
        ),
        migrations.AddField(
            model_name='wasteschedule',
            name='calendar_sync_enabled',
            field=models.BooleanField(default=True),
        ),
        migrations.AddField(
            model_name='wasteschedule',
            name='last_synced_at',
            field=models.DateTimeField(blank=True, null=True),
        ),
    ]
