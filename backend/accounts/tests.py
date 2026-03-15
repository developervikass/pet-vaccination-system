from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase


class AuthAndRoleTests(APITestCase):
    def setUp(self):
        self.user_model = get_user_model()
        self.password = "Pass12345!"
        self.owner = self.user_model.objects.create_user(
            username="owner1",
            email="owner1@example.com",
            password=self.password,
            role="owner",
            phone="9000000001",
        )
        self.doctor = self.user_model.objects.create_user(
            username="doctor1",
            email="doctor1@example.com",
            password=self.password,
            role="doctor",
            phone="9000000002",
            doctor_status="approved",
            doctor_approved=True,
            doctor_verified=True,
        )
        self.admin = self.user_model.objects.create_user(
            username="mainadmin",
            email="mainadmin@example.com",
            password=self.password,
            role="admin",
            phone="9999999999",
            is_staff=True,
            is_superuser=True,
        )
        self.login_url = "/api/accounts/login/"
        self.all_users_url = "/api/accounts/all/"

    def login(self, identifier, role=None):
        payload = {"password": self.password}
        if "@" in identifier:
            payload["email"] = identifier
        else:
            payload["username"] = identifier
        if role:
            payload["role"] = role
        return self.client.post(self.login_url, payload, format="json")

    def test_owner_can_login(self):
        response = self.login(self.owner.username, role="owner")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["role"], "owner")
        self.assertIn("access", response.data)

    def test_doctor_can_login(self):
        response = self.login(self.doctor.username, role="doctor")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["role"], "doctor")
        self.assertIn("access", response.data)

    def test_admin_can_login_with_username(self):
        response = self.login(self.admin.username, role="admin")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("access", response.data)
        self.assertEqual(response.data["role"], "admin")

    def test_admin_can_login_with_email(self):
        response = self.login(self.admin.email, role="admin")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("access", response.data)
        self.assertEqual(response.data["role"], "admin")

    def test_role_mismatch_returns_403(self):
        response = self.login(self.admin.email, role="owner")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_all_users_requires_admin(self):
        owner_login = self.login(self.owner.username, role="owner")
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {owner_login.data['access']}")
        response = self.client.get(self.all_users_url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

        admin_login = self.login(self.admin.username, role="admin")
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {admin_login.data['access']}")
        response = self.client.get(self.all_users_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
