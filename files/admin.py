from django.contrib import admin

# Register your models here.
from django.contrib import admin
from .models import File, FileLink


@admin.register(File)
class FileAdmin(admin.ModelAdmin):
    list_display = ("name", "owner", "uploaded_at", "file_size_display")
    list_filter = ("owner", "uploaded_at")
    search_fields = ("name", "owner__username")
    readonly_fields = ("uploaded_at",)

    def file_size_display(self, obj):
        try:
            return f"{obj.file.size / 1024:.1f} KB"
        except Exception:
            return "—"

    file_size_display.short_description = "Размер"


@admin.register(FileLink)
class FileLinkAdmin(admin.ModelAdmin):
    list_display = (
        "file",
        "token_preview",
        "created_at",
        "expires_at",
        "download_count",
        "is_expired_display",
    )
    list_filter = ("expires_at", "created_at")
    search_fields = ("token", "file__name")
    readonly_fields = ("token", "created_at", "download_count")

    def token_preview(self, obj):

        return f"{str(obj.token)[:8]}…"

    token_preview.short_description = "Токен"

    def is_expired_display(self, obj):
        status = "Да" if obj.is_expired else "Нет"
        return status

    is_expired_display.short_description = "Истёк?"
