from rest_framework import serializers
from .models import User


class RegisterSerializer(serializers.ModelSerializer):
    profile_photo_url = serializers.SerializerMethodField(read_only=True)

    def get_profile_photo_url(self, obj):
        if not obj.profile_photo:
            return None
        request = self.context.get("request")
        url = obj.profile_photo.url
        return request.build_absolute_uri(url) if request else url

    class Meta:
        model = User
        fields = [
            "username",
            "email",
            "password",
            "role",
            "phone",
            "bio",
            "profile_photo",
            "profile_photo_url",
            "doctor_status",
            "doctor_approved",
            "doctor_verified",
        ]
        read_only_fields = ["doctor_status", "doctor_approved", "doctor_verified"]
        extra_kwargs = {'password': {'write_only': True}}

    def validate_role(self, value):
        if value == "admin":
            raise serializers.ValidationError("Admin accounts cannot be self-registered.")
        return value

    def create(self, validated_data):
        role = validated_data.get("role")
        if role == "doctor":
            validated_data["doctor_status"] = "pending"
            validated_data["doctor_approved"] = False
            validated_data["doctor_verified"] = False
        else:
            validated_data["doctor_status"] = "approved"
            validated_data["doctor_approved"] = True
            validated_data["doctor_verified"] = True
        user = User.objects.create_user(**validated_data)
        return user


class CreateAdminSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["username", "email", "password", "phone", "bio", "profile_photo"]
        extra_kwargs = {"password": {"write_only": True}}

    def create(self, validated_data):
        return User.objects.create_user(
            **validated_data,
            role="admin",
            is_staff=True,
            is_superuser=True,
            doctor_status="approved",
            doctor_approved=True,
            doctor_verified=True,
        )
