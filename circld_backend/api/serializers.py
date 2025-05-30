# api/serializers.py
from django.contrib.auth import get_user_model
from rest_framework import serializers
from .models import Group, Expense, Message

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        # pick only the public fields you want to expose
        fields = ['id', 'username', 'email']

class GroupSerializer(serializers.ModelSerializer):
    members = serializers.PrimaryKeyRelatedField(
        many=True,
        queryset=User.objects.all()
    )

    class Meta:
        model = Group
        fields = ['id', 'name', 'members']

class ExpenseSerializer(serializers.ModelSerializer):
    paid_by = serializers.PrimaryKeyRelatedField(read_only=True, default=serializers.CurrentUserDefault())
    group   = serializers.PrimaryKeyRelatedField(queryset=Group.objects.all())

    class Meta:
        model = Expense
        fields = ['id', 'group', 'paid_by', 'amount', 'note', 'created']

class MessageSerializer(serializers.ModelSerializer):
    sender = serializers.PrimaryKeyRelatedField(read_only=True, default=serializers.CurrentUserDefault())
    group  = serializers.PrimaryKeyRelatedField(queryset=Group.objects.all())

    class Meta:
        model = Message
        fields = ['id', 'group', 'sender', 'text', 'ts']
