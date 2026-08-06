from .models import File
from rest_framework import permissions


class IsAdminOrOwner(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        # Разрешаем безопасные методы (GET, HEAD, OPTIONS) для чтения, если это админ или владелец
        if request.method in permissions.SAFE_METHODS:
            if isinstance(obj, File):
                return request.user.is_staff or obj.owner == request.user
            return True
        # Для изменения/удаления — только админ или владелец
        if isinstance(obj, File):
            return request.user.is_staff or obj.owner == request.user
        return False


class IsAdminOrFileOwner(permissions.BasePermission):
    """
    Разрешает доступ, если:
      - пользователь — админ (is_staff)
      - ИЛИ пользователь — владелец файла, к которому привязана ссылка
    """

    def has_object_permission(self, request, view, obj):
        # obj может быть File или FileLink
        if isinstance(obj, File):
            return request.user.is_staff or obj.owner == request.user

        if isinstance(obj, type(None)):
            # Если объект ещё не получен (например, list), полагаемся на get_queryset
            return True

        # Для FileLink: смотрим на связанный файл
        file_obj = getattr(obj, "file", None)
        if file_obj is None:
            return False
        return request.user.is_staff or file_obj.owner == request.user
