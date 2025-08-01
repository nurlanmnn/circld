# Generated by Django 5.2.1 on 2025-06-25 14:17

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0008_profile_pending_email'),
    ]

    operations = [
        migrations.AddField(
            model_name='group',
            name='owner',
            field=models.ForeignKey(default=1, on_delete=django.db.models.deletion.CASCADE, related_name='owned_groups', to=settings.AUTH_USER_MODEL),
            preserve_default=False,
        ),
    ]
