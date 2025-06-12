from django.shortcuts import render

from rest_framework.response import Response
from django.contrib.auth import get_user_model
from rest_framework import viewsets, permissions, status, generics
from .models import Group, Expense, Message, Profile
from .serializers import UserSerializer, GroupSerializer, ExpenseSerializer, MessageSerializer, SignupSerializer, ProfileSerializer
from rest_framework.decorators import action
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
    # queryset = Group.objects.prefetch_related('members').all()
    serializer_class = GroupSerializer
    permission_classes = [permissions.IsAuthenticated]


    def get_queryset(self):
        # Only return groups where the current user is a member
        return Group.objects.filter(members=self.request.user).prefetch_related('members')
    
    def perform_create(self, serializer):
        # 1) Create the group with whatever fields were passed (e.g. “name”)
        group = serializer.save()
        # 2) Add the requesting user as a member of that new group
        group.members.add(self.request.user)
        # 3) You could also assign extra behavior, e.g. set group.owner = request.user
        #    if you add an “owner” ForeignKey on Group in the future.
    
    @action(detail=False, methods=['post'], url_path='join')
    def join_group(self, request):
        """
        POST /api/groups/join/  with JSON { "invite_code": "abcd1234" }
        """
        code = request.data.get('invite_code', '').strip()
        if not code:
            return Response(
                {"invite_code": ["This field is required."]},
                status=status.HTTP_400_BAD_REQUEST
            )
        try:
            group = Group.objects.get(invite_code=code)
        except Group.DoesNotExist:
            return Response(
                {"detail": "Invalid invite code."},
                status=status.HTTP_404_NOT_FOUND
            )

        group.members.add(request.user)
        serializer = self.get_serializer(group)
        return Response(serializer.data, status=status.HTTP_200_OK)

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
    serializer_class = MessageSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        group_id = self.request.query_params.get('group')
        # only fetch messages for that group
        return Message.objects.filter(group_id=group_id).order_by('ts')

    def perform_create(self, serializer):
        # automatically set sender to the authenticated user
        serializer.save(sender=self.request.user)


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

# TEMP
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
# TEMP

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