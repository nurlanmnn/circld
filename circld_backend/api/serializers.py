# api/serializers.py
from django.contrib.auth import get_user_model
from rest_framework import serializers
from .models import Group, Expense, Message, Profile #(last one TEMP)
import random
from django.utils.crypto import get_random_string
from django.conf import settings
from django.core.mail import send_mail
from rest_framework.validators import UniqueValidator

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
    # Validate that email is unique across all User records
    email = serializers.EmailField(
        required=True,
        validators=[
            UniqueValidator(
                queryset=User.objects.all(),
                message="This email is already registered."
            )
        ]
    )
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
            first_name  = first,
            last_name   = last,
            username    = validated_data['username'],
            email       = validated_data.get('email', ''),
            password    = validated_data['password'],
            is_active=False
        )

        # generate & store one-time token
        code = f"{random.randint(0, 999999):06d}"
        user.profile.email_token = code
        user.profile.save()

        # send verification email
        send_mail(
            subject    = "Welcome to Circld! Here's your verification code",
            message    = (
                f"Hi {user.first_name},\n\n"
                "Thank you for joining Circld! To finish setting up your account, please enter the code below in the app:\n\n"
                f"    {code}\n\n"
                "If you didn't sign up for Circld, you can safely ignore this message.\n\n"
                "Cheers,\n"
                "The Circld Team"
            ),
            from_email = settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user.email],
            fail_silently=False,
        )

        return user
    
class ProfileSerializer(serializers.ModelSerializer):
    # Map the related User fields onto the Profile payload
    first_name = serializers.CharField(
        source='user.first_name', required=False
    )
    last_name = serializers.CharField(
        source='user.last_name', required=False
    )
    email = serializers.EmailField(
        source='user.email', required=False
    )
    # Allow uploading/updating avatar image
    avatar = serializers.ImageField(required=False)

    class Meta:
        model = Profile
        fields = [
            'first_name',
            'last_name',
            'email',
            'avatar',
        ]

    def update(self, instance, validated_data):
        # 1) Pop off any nested 'user' data
        user_data = validated_data.pop('user', {})
        # 2) Apply name/email changes to the related User
        for attr, value in user_data.items():
            setattr(instance.user, attr, value)
        instance.user.save()
        # 3) Let ModelSerializer handle the rest (i.e. avatar)
        return super().update(instance, validated_data)
