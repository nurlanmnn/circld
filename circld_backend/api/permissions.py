from rest_framework import permissions

class IsGroupOwner(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        # Only the owner may delete the whole group or remove other members
        return obj.owner_id == request.user.id