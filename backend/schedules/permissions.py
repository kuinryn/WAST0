from rest_framework.permissions import BasePermission

class IsOfficialOrSuperAdmin(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in ['official', 'super_admin']

class IsOfficialOfBarangay(BasePermission):
    def has_object_permission(self, request, view, obj):
        if request.user.role == 'super_admin':
            return True
        return request.user.role == 'official' and request.user.barangay == obj.barangay