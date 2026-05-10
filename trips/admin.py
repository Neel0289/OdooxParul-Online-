from django.contrib import admin
from .models import UserProfile, Trip, Stop, Activity, Budget, PackingItem, Note, TripShare


@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ['user', 'created_at', 'updated_at']
    search_fields = ['user__username', 'user__email']


@admin.register(Trip)
class TripAdmin(admin.ModelAdmin):
    list_display = ['title', 'user', 'start_date', 'end_date', 'is_public', 'created_at']
    search_fields = ['title', 'user__username']
    filter_list = ['is_public', 'start_date']


@admin.register(Stop)
class StopAdmin(admin.ModelAdmin):
    list_display = ['city_name', 'country', 'trip', 'arrival_date', 'departure_date', 'cost_index']
    search_fields = ['city_name', 'country', 'trip__title']
    filter_list = ['cost_index', 'arrival_date']


@admin.register(Activity)
class ActivityAdmin(admin.ModelAdmin):
    list_display = ['title', 'stop', 'category', 'cost', 'duration_hours']
    search_fields = ['title', 'stop__city_name']
    filter_list = ['category']


@admin.register(Budget)
class BudgetAdmin(admin.ModelAdmin):
    list_display = ['trip', 'category', 'estimated_cost', 'actual_cost']
    search_fields = ['trip__title', 'category']
    filter_list = ['category']


@admin.register(PackingItem)
class PackingItemAdmin(admin.ModelAdmin):
    list_display = ['item_name', 'trip', 'category', 'is_packed']
    search_fields = ['item_name', 'trip__title']
    filter_list = ['category', 'is_packed']


@admin.register(Note)
class NoteAdmin(admin.ModelAdmin):
    list_display = ['trip', 'stop', 'timestamp', 'created_at']
    search_fields = ['trip__title', 'stop__city_name', 'content']
    filter_list = ['timestamp']


@admin.register(TripShare)
class TripShareAdmin(admin.ModelAdmin):
    list_display = ['trip', 'is_public', 'share_token', 'created_at']
    search_fields = ['trip__title', 'share_token']
    filter_list = ['is_public']
