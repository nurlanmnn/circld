# api/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    UserViewSet,
    GroupViewSet,
    ExpenseViewSet,
    MessageViewSet,
    SignupView,  # ← import the signup view
)

router = DefaultRouter()
router.register(r'users',    UserViewSet,    basename='user')
router.register(r'groups',   GroupViewSet,   basename='group')
router.register(r'expenses', ExpenseViewSet, basename='expense')
router.register(r'messages', MessageViewSet, basename='message')

urlpatterns = [
    path('', include(router.urls)),
    path('register/', SignupView.as_view(), name='register'),  # ← new endpoint
]