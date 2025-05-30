# api/urls.py
from rest_framework.routers import DefaultRouter
from .views import UserViewSet, GroupViewSet, ExpenseViewSet, MessageViewSet

router = DefaultRouter()
router.register(r'users',    UserViewSet,    basename='user')
router.register(r'groups',   GroupViewSet,   basename='group')
router.register(r'expenses', ExpenseViewSet, basename='expense')
router.register(r'messages', MessageViewSet, basename='message')

urlpatterns = router.urls
