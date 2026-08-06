from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.db.models import Sum

from files.models import File

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    role = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "email",
            "role",
            "date_joined",
            "is_staff",
            "is_active",
            "is_superuser",
            "files_count",
            "files_size_bytes",
        ]

    def get_files_count(self, obj):
        # Считаем файлы, где owner = пользователь
        return File.objects.filter(owner=obj).count()

    def get_files_size_bytes(self, obj):
        from django.db.models import Sum

        total = File.objects.filter(owner=obj).aggregate(Sum("size"))["size__sum"]
        return total or 0

    def get_role(self, obj):
        if obj.is_superuser or obj.is_staff:
            return "admin"
        return "user"


class UserAdminSerializer(serializers.ModelSerializer):
    files_count = serializers.SerializerMethodField(read_only=True)
    files_size_bytes = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "email",
            "is_staff",
            "is_superuser",
            "date_joined",
            "files_count",
            "files_size_bytes",
        ]

    def get_files_count(self, obj):
        # Используем related_name='files' из модели File
        return obj.files.count()

    def get_files_size_bytes(self, obj):
        total = obj.files.aggregate(total=Sum("size"))["total"]
        return total if total else 0
