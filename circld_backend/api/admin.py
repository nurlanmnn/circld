# circld_backend/api/admin.py

from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as DjangoUserAdmin
from django.utils.translation import gettext_lazy as _

from .models import User, Group, Expense, Message

# Customize the admin site titles:
admin.site.site_header = "Circld Administration"
admin.site.site_title = "Circld Admin Portal"
admin.site.index_title = "Welcome to Circld Admin"

# 1) Registering the custom User model
#
# We subclass Django’s built-in UserAdmin so that the fields and forms
# behave like the default admin, but target our api.User model.
#

@admin.register(User)
class UserAdmin(DjangoUserAdmin):
    # If you did not add any extra fields to your User model, the defaults
    # from DjangoUserAdmin will work fine. But you can override list_display, etc.
    fieldsets = (
        (None, {'fields': ('username', 'password')}),
        (_('Personal info'), {'fields': ('first_name', 'last_name', 'email')}),
        (_('Permissions'), {
            'fields': (
                'is_active',
                'is_staff',
                'is_superuser',
                'groups',        # built-in “auth” groups
                'user_permissions',
            ),
        }),
        (_('Important dates'), {'fields': ('last_login', 'date_joined')}),
    )

    # Show these columns on the “Users” changelist page:
    list_display = ('username', 'email', 'first_name', 'last_name', 'is_staff')
    search_fields = ('username', 'email', 'first_name', 'last_name')

    # Keep the default ordering by username:
    ordering = ('username',)

#
# 2) Registering Group
#
@admin.register(Group)
class GroupAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'member_count', 'invite_code')
    search_fields = ('name',)
    filter_horizontal = ('members',)   # makes the ManyToManyField appear as a dual-list widget

    def member_count(self, obj):
        return obj.members.count()
    member_count.short_description = 'Number of Members'

#
# 3) Registering Expense
#
@admin.register(Expense)
class ExpenseAdmin(admin.ModelAdmin):
    list_display = ('id', 'group', 'paid_by', 'amount', 'created')
    list_filter = ('group', 'paid_by', 'created')
    search_fields = ('note', 'paid_by__username', 'group__name')
    readonly_fields = ('created',)

    # If you want to show “paid_by_username” instead of paid_by’s __str__:
    def paid_by_username(self, obj):
        return obj.paid_by.username
    paid_by_username.short_description = 'Paid By'

#
# 4) Registering Message
#
@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    list_display = ('id', 'group', 'sender', 'ts', 'snippet')
    list_filter = ('group', 'sender', 'ts')
    search_fields = ('text', 'sender__username', 'group__name')
    readonly_fields = ('ts',)

    def snippet(self, obj):
        return (obj.text[:50] + '…') if len(obj.text) > 50 else obj.text
    snippet.short_description = 'Message Snippet'

