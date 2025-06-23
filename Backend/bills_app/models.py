from django.db import models

class Bill(models.Model):
    name = models.CharField(max_length=255)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    due_date = models.DateField()
    category = models.CharField(max_length=100)
    notes = models.TextField(blank=True)
    is_recurring = models.BooleanField(default=False)
    is_paid = models.BooleanField(default=False)

    def __str__(self):
        return self.name

class Reminder(models.Model):
    bill = models.ForeignKey(Bill, on_delete=models.CASCADE)
    email = models.EmailField()
    reminder_datetime = models.DateTimeField()
    message = models.TextField()
    send_email = models.BooleanField(default=True)

    def __str__(self):
        return f"Reminder for {self.bill.name}"
