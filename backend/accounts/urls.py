from django.urls import path
from .views import (
    RegisterView,
    AllUsersView,
    DeleteUser,
    DoctorVerificationView,
    LoginView,
    ForgotPasswordView,
    ResetPasswordView,
    ToggleUserActiveView,
    CreateAdminView,
    MeView,
    ApprovedDoctorsView,
)

urlpatterns = [
    path('register/', RegisterView.as_view()),
    path('all/', AllUsersView.as_view()),
    path('me/', MeView.as_view()),
    path('approved-doctors/', ApprovedDoctorsView.as_view()),
    path('delete/<int:pk>/', DeleteUser.as_view()),
    path('doctors/<int:pk>/verify/', DoctorVerificationView.as_view()),
    path('users/<int:pk>/active/', ToggleUserActiveView.as_view()),
    path('admins/create/', CreateAdminView.as_view()),
    path('login/', LoginView.as_view()),
    path('forgot-password/', ForgotPasswordView.as_view()),
    path('reset-password/', ResetPasswordView.as_view()),
]
