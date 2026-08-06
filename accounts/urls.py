from django.urls import path
from .views import (
    LoginView,
    MeView,
    RegisterView,
    LogoutView,
    AdminUsersListView,
    AdminUserDetailView,
    get_csrf,
)

urlpatterns = [
    # Авторизация и сессия
    path("login/", LoginView.as_view(), name="login"),
    path("me/", MeView.as_view(), name="me"),
    path("register/", RegisterView.as_view(), name="register"),
    path("logout/", LogoutView.as_view(), name="logout"),
    path("csrf/", get_csrf),
    # Админские эндпоинты
    path("admin/users/", AdminUsersListView.as_view(), name="admin-users-list"),
    path(
        "admin/users/<int:pk>/", AdminUserDetailView.as_view(), name="admin-user-detail"
    ),
]
