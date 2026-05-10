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
        # Do NOT expose totp_secret in public serializer
        fields = ['user', 'profile_picture', 'bio', 'two_factor_enabled', 'profile_public', 'show_email', 'created_at', 'updated_at']


class ActivitySerializer(serializers.ModelSerializer):
    class Meta:
        model = Activity
        fields = ['id', 'stop', 'title', 'description', 'category', 'cost', 'duration_hours', 'image_url', 'time_scheduled', 'created_at']


class StopSerializer(serializers.ModelSerializer):
    activities = ActivitySerializer(many=True, required=False)

    class Meta:
        model = Stop
        fields = ['id', 'trip', 'city_name', 'country', 'latitude', 'longitude', 'arrival_date', 'arrival_time', 'departure_date', 'departure_time', 'duration_days', 'estimated_budget', 'cost_index', 'description', 'order', 'activities', 'created_at']
        read_only_fields = ['trip']

    def create(self, validated_data):
        activities_data = validated_data.pop('activities', [])
        stop = Stop.objects.create(**validated_data)
        for act_data in activities_data:
            Activity.objects.create(stop=stop, **act_data)
        return stop

    def update(self, instance, validated_data):
        activities_data = validated_data.pop('activities', None)
        
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        if activities_data is not None:
            # Simple approach: clear and recreate
            instance.activities.all().delete()
            for act_data in activities_data:
                Activity.objects.create(stop=instance, **act_data)
                
        return instance


class BudgetSerializer(serializers.ModelSerializer):
    class Meta:
        model = Budget
        fields = ['id', 'trip', 'category', 'estimated_cost', 'actual_cost', 'notes', 'created_at', 'updated_at']


class PackingItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = PackingItem
        fields = ['id', 'trip', 'item_name', 'category', 'description', 'quantity', 'price', 'photo', 'is_packed', 'created_at']
        read_only_fields = ['trip']


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
