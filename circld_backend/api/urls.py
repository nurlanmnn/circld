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
    RequestEmailChangeView, 
    VerifyEmailChangeView,
    RequestPasswordResetView,
    ConfirmPasswordResetView,
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
    path('profile/request-email-change/', RequestEmailChangeView.as_view()),
    path('profile/verify-email-change/',  VerifyEmailChangeView .as_view()),
    path('auth/password-reset/request/', RequestPasswordResetView.as_view()),
    path('auth/password-reset/confirm/', ConfirmPasswordResetView.as_view()),
]