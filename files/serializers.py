from datetime import timezone
from django.db.models import Sum
from rest_framework import serializers

from .models import File, FileLink


class FileSerializer(serializers.ModelSerializer):
    total_downloads = serializers.SerializerMethodField()
    # size можно оставить как SerializerMethodField, если он считается динамически
    size = serializers.SerializerMethodField()

    class Meta:
        model = File
        fields = [
            "id",
            "name",
            "owner",
            "original_name",
            "file_type",
            "description",
            "uploaded_at",
            "last_downloaded",
            "total_downloads",
            "size",
            "file",
        ]
        # Важно: owner должен быть read_only, чтобы фронтенд не мог его подменить
        read_only_fields = ["owner", "uploaded_at"]

    def get_total_downloads(self, obj):
        # Агрегируем скачивания по всем ссылкам на этот файл
        return obj.links.aggregate(total=Sum("download_count", default=0))["total"] or 0

    def get_size(self, obj):
        # Если размер уже сохранён в БД — просто возвращаем его
        return getattr(obj, "size", 0)


class FileLinkSerializer(serializers.ModelSerializer):
    file_id = serializers.IntegerField(write_only=True)
    link = serializers.SerializerMethodField()

    class Meta:
        model = FileLink
        fields = [
            "id",
            "token",
            "file_id",
            "expires_at",
            "download_count",
            "created_at",
            "link",
        ]
        read_only_fields = [
            "token",
            "download_count",
            "created_at",
        ]

    def create(self, validated_data):
        file_id = validated_data.pop("file_id")
        file_obj = File.objects.get(pk=file_id)
        validated_data["file"] = file_obj
        return super().create(validated_data)

    def get_link(self, obj):
        return f"/api/public/{obj.token}/download/"
