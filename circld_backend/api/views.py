from django.shortcuts import render

# Create your views here.
# api/views.py
from django.contrib.auth import get_user_model
from rest_framework import viewsets, permissions
from .models import Group, Expense, Message
from .serializers import UserSerializer, GroupSerializer, ExpenseSerializer, MessageSerializer

User = get_user_model()

class UserViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

class GroupViewSet(viewsets.ModelViewSet):
    queryset = Group.objects.prefetch_related('members').all()
    serializer_class = GroupSerializer
    permission_classes = [permissions.IsAuthenticated]

class ExpenseViewSet(viewsets.ModelViewSet):
    queryset = Expense.objects.select_related('paid_by', 'group').all()
    serializer_class = ExpenseSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(paid_by=self.request.user)

class MessageViewSet(viewsets.ModelViewSet):
    queryset = Message.objects.select_related('sender', 'group').all()
    serializer_class = MessageSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(sender=self.request.user)
