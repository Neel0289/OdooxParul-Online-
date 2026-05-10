from rest_framework import serializers
from django.contrib.auth.models import User
from .models import UserProfile, Trip, Stop, Activity, Budget, PackingItem, Note, TripShare


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name']


class UserProfileSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)

    class Meta:
        model = UserProfile
        fields = ['user', 'profile_picture', 'bio', 'created_at', 'updated_at']


class ActivitySerializer(serializers.ModelSerializer):
    class Meta:
        model = Activity
        fields = ['id', 'stop', 'title', 'description', 'category', 'cost', 'duration_hours', 'image_url', 'time_scheduled', 'created_at']


class StopSerializer(serializers.ModelSerializer):
    activities = ActivitySerializer(many=True, read_only=True)

    class Meta:
        model = Stop
        fields = ['id', 'trip', 'city_name', 'country', 'latitude', 'longitude', 'arrival_date', 'departure_date', 'duration_days', 'cost_index', 'description', 'order', 'activities', 'created_at']


class BudgetSerializer(serializers.ModelSerializer):
    class Meta:
        model = Budget
        fields = ['id', 'trip', 'category', 'estimated_cost', 'actual_cost', 'notes', 'created_at', 'updated_at']


class PackingItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = PackingItem
        fields = ['id', 'trip', 'item_name', 'category', 'is_packed', 'created_at']


class NoteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Note
        fields = ['id', 'trip', 'stop', 'content', 'timestamp', 'created_at', 'updated_at']


class TripShareSerializer(serializers.ModelSerializer):
    class Meta:
        model = TripShare
        fields = ['id', 'trip', 'shared_with_user', 'is_public', 'share_token', 'created_at']


class TripSerializer(serializers.ModelSerializer):
    stops = StopSerializer(many=True, read_only=True)
    budgets = BudgetSerializer(many=True, read_only=True)
    packing_items = PackingItemSerializer(many=True, read_only=True)
    notes = NoteSerializer(many=True, read_only=True)
    shares = TripShareSerializer(many=True, read_only=True)
    user = UserSerializer(read_only=True)

    class Meta:
        model = Trip
        fields = ['id', 'user', 'title', 'description', 'start_date', 'end_date', 'cover_photo', 'total_budget', 'is_public', 'stops', 'budgets', 'packing_items', 'notes', 'shares', 'created_at', 'updated_at']
