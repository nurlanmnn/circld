from django.shortcuts import render
from django.db.models import Q
from rest_framework.response import Response
from django.contrib.auth import get_user_model
from rest_framework import viewsets, permissions, status, generics
from django.shortcuts import get_object_or_404
from rest_framework.decorators import action

from .permissions import IsGroupOwner
from .models import Group, Expense, Message, Profile
from .serializers import (
    UserSerializer, 
    GroupSerializer, 
    ExpenseSerializer, 
    MessageSerializer, 
    SignupSerializer, 
    ProfileSerializer, 
    RequestEmailChangeSerializer,
    VerifyEmailChangeSerializer,
    RequestPasswordResetSerializer,
    ConfirmPasswordResetSerializer
    )
from rest_framework.views import APIView
import random
from rest_framework import generics
from django.conf import settings
from django.core.mail import send_mail

from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser

User = get_user_model()

class UserViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

class GroupViewSet(viewsets.ModelViewSet):
    serializer_class    = GroupSerializer
    permission_classes  = [permissions.IsAuthenticated]

    def get_queryset(self):
        me = self.request.user
        return (
            Group.objects
                 .filter(
                   Q(members=me)    # any group you’re a member of
                   | Q(owner=me)    # or any group you created
                 )
                 .distinct()
                 .prefetch_related('members')
        )

    def perform_create(self, serializer):
        # pass the logged-in user in as owner
        group = serializer.save(owner=self.request.user)
        group.members.add(self.request.user)

    @action(detail=True, methods=['get'], url_path='members')
    def members(self, request, pk=None):
        """
        GET /api/groups/{pk}/members/
        returns all users in this group, including avatar & is_admin
        """
        group = self.get_object()
        users = group.members.all()

        # pass both `request` (for URL-building) and `group_id`
        ctx = {'request': request, 'group_id': group.id}
        serializer = UserSerializer(
            users,
            many=True,
            context={
              "request": request,
              # pass the group so the serializer knows who the owner is
              "group_id": group.pk,
            }
        )
        return Response(serializer.data)

    @action(detail=False, methods=['post'], url_path='join')
    def join_group(self, request):
        code = request.data.get('invite_code', '').strip()
        if not code:
            return Response(
                {"invite_code": ["This field is required."]},
                status=status.HTTP_400_BAD_REQUEST
            )

        group = get_object_or_404(Group, invite_code=code)
        group.members.add(request.user)
        return Response(self.get_serializer(group).data)
    
    def get_permissions(self):
        # owner-only endpoints:
        if self.action in ['destroy', 'remove_member', 'rename']:
            return [permissions.IsAuthenticated(), IsGroupOwner()]
        return super().get_permissions()

    @action(detail=True, methods=['post'], url_path='leave')
    def leave(self, request, pk=None):
        """
        POST /api/groups/{pk}/leave/
        - If the leaving user is the owner **and** there are other members,
          auto-promote the next member as owner.
        - If they were the last member, delete the group.
        - Otherwise just remove them from members.
        """
        group = self.get_object()
        me    = request.user

        # 1) must be a member
        if not group.members.filter(pk=me.pk).exists():
            return Response(status=status.HTTP_404_NOT_FOUND)

        # 2) if I'm the owner...
        if group.owner_id == me.id:
            others = group.members.exclude(pk=me.pk)
            if others.exists():
                # pick a new owner (by lowest PK, or whatever ordering you prefer)
                new_owner = others.order_by('id').first()
                group.owner = new_owner
                group.save()
            else:
                # I was the last person → delete the group
                group.delete()
                return Response(status=status.HTTP_204_NO_CONTENT)

        # 3) remove me from the membership
        group.members.remove(me)
        return Response(status=status.HTTP_200_OK)


    @action(detail=True, methods=['post'], url_path='remove_member')
    def remove_member(self, request, pk=None):
        """
        POST /api/groups/{pk}/remove_member/   { "user_id": 42 }
        Owner-only!
        """
        group = self.get_object()
        uid   = request.data.get('user_id')
        if not uid:
            return Response({'user_id': ['This field is required.']},
                            status=status.HTTP_400_BAD_REQUEST)

        # cannot remove yourself via this endpoint (use leave instead)
        if uid == request.user.id:
            return Response({'detail': "Use /leave/ to exit."},
                            status=status.HTTP_400_BAD_REQUEST)

        # remove if they’re a member
        if group.members.filter(pk=uid).exists():
            group.members.remove(uid)
            return Response(status=status.HTTP_204_NO_CONTENT)
        else:
            return Response({'detail': "Not a member."},
                            status=status.HTTP_404_NOT_FOUND)

    @action(detail=True, methods=['patch'], url_path='rename')
    def rename(self, request, pk=None):
        group = self.get_object()
        new_name = request.data.get('name', '').strip()
        if not new_name:
            return Response({'name': ['Required.']},
                            status=status.HTTP_400_BAD_REQUEST)
        group.name = new_name
        group.save()
        return Response(self.get_serializer(group).data)

class ExpenseViewSet(viewsets.ModelViewSet):
    serializer_class = ExpenseSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        group_id = self.request.query_params.get('group')
        # only fetch expenses for that group
        return Expense.objects.filter(group_id=group_id).order_by('-created')

    def perform_create(self, serializer):
        # automatically set paid_by to the authenticated user
        serializer.save(paid_by=self.request.user)


class MessageViewSet(viewsets.ModelViewSet):
    serializer_class   = MessageSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        group_id = self.request.query_params.get('group')
        if not group_id:
            # you might want to raise an error here instead
            return Message.objects.none()
        return (
            Message.objects
                   .filter(group_id=group_id)
                   .order_by('ts')
        )

    def perform_create(self, serializer):
        # 1) try body first, then fallback to query param
        group_id = (
            self.request.data.get('group')
            or self.request.query_params.get('group')
        )
        group = get_object_or_404(Group, pk=group_id)

        serializer.save(
            sender=self.request.user,
            group=group
        )


class SignupView(generics.GenericAPIView):
    """
    POST /api/register/  → creates a new User if the data is valid.
    """
    serializer_class = SignupSerializer
    permission_classes = [permissions.AllowAny]  # anyone (even unauthenticated) can register

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            return Response({"detail": "User created successfully."}, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class VerifyCodeView(APIView):
    permission_classes = []  # allow unauthenticated

    def post(self, request):
        """
        Expects JSON: { "email": "...", "code": "123456" }
        """
        email = request.data.get('email', '').lower()
        code  = request.data.get('code', '').strip()

        try:
            profile = Profile.objects.get(user__email=email)
        except Profile.DoesNotExist:
            return Response(
                {"error": "No such user."},
                status=status.HTTP_400_BAD_REQUEST
            )

        if profile.email_token != code:
            return Response(
                {"error": "Invalid verification code."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # mark user active and clear code
        user = profile.user
        user.is_active = True
        user.save()
        profile.email_token = ''
        profile.save()

        return Response({"message": "Email verified! You can now log in."})

class ResendCodeView(APIView):
    permission_classes = []

    def post(self, request):
        email = request.data.get('email','').lower()
        try:
            profile = Profile.objects.get(user__email=email)
        except Profile.DoesNotExist:
            return Response({"error":"No such user."}, status=400)

        if profile.user.is_active:
            return Response({"error":"Already verified."}, status=400)

        # new code
        code = f"{random.randint(0,999999):06d}"
        profile.email_token = code
        profile.save()
        send_mail(
            subject    = "Your new Circld verification code",
            message    = f"Your new code is {code}",
            from_email = settings.DEFAULT_FROM_EMAIL,
            recipient_list=[email], fail_silently=False,
        )
        return Response({"message":"New code sent."})

class ProfileView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes     = [MultiPartParser, FormParser]

    def get(self, request):
        serializer = ProfileSerializer(
            request.user.profile,
            context={'request': request}
        )
        return Response(serializer.data)

    def put(self, request):
        serializer = ProfileSerializer(
            request.user.profile,
            data=request.data,
            partial=True,
            context={'request': request}
        )
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class DeleteAccountView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request):
        request.user.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

class RequestEmailChangeView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = RequestEmailChangeSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        new_email = serializer.validated_data['email'].lower()
        code = f"{random.randint(0, 999999):06d}"

        profile = request.user.profile
        profile.pending_email = new_email
        profile.email_token   = code
        profile.save()

        send_mail(
            subject="Verify your new Circld email",
            message=f"Your verification code is {code}",
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[new_email],
            fail_silently=False,
        )
        return Response(
            {"message": "Verification code sent to new address."},
            status=status.HTTP_200_OK
        )


class VerifyEmailChangeView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = VerifyEmailChangeSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        code = serializer.validated_data['code']
        profile = request.user.profile

        if profile.email_token != code:
            return Response(
                {"code": "Invalid code."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # commit the change
        request.user.email       = profile.pending_email
        request.user.save()
        profile.pending_email    = ''
        profile.email_token      = ''
        profile.save()

        return Response(
            {"message": "Email updated successfully."},
            status=status.HTTP_200_OK
        )

# for password reset
class RequestPasswordResetView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = RequestPasswordResetSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        email = serializer.validated_data['email'].lower()
        try:
            user = get_user_model().objects.get(email=email)
        except get_user_model().DoesNotExist:
            # UniqueValidator already catches this, but just in case
            return Response({"email": ["No such account."]},
                            status=status.HTTP_400_BAD_REQUEST)

        code = f"{random.randint(0, 999999):06d}"
        profile = user.profile
        profile.email_token = code
        profile.save()

        send_mail(
            subject="Your Circld password reset code",
            message=f"Your reset code is {code}",
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[email],
            fail_silently=False,
        )
        return Response({"message": "Password reset code sent."})

class ConfirmPasswordResetView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = ConfirmPasswordResetSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        email = serializer.validated_data['email'].lower()
        token = serializer.validated_data['token']
        pwd   = serializer.validated_data['new_password']

        try:
            user = get_user_model().objects.get(email=email)
        except get_user_model().DoesNotExist:
            return Response({"email": ["No such account."]},
                            status=status.HTTP_400_BAD_REQUEST)

        profile = user.profile
        if profile.email_token != token:
            # Bad code → auto‐resend a new one
            new_code = f"{random.randint(0, 999999):06d}"
            profile.email_token = new_code
            profile.save()

            send_mail(
                subject="Your new Circld password reset code",
                message=f"Your new reset code is {new_code}",
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[email],
                fail_silently=False,
            )

            return Response(
                {"token": "Invalid code. A new reset code has been sent to your email."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Everything checks out → reset password
        user.set_password(pwd)
        user.save()
        profile.email_token = ""
        profile.save()

        return Response({"message": "Password has been reset."})