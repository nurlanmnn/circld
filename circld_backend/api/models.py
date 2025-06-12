# Create your models here.
from django.contrib.auth.models import AbstractUser
import uuid
from django.db import models
from django.conf import settings
# TEMP
from django.db.models.signals import post_save
from django.dispatch import receiver

# User = get_user_model()
class User(AbstractUser):
    pass

class Profile(models.Model):
    user        = models.OneToOneField(User, on_delete=models.CASCADE)
    email_token = models.CharField(max_length=64, blank=True)
    avatar      = models.ImageField(upload_to='avatars/', blank=True, null=True)

    def __str__(self):
        return f"{self.user.username} Profile"

@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    if created:
        Profile.objects.create(user=instance)


def generate_invite_code():
    # Use the first 8 characters of a UUID4 hex string.
    return uuid.uuid4().hex[:8]

class Group(models.Model):
    name = models.CharField(max_length=100)
    members = models.ManyToManyField(
        settings.AUTH_USER_MODEL,
        related_name='circld_groups',        # avoids clash with auth.User.groups
        related_query_name='circld_group',   # query name for lookups
        blank=True,
    )
    # field: an 8-character invite code
    invite_code = models.CharField(
        max_length=8,
        unique=True,
        default=generate_invite_code,
        editable=False  # hide from admin form; generated automatically
    )

    def __str__(self):
        return self.name

class Expense(models.Model):
    group   = models.ForeignKey('Group', on_delete=models.CASCADE, related_name='expenses')
    paid_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='paid_expenses'
    )
    amount  = models.DecimalField(max_digits=10, decimal_places=2)
    note    = models.CharField(max_length=255, blank=True)
    created = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.paid_by.username if self.paid_by else 'Unknown'}: ${self.amount} {self.note}"


class Message(models.Model):
    group  = models.ForeignKey('Group', on_delete=models.CASCADE, related_name='messages')
    sender = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='sent_messages'
    )
    text = models.TextField()
    ts   = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.sender.username if self.sender else 'Unknown'} @ {self.ts:%H:%M}: {self.text[:20]}"
