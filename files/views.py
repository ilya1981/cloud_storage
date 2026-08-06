import uuid
import logging
import mimetypes

from django.db.models import F
from django.utils import timezone
from django.http import HttpResponse, FileResponse, Http404
from django.views import View
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from django.shortcuts import get_object_or_404

from . import serializers
from .models import File, FileLink
from .serializers import FileSerializer, FileLinkSerializer
import os

logger = logging.getLogger(__name__)
logger.info("=== FileViewSet module loaded ===")


class FileViewSet(viewsets.ModelViewSet):
    queryset = File.objects.all()
    serializer_class = FileSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return File.objects.none()

        owner_id = self.request.query_params.get("owner_id")
        if owner_id and user.is_staff:
            try:
                return File.objects.filter(owner_id=int(owner_id))
            except ValueError:
                pass

        if user.is_staff:
            return File.objects.all()

        return File.objects.filter(owner=user)

    def perform_create(self, serializer):
        # 1. Получаем настоящее имя файла ДО сохранения
        uploaded_file = self.request.FILES.get("file")
        if not uploaded_file:
            raise serializers.ValidationError("Файл не передан")

        original_filename = uploaded_file.name  # Например: "leo.jpg"

        # 2. Если клиент НЕ прислал name, ставим туда оригинальное имя
        name_to_save = serializer.validated_data.get("name") or original_filename

        # 3. Сохраняем instance с owner и name
        instance = serializer.save(
            owner=self.request.user,
            name=name_to_save,  # ✅ Заполняем красивое имя
            original_name=original_filename,  # ✅ Заполняем служебное имя
        )

        # 4. Обновляем размер (он может быть неверен, если serializer его не считает)
        if instance.file:
            instance.size = instance.file.size

        # 5. Делаем один save для полей, которые мы обновили вручную
        instance.save(update_fields=["size"])

    @action(detail=True, methods=["post"], url_path="generate-link")
    def generate_link(self, request, pk=None):
        file = self.get_object()
        token = uuid.uuid4()

        link, created = FileLink.objects.get_or_create(
            file=file,
            defaults={
                "token": token,
                "created_by": request.user,
                "expires_at": timezone.now() + timezone.timedelta(days=7),
            },
        )

        return Response(
            {
                "file_id": file.id,
                "token": str(link.token),
                "public_url": f"/public/{link.token}/download/",
                "created": created,
                "expires_at": link.expires_at.isoformat(),
            },
            status=status.HTTP_201_CREATED,
        )

    @action(detail=True, methods=["post"], url_path="rename")
    def rename(self, request, pk=None):
        file_obj = self.get_object()
        new_name = request.data.get("new_name")

        if not new_name or not isinstance(new_name, str) or not new_name.strip():
            return Response(
                {"detail": "Поле new_name обязательно и должно быть непустой строкой."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        file_obj.name = new_name.strip()
        file_obj.save(update_fields=["name"])

        logger.info(f"File renamed: id={file_obj.id}, new_name={file_obj.name}")
        return Response(FileSerializer(file_obj).data)

    @action(detail=True, methods=["get"])
    def download(self, request, pk=None):
        file_obj = self.get_object()

        # 1. Сначала проверяем, есть ли вообще файл в модели
        if not file_obj.file:
            logger.warning(
                f"У файла id={file_obj.id} нет прикреплённого файла в модели"
            )
            return Response(
                {"detail": "Файл не найден в системе."},
                status=status.HTTP_404_NOT_FOUND,
            )

        # 2. ТОЛЬКО теперь безопасно обращаемся к .path и проверяем существование на диске
        try:
            path = file_obj.file.path
        except ValueError:
            # Это значит, что путь в базе есть, но файла нет (или путь битый)
            logger.error(
                f"Файл id={file_obj.id} имеет неверный путь или отсутствует на диске"
            )
            return Response(
                {"detail": "Файл был удалён с сервера."},
                status=status.HTTP_404_NOT_FOUND,
            )

        if not os.path.exists(path):
            logger.error(f"Путь к файлу не существует: {path}")
            return Response(
                {"detail": "Файл физически отсутствует."},
                status=status.HTTP_404_NOT_FOUND,
            )

        # Обновляем дату последнего скачивания
        file_obj.last_downloaded = timezone.now()
        file_obj.save(update_fields=["last_downloaded"])

        filename = file_obj.original_name or file_obj.name or f"file_{file_obj.id}"

        response = FileResponse(
            open(path, "rb"),  # Используем переменную path, которую уже проверили
            as_attachment=True,
            filename=filename,
        )
        return response

    @action(detail=True, methods=["get"], url_path="view")
    def view(self, request, pk=None):
        file_obj = self.get_object()

        if not file_obj.file:
            return Response(
                {"detail": "Невозможно просмотреть: у файла нет содержимого."},
                status=status.HTTP_404_NOT_FOUND,
            )

        try:
            path = file_obj.file.path
        except ValueError:
            logger.error(f"Некорректный путь для файла id={file_obj.id}")
            return Response(
                {"detail": "Файл был удалён."},
                status=status.HTTP_404_NOT_FOUND,
            )

        if not os.path.exists(path):
            logger.error(f"Файл для просмотра не найден на диске: {path}")
            return Response(
                {"detail": "Файл физически отсутствует на сервере."},
                status=status.HTTP_404_NOT_FOUND,
            )

        content_type, _ = mimetypes.guess_type(file_obj.file.name)
        if not content_type:
            content_type = "application/octet-stream"

        return FileResponse(
            open(
                path, "rb"
            ),  # Лучше использовать open(path), чем .file.open() в этом контексте
            content_type=content_type,
            as_attachment=False,
        )


class PublicFileDownloadView(View):
    def get(self, request, token):
        # Ищем ссылку по токену
        link = FileLink.objects.filter(token=token).first()

        if not link:
            raise Http404("Ссылка не найдена")

        # Проверка на истечение срока действия
        if link.is_expired:
            raise Http404("Ссылка истекла")

        file_obj = link.file

        if not file_obj.file or not file_obj.file.name:
            raise Http404("Файл не найден на диске")

        # ✅ Атомарное увеличение счётчика скачиваний (защита от гонок)
        FileLink.objects.filter(pk=link.pk).update(
            download_count=F("download_count") + 1
        )

        # ✅ Обновляем last_downloaded у файла (для Dashboard)
        # Используем update, чтобы избежать проблем с гонками и не вызывать сигналы модели лишний раз
        File.objects.filter(pk=file_obj.pk).update(last_downloaded=timezone.now())

        filename = file_obj.original_name or f"file_{file_obj.id}"

        return FileResponse(
            file_obj.file.open(),
            as_attachment=True,
            filename=filename,
        )


class FileLinkViewSet(viewsets.ModelViewSet):
    """
    API для управления публичными ссылками на файлы.
    Доступно только админам или создателю ссылки.
    """

    queryset = FileLink.objects.all()
    serializer_class = FileLinkSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return FileLink.objects.none()

        if user.is_staff:
            return FileLink.objects.select_related("file").all()

        return FileLink.objects.filter(file__owner=user).select_related("file")
