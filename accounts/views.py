from django.contrib.auth import (
    get_user_model,
    authenticate,
    login,
    logout as django_logout,
)
import re
import logging
from django.db.models import Sum
from django.http import JsonResponse
from rest_framework import status
from rest_framework.generics import ListAPIView, RetrieveUpdateDestroyAPIView
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from .serializers import UserAdminSerializer
from files.models import File
from django.views.decorators.csrf import ensure_csrf_cookie

User = get_user_model()
logger = logging.getLogger(__name__)


def get_csrf(request):
    return JsonResponse({"detail": "CSRF cookie set"})


class AdminUsersListView(ListAPIView):
    queryset = User.objects.all().order_by("-date_joined")
    serializer_class = UserAdminSerializer
    permission_classes = [IsAdminUser]
    pagination_class = None


class AdminUserDetailView(RetrieveUpdateDestroyAPIView):
    queryset = User.objects.all()
    serializer_class = UserAdminSerializer
    permission_classes = [IsAdminUser]

    def perform_update(self, serializer):
        user = self.get_object()
        data = self.request.data

        if "is_staff" in data:
            serializer.save(is_staff=bool(data["is_staff"]))
        elif "is_superuser" in data:
            if not self.request.user.is_superuser:
                self.permission_denied(
                    self.request,
                    message="Только суперпользователь может менять флаг superuser",
                )
            serializer.save(is_superuser=bool(data["is_superuser"]))
        else:
            # Если ничего из разрешённого не прислали — просто сохраняем
            serializer.save()

    def perform_destroy(self, instance):
        # Нельзя удалить самого себя
        if instance.id == self.request.user.id:
            self.permission_denied(self.request, message="Нельзя удалить самого себя")
        instance.delete()


class LoginView(APIView):
    permission_classes = []

    def post(self, request):
        username = request.data.get("username")
        password = request.data.get("password")

        user = authenticate(request, username=username, password=password)
        if user is not None:
            login(request, user)
            logger.info(f"Пользователь {username} успешно вошёл.")
            return Response(
                {
                    "success": True,
                    "user": {
                        "id": user.id,
                        "username": user.username,
                        "is_staff": user.is_staff,
                        "is_superuser": user.is_superuser,
                    },
                },
                status=status.HTTP_200_OK,
            )
        else:
            logger.warning(f"Неудачная попытка входа для username={username}")
            return Response(
                {"success": False, "error": "Неверный логин или пароль"},
                status=status.HTTP_401_UNAUTHORIZED,
            )


class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = UserAdminSerializer(request.user)
        return Response({"success": True, "user": serializer.data})


class RegisterView(APIView):
    permission_classes = []

    def post(self, request):
        data = request.data

        username = str(data.get("username", "")).strip()
        full_name = str(data.get("full_name", "")).strip()
        email = str(data.get("email", "")).strip().lower()
        password = str(data.get("password", ""))

        errors = {}

        login_regex = re.compile(r"^[A-Za-z][A-Za-z0-9]{3,19}$")
        if not login_regex.match(username):
            errors.setdefault("username", []).append(
                "Логин должен начинаться с буквы, 4–20 символов, латиница и цифры."
            )

        if User.objects.filter(username=username).exists():
            errors.setdefault("username", []).append(
                "Пользователь с таким логином уже существует."
            )

        email_regex = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
        if not email:
            errors.setdefault("email", []).append("Email обязателен.")
        elif not email_regex.match(email):
            errors.setdefault("email", []).append("Некорректный формат email.")
        elif User.objects.filter(email=email).exists():
            errors.setdefault("email", []).append(
                "Пользователь с таким email уже зарегистрирован."
            )

        if len(password) < 6:
            errors.setdefault("password", []).append(
                "Пароль должен быть не менее 6 символов."
            )
        else:
            if not any(c.isupper() for c in password):
                errors.setdefault("password", []).append(
                    "Нужен хотя бы один заглавный символ."
                )
            if not any(c.isdigit() for c in password):
                errors.setdefault("password", []).append("Нужна хотя бы одна цифра.")
            # Спецсимвол убран для удобства тестов в дипломе

        if not full_name:
            errors.setdefault("full_name", []).append("Полное имя обязательно.")

        if errors:
            logger.warning(f"Ошибки валидации при регистрации: {errors}")
            return Response(
                {"success": False, "errors": errors}, status=status.HTTP_400_BAD_REQUEST
            )

        try:
            user = User.objects.create_user(
                username=username,
                email=email,
                password=password,
            )
            if hasattr(user, "full_name"):
                user.full_name = full_name
                user.save(update_fields=["full_name"])

            logger.info(f"Пользователь {username} успешно зарегистрирован.")
            return Response(
                {
                    "success": True,
                    "message": "Пользователь успешно зарегистрирован",
                    "user": {
                        "id": user.id,
                        "username": user.username,
                        "email": user.email,
                        "is_staff": user.is_staff,
                    },
                },
                status=status.HTTP_201_CREATED,
            )
        except Exception as e:
            logger.exception("Ошибка при регистрации пользователя")
            return Response(
                {"success": False, "error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        django_logout(request)
        logger.info(f"Пользователь {request.user.username} вышел из системы.")
        return Response(
            {"success": True, "message": "Вы успешно вышли"}, status=status.HTTP_200_OK
        )
