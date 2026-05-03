from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from rest_framework import status
from .models import WasteSchedule
from .serializers import WasteScheduleSerializer
from .permissions import IsOfficialOrSuperAdmin, IsOfficialOfBarangay

class WasteScheduleListCreateView(APIView):
    def get_permissions(self):
        if self.request.method == 'GET':
            return [AllowAny()]
        return [IsOfficialOrSuperAdmin()]

    def get(self, request):
        schedules = WasteSchedule.objects.all()
        barangay_id = request.query_params.get('barangay')
        if barangay_id:
            schedules = schedules.filter(barangay__id=barangay_id)
        serializer = WasteScheduleSerializer(schedules, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = WasteScheduleSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(created_by=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class WasteScheduleDetailView(APIView):
    permission_classes = [IsOfficialOrSuperAdmin]

    def get_object(self, pk):
        try:
            return WasteSchedule.objects.get(pk=pk)
        except WasteSchedule.DoesNotExist:
            return None

    def put(self, request, pk):
        schedule = self.get_object(pk)
        if not schedule:
            return Response({'error': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)
        perm = IsOfficialOfBarangay()
        if not perm.has_object_permission(request, self, schedule):
            return Response({'error': 'Forbidden.'}, status=status.HTTP_403_FORBIDDEN)
        serializer = WasteScheduleSerializer(schedule, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        schedule = self.get_object(pk)
        if not schedule:
            return Response({'error': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)
        perm = IsOfficialOfBarangay()
        if not perm.has_object_permission(request, self, schedule):
            return Response({'error': 'Forbidden.'}, status=status.HTTP_403_FORBIDDEN)
        schedule.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)