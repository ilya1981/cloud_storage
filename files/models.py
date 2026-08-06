import os
from datetime import timezone
from django.conf import settings
from django.contrib.auth.models import User
from django.db import models
import uuid


def user_directory_path(instance, filename):
    ext = os.path.splitext(filename)[1]
    unique_name = f"{uuid.uuid4().hex}{ext}"
    return f"user_{instance.owner.id}/{unique_name}"


class File(models.Model):
    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name="files")
    name = models.CharField(max_length=255, blank=True, null=True)
    file = models.FileField(upload_to=user_directory_path)
    size = models.PositiveIntegerField(default=0, help_text="размер файла в байтах")
    original_name = models.CharField(max_length=255, blank=True)
    file_type = models.CharField(max_length=255, blank=True)
    uploaded_at = models.DateTimeField(auto_now_add=True)
    last_downloaded = models.DateTimeField(null=True, blank=True)
    description = models.TextField(null=True, blank=True)

    def __str__(self):
        return self.name


class FileLink(models.Model):
    file = models.ForeignKey(File, on_delete=models.CASCADE, related_name="links")
    token = models.UUIDField(default=uuid.uuid4, unique=True, db_index=True)  # ✅ UUID
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField(null=True, blank=True)
    download_count = models.PositiveIntegerField(default=0)
    created_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="created_links",
    )

    @property
    def is_expired(self):
        if self.expires_at is None:
            return False
        return timezone.now() > self.expires_at

    class Meta:
        ordering = ["-created_at"]

    @classmethod
    def generate_token(cls):
        return uuid.uuid4().hex

    def __str__(self):
        return f"Link for file {self.file.id} (token: {str(self.token)[:8]}…)"


# return f"Link for file {self.file.id} (token: {self.token.hex[:8]}…)"
