from django.db import models
from django.utils import timezone
from django.contrib.auth.models import AbstractUser
from django.conf import settings  # Added for settings.AUTH_USER_MODEL

# -----------------------------
# 1) Custom User Model
# -----------------------------
class User(AbstractUser):
    name = models.CharField(max_length=255)
    email = models.EmailField(unique=True)
    age = models.IntegerField(null=True, blank=True)
    college = models.CharField(max_length=255, null=True, blank=True)
    year = models.CharField(max_length=50, null=True, blank=True)
    course = models.CharField(max_length=255, null=True, blank=True)
    expected_income = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)

    # Override groups and user_permissions to avoid reverse accessor clashes
    groups = models.ManyToManyField(
        'auth.Group',
        related_name='component_user_groups',  # Unique reverse accessor
        blank=True,
        help_text='The groups this user belongs to.',
        verbose_name='groups',
    )
    user_permissions = models.ManyToManyField(
        'auth.Permission',
        related_name='component_user_permissions',  # Unique reverse accessor
        blank=True,
        help_text='Specific permissions for this user.',
        verbose_name='user permissions',
    )

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['name', 'username']

    def __str__(self):
        return self.email


# -----------------------------
# 2) Conversation Model
# -----------------------------
class Conversation(models.Model):
    name = models.CharField(max_length=200)
    is_group = models.BooleanField(default=False)
    def __str__(self):
        return self.name

class Message(models.Model):
    MESSAGE_TYPES = (
        ('text', 'Text'),
        ('image', 'Image'),
        ('video', 'Video'),
        ('file', 'File'),
    )
    conversation = models.ForeignKey(
        Conversation, on_delete=models.CASCADE, related_name='messages'
    )
    sender = models.CharField(max_length=100)
    content = models.TextField()
    timestamp = models.DateTimeField(default=timezone.now)
    file_url = models.URLField(max_length=500, blank=True, null=True)
    message_type = models.CharField(max_length=10, choices=MESSAGE_TYPES, default='text')
    sender_user = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True, related_name='messages'
    )

    def __str__(self):
        return f"{self.sender}: {self.content[:30]}"
# -----------------------------
# 4) Debt Model
# -----------------------------
class Debt(models.Model):
    name = models.CharField(max_length=200)
    principal = models.FloatField()
    interest_rate = models.FloatField()
    term_months = models.IntegerField()
    date_added = models.DateField(auto_now_add=True)
    remaining_balance = models.FloatField()
    debt_type = models.CharField(max_length=100, default='Debt Type')
    due_date = models.DateField(null=True, blank=True)

    def __str__(self):
        return self.name


# -----------------------------
# 5) Profile Model
# -----------------------------
class Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    full_name = models.CharField(max_length=200, blank=True)
    avatar = models.ImageField(upload_to='avatars/', null=True, blank=True)
    last_active = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"{self.full_name or self.user.email}"

    def update_activity(self):
        self.last_active = timezone.now()
        self.save()


# -----------------------------
# 6) Invest Model
# -----------------------------

class Investment(models.Model):
    TYPE_CHOICES = [
        ('STOCK', 'Stock'),
        ('BOND', 'Bond'),
        ('REAL_ESTATE', 'Real Estate'),
        ('CRYPTO', 'Cryptocurrency'),
        ('OTHER', 'Other')
    ]
    STATUS_CHOICES = [
        ('ACTIVE', 'Active'),
        ('SOLD', 'Sold'),
        ('MATURED', 'Matured')
    ]
    
    amount = models.DecimalField(max_digits=15, decimal_places=2, default=0.00)  # Added default
    type = models.CharField(max_length=20, choices=TYPE_CHOICES, default='STOCK')  # Added default
    description = models.TextField(blank=True, default='')  # Added default
    status = models.CharField(max_length=10, default='ACTIVE')  # Added default
    date_invested = models.DateTimeField(auto_now_add=True)
    

class ProfitLoss(models.Model):
    TYPE_CHOICES = [
        ('PROFIT', 'Profit'),
        ('LOSS', 'Loss'),
    ]
    
    investment = models.ForeignKey(Investment, on_delete=models.CASCADE)
    date = models.DateTimeField(default=timezone.now)
    amount = models.DecimalField(max_digits=15, decimal_places=2)
    type = models.CharField(max_length=6, choices=TYPE_CHOICES)

class Notification(models.Model):
    message = models.TextField()
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

class Report(models.Model):
    
    report_file = models.FileField(upload_to='reports/')
    date_generated = models.DateTimeField(default=timezone.now)