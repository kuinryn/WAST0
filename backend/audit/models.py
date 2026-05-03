import uuid
from django.db import models

class AuditLog(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey('accounts.CustomUser', on_delete=models.SET_NULL, null=True)
    action = models.CharField(max_length=10)
    target_table = models.CharField(max_length=255)
    target_id = models.UUIDField(null=True, blank=True)
    performed_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f'{self.user} - {self.action} - {self.target_table}'