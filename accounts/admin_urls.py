from django.urls import path
from .views import AdminUsersListView, AdminUserDetailView

urlpatterns = [
    path('users/', AdminUsersListView.as_view(), name='admin-users-list'),
    path('users/<int:pk>/', AdminUserDetailView.as_view(), name='admin-user-detail'),
]
