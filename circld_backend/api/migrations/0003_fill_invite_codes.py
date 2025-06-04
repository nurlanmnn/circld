# api/migrations/0003_fill_invite_codes.py

from django.db import migrations
import uuid
from collections import Counter

def generate_unique_code(existing_codes):
    """
    Generate a random 8-char code not already in existing_codes.
    """
    while True:
        code = uuid.uuid4().hex[:8]
        if code not in existing_codes:
            return code

def fill_invite_codes(apps, schema_editor):
    Group = apps.get_model('api', 'Group')

    # 1) Collect all current invite_code values (some may be duplicates)
    codes = list(Group.objects.values_list('invite_code', flat=True))
    counter = Counter(codes)
    existing = set(codes)

    # 2) For each group with a duplicate or blank code, assign a fresh unique one
    for code, count in counter.items():
        if code == "" or count > 1:
            # Find all Group rows that have this code
            same = list(Group.objects.filter(invite_code=code))
            # Keep the first instance’s code the same; re‐code the rest
            for dup in same[1:]:
                new_code = generate_unique_code(existing)
                existing.add(new_code)
                # Update that single row to the new code
                Group.objects.filter(pk=dup.pk).update(invite_code=new_code)

    # 3) Finally, check if any group has a blank code (just in case)
    for g in Group.objects.filter(invite_code=""):
        new_code = generate_unique_code(existing)
        existing.add(new_code)
        Group.objects.filter(pk=g.pk).update(invite_code=new_code)

class Migration(migrations.Migration):

    dependencies = [
        ('api', '0002_group_invite_code'),
    ]

    operations = [
        migrations.RunPython(fill_invite_codes, migrations.RunPython.noop),
    ]