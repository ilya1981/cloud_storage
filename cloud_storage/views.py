from django.http import HttpResponse, HttpResponseNotFound, Http404
from django.conf import settings
from pathlib import Path


def serve_react_app(request, path=""):

    if request.method != "GET":
        return HttpResponseNotFound("Not found")

    index_path = Path(settings.BASE_DIR) / "frontend" / "index.html"

    if not index_path.exists():
        raise Http404(
            "frontend/index.html не найден. Сначала запусти npm run build в папке frontend."
        )

    return HttpResponse(
        index_path.read_text(encoding="utf-8"), content_type="text/html"
    )
