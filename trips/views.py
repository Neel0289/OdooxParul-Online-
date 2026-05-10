from rest_framework import viewsets, status, generics
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.contrib.auth.models import User
from django.db.models import Q
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from .models import UserProfile, Trip, Stop, Activity, Budget, PackingItem, Note, TripShare
from .serializers import (
    UserSerializer, UserProfileSerializer, TripSerializer, StopSerializer,
    ActivitySerializer, BudgetSerializer, PackingItemSerializer, NoteSerializer,
    TripShareSerializer
)


@method_decorator(csrf_exempt, name='dispatch')
class UserRegistrationView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [AllowAny]

    def create(self, request, *args, **kwargs):
        username = request.data.get('username')
        email = request.data.get('email')
        password = request.data.get('password')
        first_name = request.data.get('first_name', '')
        last_name = request.data.get('last_name', '')

        if not username or not email or not password:
            return Response({'error': 'Missing required fields'}, status=status.HTTP_400_BAD_REQUEST)

        if User.objects.filter(username=username).exists():
            return Response({'error': 'Username already exists'}, status=status.HTTP_400_BAD_REQUEST)

        if User.objects.filter(email=email).exists():
            return Response({'error': 'Email already exists'}, status=status.HTTP_400_BAD_REQUEST)

        user = User.objects.create_user(
            username=username,
            email=email,
            password=password,
            first_name=first_name,
            last_name=last_name
        )

        # Create user profile
        UserProfile.objects.create(user=user)

        return Response(UserSerializer(user).data, status=status.HTTP_201_CREATED)


class UserProfileViewSet(viewsets.ModelViewSet):
    serializer_class = UserProfileSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return UserProfile.objects.filter(user=self.request.user)

    def get_object(self):
        return UserProfile.objects.get(user=self.request.user)


class TripViewSet(viewsets.ModelViewSet):
    serializer_class = TripSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        return Trip.objects.filter(Q(user=user) | Q(is_public=True))

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=True, methods=['post'])
    def share(self, request, pk=None):
        trip = self.get_object()
        is_public = request.data.get('is_public', True)
        share = TripShare.objects.create(trip=trip, is_public=is_public)
        return Response(TripShareSerializer(share).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'])
    def copy(self, request, pk=None):
        trip = self.get_object()
        new_trip = Trip.objects.create(
            user=request.user,
            title=f"{trip.title} (Copy)",
            description=trip.description,
            start_date=trip.start_date,
            end_date=trip.end_date,
            total_budget=trip.total_budget,
        )

        # Copy stops and activities
        for stop in trip.stops.all():
            new_stop = Stop.objects.create(
                trip=new_trip,
                city_name=stop.city_name,
                country=stop.country,
                latitude=stop.latitude,
                longitude=stop.longitude,
                arrival_date=stop.arrival_date,
                departure_date=stop.departure_date,
                duration_days=stop.duration_days,
                cost_index=stop.cost_index,
                description=stop.description,
                order=stop.order
            )

            for activity in stop.activities.all():
                Activity.objects.create(
                    stop=new_stop,
                    title=activity.title,
                    description=activity.description,
                    category=activity.category,
                    cost=activity.cost,
                    duration_hours=activity.duration_hours,
                    image_url=activity.image_url,
                    time_scheduled=activity.time_scheduled
                )

        return Response(TripSerializer(new_trip).data, status=status.HTTP_201_CREATED)


class StopViewSet(viewsets.ModelViewSet):
    serializer_class = StopSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        trip_id = self.kwargs.get('trip_pk')
        return Stop.objects.filter(trip_id=trip_id)

    def perform_create(self, serializer):
        trip_id = self.kwargs.get('trip_pk')
        serializer.save(trip_id=trip_id)


class ActivityViewSet(viewsets.ModelViewSet):
    serializer_class = ActivitySerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        stop_id = self.kwargs.get('stop_pk')
        return Activity.objects.filter(stop_id=stop_id)

    def perform_create(self, serializer):
        stop_id = self.kwargs.get('stop_pk')
        serializer.save(stop_id=stop_id)


class BudgetViewSet(viewsets.ModelViewSet):
    serializer_class = BudgetSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        trip_id = self.kwargs.get('trip_pk')
        return Budget.objects.filter(trip_id=trip_id)

    def perform_create(self, serializer):
        trip_id = self.kwargs.get('trip_pk')
        serializer.save(trip_id=trip_id)


class PackingItemViewSet(viewsets.ModelViewSet):
    serializer_class = PackingItemSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        trip_id = self.kwargs.get('trip_pk')
        return PackingItem.objects.filter(trip_id=trip_id)

    def perform_create(self, serializer):
        trip_id = self.kwargs.get('trip_pk')
        serializer.save(trip_id=trip_id)


class NoteViewSet(viewsets.ModelViewSet):
    serializer_class = NoteSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        trip_id = self.kwargs.get('trip_pk')
        return Note.objects.filter(trip_id=trip_id)

    def perform_create(self, serializer):
        trip_id = self.kwargs.get('trip_pk')
        serializer.save(trip_id=trip_id)


class PublicTripView(generics.RetrieveAPIView):
    queryset = TripShare.objects.all()
    serializer_class = TripShareSerializer
    permission_classes = [AllowAny]
    lookup_field = 'share_token'

    def get_object(self):
        share_token = self.kwargs.get('share_token')
        return TripShare.objects.get(share_token=share_token)
