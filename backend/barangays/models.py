import uuid
from django.db import models

class Barangay(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    district = models.CharField(max_length=255)
    managed_by = models.ForeignKey(
        'accounts.CustomUser',
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='managed_barangays'
    )

    def __str__(self):
        return self.name