# api/serializers.py
from django.contrib.auth import get_user_model
from rest_framework import serializers
from .models import Group, Expense, Message

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        # pick only the public fields you want to expose
        fields = ['id', 'first_name', 'last_name', 'username', 'email']

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
    # Add two write-only fields: first_name and last_name.
    first_name = serializers.CharField(
        write_only=True,
        required=True,
        max_length=30,
        help_text="User's first name",
    )
    last_name = serializers.CharField(
        write_only=True,
        required=True,
        max_length=30,
        help_text="User's last name",
    )

    password = serializers.CharField(write_only=True, min_length=8)
    password2 = serializers.CharField(
        write_only=True,
        label="Confirm Password",
        min_length=8,
        help_text="Re-enter the password to verify.",
    )

    class Meta:
        model = User
        # Include first_name and last_name in addition to the existing fields
        fields = [
            'first_name',
            'last_name',
            'username',
            'email',
            'password',
            'password2',
        ]

    def validate(self, data):
        """
        Ensure password and password2 match.
        """
        if data['password'] != data['password2']:
            raise serializers.ValidationError({"password2": "Passwords do not match."})
        return data

    def create(self, validated_data):
        """
        Remove password2, pop first_name/last_name, create user with hashed password.
        """
        # Pop off the matching password field
        validated_data.pop('password2')

        # Pop off first_name/last_name and save them separately
        first = validated_data.pop('first_name')
        last  = validated_data.pop('last_name')

        # Now create the user, passing first_name/last_name into create_user()
        user = User.objects.create_user(
            first_name  = first,    # ─── pass first name here ───
            last_name   = last,     # ─── pass last name here ───
            username    = validated_data['username'],
            email       = validated_data.get('email', ''),
            password    = validated_data['password'],
        )
        return user