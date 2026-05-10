from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone
import uuid

class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    profile_picture = models.ImageField(upload_to='profile_pictures/', null=True, blank=True)
    bio = models.TextField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.username}'s Profile"

class Trip(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='trips')
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True, default='')
    start_date = models.DateField()
    end_date = models.DateField()
    cover_photo = models.ImageField(upload_to='trip_covers/', null=True, blank=True)
    total_budget = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    is_public = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-start_date']

    def __str__(self):
        return self.title

class Stop(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    trip = models.ForeignKey(Trip, on_delete=models.CASCADE, related_name='stops')
    city_name = models.CharField(max_length=255)
    country = models.CharField(max_length=255)
    latitude = models.FloatField(null=True, blank=True)
    longitude = models.FloatField(null=True, blank=True)
    arrival_date = models.DateField()
    departure_date = models.DateField()
    duration_days = models.PositiveIntegerField()
    cost_index = models.CharField(max_length=20, choices=[
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High')
    ], default='medium')
    description = models.TextField(blank=True, default='')
    order = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['order']

    def __str__(self):
        return f"{self.city_name}, {self.country}"

class Activity(models.Model):
    CATEGORIES = [
        ('sightseeing', 'Sightseeing'),
        ('food', 'Food'),
        ('adventure', 'Adventure'),
        ('shopping', 'Shopping'),
        ('nightlife', 'Nightlife'),
        ('culture', 'Culture'),
        ('relaxation', 'Relaxation'),
        ('other', 'Other'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    stop = models.ForeignKey(Stop, on_delete=models.CASCADE, related_name='activities')
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True, default='')
    category = models.CharField(max_length=50, choices=CATEGORIES, default='sightseeing')
    cost = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    duration_hours = models.PositiveIntegerField(default=1)
    image_url = models.URLField(max_length=500, blank=True, null=True)
    time_scheduled = models.TimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['time_scheduled']

    def __str__(self):
        return self.title

class Budget(models.Model):
    CATEGORIES = [
        ('transport', 'Transport'),
        ('accommodation', 'Accommodation'),
        ('activities', 'Activities'),
        ('food', 'Food'),
        ('other', 'Other'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    trip = models.ForeignKey(Trip, on_delete=models.CASCADE, related_name='budgets')
    category = models.CharField(max_length=50, choices=CATEGORIES, default='other')
    estimated_cost = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    actual_cost = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    notes = models.TextField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.category} - {self.trip.title}"

class PackingItem(models.Model):
    CATEGORIES = [
        ('clothing', 'Clothing'),
        ('documents', 'Documents'),
        ('electronics', 'Electronics'),
        ('toiletries', 'Toiletries'),
        ('medications', 'Medications'),
        ('other', 'Other'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    trip = models.ForeignKey(Trip, on_delete=models.CASCADE, related_name='packing_items')
    item_name = models.CharField(max_length=255)
    category = models.CharField(max_length=50, choices=CATEGORIES, default='other')
    is_packed = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.item_name

class Note(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    trip = models.ForeignKey(Trip, on_delete=models.CASCADE, related_name='notes')
    stop = models.ForeignKey(Stop, on_delete=models.SET_NULL, null=True, blank=True, related_name='notes')
    content = models.TextField()
    timestamp = models.DateTimeField(default=timezone.now)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-timestamp']

    def __str__(self):
        return f"Note from {self.trip.title}"

class TripShare(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    trip = models.ForeignKey(Trip, on_delete=models.CASCADE, related_name='shares')
    shared_with_user = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True, related_name='shared_trips')
    is_public = models.BooleanField(default=True)
    share_token = models.CharField(max_length=100, unique=True, default=uuid.uuid4)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Share - {self.trip.title}"
