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
        queryset=User.objects.all(),
        required=False,        # <— allow POST data without "members"
        default=[]             # <— if not provided, default to empty list
    )

    class Meta:
        model = Group
        fields = ['id', 'name', 'members', 'invite_code']

class ExpenseSerializer(serializers.ModelSerializer):
    paid_by_username = serializers.CharField(source='paid_by.username', read_only=True)

    class Meta:
        model = Expense
        fields = [
            'id',
            'group',
            'paid_by',           # client can send group ID; we override paid_by in perform_create
            'paid_by_username',  # read-only in response
            'amount',
            'note',
            'created',
        ]
        read_only_fields = ['created', 'paid_by_username']


class MessageSerializer(serializers.ModelSerializer):
    sender_username = serializers.CharField(source='sender.username', read_only=True)

    class Meta:
        model = Message
        fields = [
            'id',
            'group',
            'sender',           # client can send group ID; we override sender in perform_create
            'sender_username',  # read-only in response
            'text',
            'ts',
        ]
        read_only_fields = ['ts', 'sender_username']

class SignupSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    password2 = serializers.CharField(
        write_only=True,
        label="Confirm Password",
        min_length=8,
        help_text="Re‐enter the password to verify.",
    )

    class Meta:
        model = User
        # Expose username, email, and the two password fields
        fields = ['username', 'email', 'password', 'password2']

    def validate(self, data):
        """
        Ensure password and password2 match.
        """
        if data['password'] != data['password2']:
            raise serializers.ValidationError({"password2": "Passwords do not match."})
        return data

    def create(self, validated_data):
        """
        Remove password2, create user with hashed password.
        """
        validated_data.pop('password2')
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data.get('email', ''),
            password=validated_data['password']
        )
        return user