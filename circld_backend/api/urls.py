# api/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    ResendCodeView,
    UserViewSet,
    GroupViewSet,
    ExpenseViewSet,
    MessageViewSet,
    SignupView,
    VerifyCodeView,
    ProfileView,
    DeleteAccountView,
)

router = DefaultRouter()
router.register(r'users',    UserViewSet,    basename='user')
router.register(r'groups',   GroupViewSet,   basename='group')
router.register(r'expenses', ExpenseViewSet, basename='expense')
router.register(r'messages', MessageViewSet, basename='message')

urlpatterns = [
    path('', include(router.urls)),
    path('register/', SignupView.as_view(), name='register'),
    path('verify-code/',  VerifyCodeView.as_view(),   name='verify-code'),
    path('resend-code/',  ResendCodeView.as_view(),   name='resend-code'),
    path('profile/',  ProfileView.as_view(), name='profile'),
    path('profile/delete/',DeleteAccountView.as_view(), name='profile/delete'),
]