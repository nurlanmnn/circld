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

# api/serializers.py
from django.core.exceptions import ObjectDoesNotExist
from rest_framework import serializers

# from .serializers import ProfileSerializer

class UserSerializer(serializers.ModelSerializer):
    avatar   = serializers.SerializerMethodField()
    is_admin = serializers.SerializerMethodField()

    class Meta:
        model  = User
        fields = ["id", "first_name", "last_name", "username", "avatar", "is_admin"]

    def get_avatar(self, user):
        # don’t assume there’s always a profile
        try:
            profile = user.profile
        except ObjectDoesNotExist:
            return None

        # if you still have the ProfileSerializer, you could do:
        if not profile.avatar:
            return None

        request = self.context.get("request", None)
        url     = profile.avatar.url
        return request.build_absolute_uri(url) if request else url

    def get_is_admin(self, user):
        # try to pull group_id from the context; if it's missing, just return False
        group_id = self.context.get('group_id')
        if not group_id:
            return False

        try:
            group = Group.objects.get(pk=group_id)
        except Group.DoesNotExist:
            return False

        return group.owner_id == user.id


class GroupSerializer(serializers.ModelSerializer):
    owner_id       = serializers.ReadOnlyField(source='owner.id')
    owner_username = serializers.ReadOnlyField(source='owner.username')

    members = serializers.PrimaryKeyRelatedField(
        many=True,
        queryset=User.objects.all(),
        required=False,        # <— allow POST data without "members"
        default=[]             # <— if not provided, default to empty list
    )

    class Meta:
        model = Group
        fields = ['id', 'name', 'members', 'invite_code', 'owner_id', 'owner_username']

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


from rest_framework import serializers
from .models import Message

class MessageSerializer(serializers.ModelSerializer):
    sender_username = serializers.ReadOnlyField(source='sender.username')
    sender_name     = serializers.SerializerMethodField()
    avatar          = serializers.SerializerMethodField()
    ts              = serializers.DateTimeField(format='%Y-%m-%dT%H:%M:%SZ', read_only=True)

    class Meta:
        model  = Message
        fields = [
            'id',
            'group',
            'sender',
            'sender_username',
            'sender_name',
            'avatar',
            'text',
            'ts',
        ]

    def get_avatar(self, message):
        """
        Look up the sender’s profile.avatar and prepend
        the full URL if we have a request in context.
        """
        try:
            profile = message.sender.profile
        except Exception:
            return None

        if not getattr(profile, 'avatar', None):
            return None

        avatar_url = profile.avatar.url
        request    = self.context.get('request')
        return request.build_absolute_uri(avatar_url) if request else avatar_url

    def get_sender_name(self, message):
        user = message.sender
        return f"{user.first_name} {user.last_name}".strip() or user.username


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
    user_id = serializers.IntegerField(source='user.id', read_only=True)
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
            'user_id',
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

class RequestEmailChangeSerializer(serializers.Serializer):
    email = serializers.EmailField(
        validators=[
            UniqueValidator(
                queryset=User.objects.all(),
                message="That email is already in use."
            )
        ]
    )

class VerifyEmailChangeSerializer(serializers.Serializer):
    code = serializers.CharField(
        max_length=6,
        min_length=6,
        trim_whitespace=True
    )

# forgot password
class RequestPasswordResetSerializer(serializers.Serializer):
    email = serializers.EmailField()

    def validate_email(self, value):
        """
        Ensure an account with this email actually exists,
        otherwise raise a validation error.
        """
        value = value.lower().strip()
        if not User.objects.filter(email=value).exists():
            raise serializers.ValidationError(
                "No account is registered with this email."
            )
        return value

class ConfirmPasswordResetSerializer(serializers.Serializer):
    email          = serializers.EmailField()
    token          = serializers.CharField(max_length=6)
    new_password   = serializers.CharField(write_only=True)
    new_password2  = serializers.CharField(write_only=True)

    def validate(self, data):
        if data['new_password'] != data['new_password2']:
            raise serializers.ValidationError({
                "new_password2": "Passwords do not match."
            })
        return data