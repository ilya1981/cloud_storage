from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import FileViewSet, FileLinkViewSet, PublicFileDownloadView

router = DefaultRouter()
router.register(r"files", FileViewSet, basename="file")
router.register(r"file-links", FileLinkViewSet, basename="file-link")

urlpatterns = [
    path("", include(router.urls)),
    # Публичные ссылки — отдельный путь, не через роутер
    path(
        "public/<uuid:token>/download/",
        PublicFileDownloadView.as_view(),
        name="public-download",
    ),
]
