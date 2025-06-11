from django.contrib.auth.backends import ModelBackend
from django.contrib.auth import get_user_model

User = get_user_model()

class EmailOrUsernameBackend(ModelBackend):
    """
    Authenticate with either username or email.
    """

    def authenticate(self, request, username=None, password=None, **kwargs):
        if username is None:
            username = kwargs.get(User.USERNAME_FIELD)
        # Try to fetch by username
        try:
            user = User.objects.get(username__iexact=username)
        except User.DoesNotExist:
            # Fallback: try to fetch by email
            try:
                user = User.objects.get(email__iexact=username)
            except User.DoesNotExist:
                return None
        # Check password & that the user is active
        if user.check_password(password) and self.user_can_authenticate(user):
            return user
        return None
