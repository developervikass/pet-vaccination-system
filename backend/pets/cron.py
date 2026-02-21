from datetime import timedelta
from django.conf import settings
from django.core.mail import send_mail
from django.utils import timezone
from .models import DoctorSummary


def send_vaccination_reminders():
    current_time = timezone.now()
    window_start = current_time + timedelta(minutes=9)
    window_end = current_time + timedelta(minutes=10)

    due_summaries = DoctorSummary.objects.select_related("pet", "pet__owner").filter(
        reminder_sent=False,
        next_vaccination_at__gt=window_start,
        next_vaccination_at__lte=window_end,
    )

    for item in due_summaries:
        owner = item.pet.owner
        if not owner.email:
            continue

        send_mail(
            "Upcoming Pet Vaccination Reminder",
            (
                f"Hello {owner.username},\n\n"
                f"This is a reminder that your pet {item.pet.name} has a vaccination scheduled at "
                f"{timezone.localtime(item.next_vaccination_at).strftime('%Y-%m-%d %H:%M')}.\n"
                "Please be ready.\n\n"
                "Regards,\nPet Vaccination System"
            ),
            settings.DEFAULT_FROM_EMAIL,
            [owner.email],
            fail_silently=False,
        )
        item.reminder_sent = True
        item.reminder_sent_at = current_time
        item.save(update_fields=["reminder_sent", "reminder_sent_at"])
