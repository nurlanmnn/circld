from django.shortcuts import render

# Create your views here.
# api/views.py
from rest_framework.response import Response
from django.contrib.auth import get_user_model
from rest_framework import viewsets, permissions, status, generics
from .models import Group, Expense, Message
from .serializers import UserSerializer, GroupSerializer, ExpenseSerializer, MessageSerializer, SignupSerializer
from rest_framework.decorators import action

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
    queryset = Expense.objects.select_related('paid_by', 'group').all()
    serializer_class = ExpenseSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return (
            Expense.objects.select_related("paid_by", "group")
            .filter(group__members=self.request.user)
        )
    
    def perform_create(self, serializer):
        serializer.save(paid_by=self.request.user)

class MessageViewSet(viewsets.ModelViewSet):
    queryset = Message.objects.select_related('sender', 'group').all()
    serializer_class = MessageSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return (
            Message.objects.select_related("sender", "group")
            .filter(group__members=self.request.user)
        )
        
    def perform_create(self, serializer):
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