from django.db import models

# Create your models here.
from django.db import models
from accounts.models import User
from django.utils import timezone


class Pet(models.Model):
    owner = models.ForeignKey(User, on_delete=models.CASCADE)
    name = models.CharField(max_length=100)
    age = models.DecimalField(max_digits=5, decimal_places=2)
    breed = models.CharField(max_length=100)
    vaccination_date = models.DateField()
    profile_photo = models.FileField(upload_to="pet_photos/", blank=True, null=True)


class DoctorSummary(models.Model):
    pet = models.ForeignKey(Pet, on_delete=models.CASCADE, related_name="summaries")
    doctor = models.ForeignKey(User, on_delete=models.CASCADE, related_name="written_summaries")
    summary = models.TextField()
    next_vaccination_at = models.DateTimeField(blank=True, null=True)
    reminder_sent = models.BooleanField(default=False)
    reminder_sent_at = models.DateTimeField(blank=True, null=True)
    created_at = models.DateTimeField(default=timezone.now)
