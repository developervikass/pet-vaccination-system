from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from .models import Pet, DoctorSummary
from .serializers import PetSerializer, SummarySerializer, PetProfileSerializer
from accounts.models import User


def _doctor_is_verified(user):
    return (
        user.role == "doctor"
        and user.doctor_status == "approved"
        and user.doctor_approved
        and user.doctor_verified
    )


def _doctor_verification_error():
    return Response(
        {"message": "Doctor account must be admin approved and verified."},
        status=status.HTTP_403_FORBIDDEN,
    )


# =======================
# OWNER FEATURES
# =======================

class AddPet(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        if request.user.role != "owner":
            return Response({"message": "Only owners can add pets."}, status=status.HTTP_403_FORBIDDEN)
        payload = request.data.copy()
        payload["owner"] = request.user.id
        serializer = PetSerializer(data=payload, context={"request": request})
        if serializer.is_valid():
            serializer.save()
            return Response({"message":"Pet Added"})
        return Response(serializer.errors)


class UpdatePet(APIView):
    permission_classes = [IsAuthenticated]

    def put(self, request, pk):
        pet = get_object_or_404(Pet, id=pk)
        if request.user.role == "owner" and pet.owner_id != request.user.id:
            return Response({"message": "Not allowed"}, status=status.HTTP_403_FORBIDDEN)
        if request.user.role not in ["owner", "admin"]:
            return Response({"message": "Not allowed"}, status=status.HTTP_403_FORBIDDEN)
        serializer = PetSerializer(pet, data=request.data, context={"request": request})
        if serializer.is_valid():
            serializer.save()
            return Response({"message":"Pet Updated"})
        return Response(serializer.errors)


class DeletePet(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, pk):
        pet = get_object_or_404(Pet, id=pk)
        if request.user.role == "owner" and pet.owner_id != request.user.id:
            return Response({"message": "Not allowed"}, status=status.HTTP_403_FORBIDDEN)
        if request.user.role not in ["owner", "admin"]:
            return Response({"message": "Not allowed"}, status=status.HTTP_403_FORBIDDEN)
        pet.delete()
        return Response({"message":"Pet Deleted"})


class OwnerPets(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, owner_id):
        if request.user.role == "doctor" and not _doctor_is_verified(request.user):
            return _doctor_verification_error()
        if request.user.role == "owner" and request.user.id != owner_id:
            return Response({"message": "Not allowed"}, status=status.HTTP_403_FORBIDDEN)
        pets = Pet.objects.filter(owner_id=owner_id)
        serializer = PetSerializer(pets, many=True, context={"request": request})
        return Response(serializer.data)

class MyPets(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.role != "owner":
            return Response({"message": "Only owners can view this list."}, status=status.HTTP_403_FORBIDDEN)
        pets = Pet.objects.filter(owner=request.user)
        serializer = PetSerializer(pets, many=True, context={"request": request})
        return Response(serializer.data)


class PetDetail(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        pet = get_object_or_404(Pet, id=pk)
        if request.user.role == "doctor" and not _doctor_is_verified(request.user):
            return _doctor_verification_error()
        if request.user.role == "owner" and pet.owner_id != request.user.id:
            return Response({"message": "Not allowed"}, status=status.HTTP_403_FORBIDDEN)

        serializer = PetProfileSerializer(pet, context={"request": request})
        return Response(serializer.data)


# =======================
# DOCTOR FEATURES
# =======================

class AddSummary(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        if request.user.role != "doctor":
            return Response({"message": "Only doctors can add summaries."}, status=403)
        if not _doctor_is_verified(request.user):
            return _doctor_verification_error()

        serializer = SummarySerializer(data=request.data, context={"request": request})
        if serializer.is_valid():
            next_vaccination_at = serializer.validated_data.get("next_vaccination_at")
            if next_vaccination_at and next_vaccination_at.date() < timezone.localdate():
                return Response(
                    {"next_vaccination_at": ["Vaccination date cannot be in the past."]},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            serializer.save(doctor=request.user)
            return Response({"message":"Summary Added"})
        return Response(serializer.errors)


class UpdateSummary(APIView):
    permission_classes = [IsAuthenticated]

    def put(self, request, pk):
        summary = get_object_or_404(DoctorSummary, id=pk)
        serializer = SummarySerializer(summary, data=request.data, context={"request": request})
        if serializer.is_valid():
            serializer.save()
            return Response({"message":"Summary Updated"})
        return Response(serializer.errors)


class DeleteSummary(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, pk):
        summary = get_object_or_404(DoctorSummary, id=pk)
        summary.delete()
        return Response({"message":"Summary Deleted"})


# =======================
# ADMIN FEATURES
# =======================

class AllPets(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.role not in ["doctor", "admin"]:
            return Response({"message": "Not allowed"}, status=status.HTTP_403_FORBIDDEN)
        if request.user.role == "doctor" and not _doctor_is_verified(request.user):
            return _doctor_verification_error()
        phone = request.query_params.get("phone")
        pets = Pet.objects.select_related("owner").all()
        if phone:
            pets = pets.filter(owner__phone__icontains=phone)
        serializer = PetSerializer(pets, many=True, context={"request": request})
        return Response(serializer.data)


class ReminderLogsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.role != "admin":
            return Response({"message": "Only admin can view reminder logs."}, status=status.HTTP_403_FORBIDDEN)

        summaries = (
            DoctorSummary.objects.select_related("pet", "pet__owner", "doctor")
            .order_by("-created_at")
        )

        logs = [
            {
                "id": item.id,
                "pet_name": item.pet.name,
                "owner_email": item.pet.owner.email,
                "doctor_username": item.doctor.username,
                "next_vaccination_at": item.next_vaccination_at,
                "reminder_sent": item.reminder_sent,
                "reminder_sent_at": item.reminder_sent_at,
                "created_at": item.created_at,
            }
            for item in summaries
        ]
        return Response(logs)


class DeleteUser(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, pk):
        user = User.objects.get(id=pk)
        user.delete()
        return Response({"message":"User Deleted"})
    

# class AllPets(APIView):
#     def get(self, request):
#         pets = Pet.objects.all()
#         serializer = PetSerializer(pets, many=True)
#         return Response(serializer.data)
