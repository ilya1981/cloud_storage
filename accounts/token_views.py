from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.middleware.csrf import get_token


@api_view(["GET"])
def csrf_token(request):
    token = get_token(request)  # это также установит cookie csrftoken, если его нет
    return Response({"csrf_token": token})
