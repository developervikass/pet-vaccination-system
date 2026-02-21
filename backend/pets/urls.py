from django.urls import path
from .views import *

urlpatterns = [
    path('add/', AddPet.as_view()),
    path('update/<int:pk>/', UpdatePet.as_view()),
    path('delete/<int:pk>/', DeletePet.as_view()),
    path('owner/<int:owner_id>/', OwnerPets.as_view()),
    path('my/', MyPets.as_view()),
    path('detail/<int:pk>/', PetDetail.as_view()),

    path('summary/', AddSummary.as_view()),
    path('summary/update/<int:pk>/', UpdateSummary.as_view()),
    path('summary/delete/<int:pk>/', DeleteSummary.as_view()),

    path('all/', AllPets.as_view()),
    path('reminder-logs/', ReminderLogsView.as_view()),
]
