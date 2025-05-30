# Create your models here.
from django.contrib.auth.models import AbstractUser
from django.db import models
from django.conf import settings

class User(AbstractUser):
    pass

class Group(models.Model):
    name = models.CharField(max_length=100)
    members = models.ManyToManyField(
        settings.AUTH_USER_MODEL,
        related_name='circld_groups',        # avoids clash with auth.User.groups
        related_query_name='circld_group',   # query name for lookups
        blank=True,
    )


class Expense(models.Model):
    group    = models.ForeignKey(Group, on_delete=models.CASCADE)
    paid_by  = models.ForeignKey(User, on_delete=models.CASCADE)
    amount   = models.DecimalField(max_digits=10, decimal_places=2)
    note     = models.CharField(max_length=200, blank=True)
    created  = models.DateTimeField(auto_now_add=True)

class Message(models.Model):
    group   = models.ForeignKey(Group, on_delete=models.CASCADE)
    sender  = models.ForeignKey(User, on_delete=models.CASCADE)
    text    = models.TextField()
    ts      = models.DateTimeField(auto_now_add=True)
