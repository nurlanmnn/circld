# Create your models here.
from django.contrib.auth.models import AbstractUser
import uuid
from django.db import models
from django.conf import settings

class User(AbstractUser):
    pass

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
