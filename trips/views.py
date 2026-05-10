from rest_framework import viewsets, status, generics
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.views import APIView
from rest_framework.authtoken.models import Token
from django.contrib.auth.models import User
from django.contrib.auth import authenticate
from django.db.models import Q
import pyotp
import qrcode
import base64
import io
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
import requests
from django.conf import settings
from .models import UserProfile, Trip, Stop, Activity, Budget, PackingItem, Note, TripShare
from .serializers import (
    UserSerializer, UserProfileSerializer, TripSerializer, StopSerializer,
    ActivitySerializer, BudgetSerializer, PackingItemSerializer, NoteSerializer,
    TripShareSerializer
)


class WeatherForecastView(APIView):
    """Expose a simple proxied forecast endpoint that returns the same structure
    used by StopViewSet._fetch_weather_for. Keeps the API key on server side.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        lat = request.query_params.get('lat')
        lon = request.query_params.get('lon')
        date = request.query_params.get('date')
        if not lat or not lon or not date:
            return Response({'error': 'lat, lon and date are required'}, status=status.HTTP_400_BAD_REQUEST)

        # Reuse StopViewSet helper by instantiating temporarily
        sv = StopViewSet()
        try:
            info = sv._fetch_weather_for(lat, lon, date)
        except Exception:
            info = None

        if info is None:
            return Response({'error': 'Weather lookup failed'}, status=status.HTTP_502_BAD_GATEWAY)
        return Response(info, status=status.HTTP_200_OK)


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


@method_decorator(csrf_exempt, name='dispatch')
class UserLoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        username_or_email = request.data.get('username')
        password = request.data.get('password')
        two_factor_code = request.data.get('two_factor_code')

        if not username_or_email or not password:
            return Response({'error': 'Username/email and password are required'}, status=status.HTTP_400_BAD_REQUEST)

        # Determine if it's an email or username
        if '@' in username_or_email:
            try:
                user_obj = User.objects.get(email=username_or_email)
                username = user_obj.username
            except User.DoesNotExist:
                return Response({'error': 'Invalid username or password'}, status=status.HTTP_401_UNAUTHORIZED)
        else:
            username = username_or_email

        user = authenticate(request, username=username, password=password)
        if not user:
            return Response({'error': 'Invalid username or password'}, status=status.HTTP_401_UNAUTHORIZED)
        # If user has 2FA enabled, require TOTP code
        profile, _ = UserProfile.objects.get_or_create(user=user)
        if profile.two_factor_enabled:
            # If code not provided, tell client 2FA is required
            if not two_factor_code:
                return Response({'2fa_required': True}, status=status.HTTP_206_PARTIAL_CONTENT)

            # Verify TOTP
            if not profile.totp_secret:
                return Response({'error': '2FA not properly configured'}, status=status.HTTP_400_BAD_REQUEST)

            totp = pyotp.TOTP(profile.totp_secret)
            if not totp.verify(two_factor_code, valid_window=1):
                return Response({'error': 'Invalid two-factor code'}, status=status.HTTP_401_UNAUTHORIZED)

        token, _ = Token.objects.get_or_create(user=user)
        return Response({
            'token': token.key,
            'user': UserSerializer(user).data,
        }, status=status.HTTP_200_OK)


class UserProfileViewSet(viewsets.ModelViewSet):
    serializer_class = UserProfileSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return UserProfile.objects.filter(user=self.request.user)

    def get_object(self):
        profile, _ = UserProfile.objects.get_or_create(user=self.request.user)
        return profile
    
    def update(self, request, *args, **kwargs):
        # Allow updating nested user fields and profile settings via PUT
        profile = self.get_object()
        user = profile.user

        user_data = request.data.get('user', {})
        if user_data:
            user.first_name = user_data.get('first_name', user.first_name)
            user.last_name = user_data.get('last_name', user.last_name)
            email = user_data.get('email')
            if email:
                user.email = email
            user.save()

        # Profile fields
        bio = request.data.get('bio')
        if bio is not None:
            profile.bio = bio

        # Optional new settings
        if 'two_factor_enabled' in request.data:
            profile.two_factor_enabled = bool(request.data.get('two_factor_enabled'))
        if 'profile_public' in request.data:
            profile.profile_public = bool(request.data.get('profile_public'))
        if 'show_email' in request.data:
            profile.show_email = bool(request.data.get('show_email'))

        profile.save()

        return Response(UserProfileSerializer(profile).data, status=status.HTTP_200_OK)

    @action(detail=False, methods=['put'], url_path='', url_name='update_profile')
    def update_profile(self, request, *args, **kwargs):
        # Support PUT on the collection URL (/api/user-profile/) for current user's profile
        return self.update(request, *args, **kwargs)


class ChangePasswordView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        user = request.user
        old_password = request.data.get('old_password')
        new_password = request.data.get('new_password')

        if not old_password or not new_password:
            return Response({'error': 'old_password and new_password are required'}, status=status.HTTP_400_BAD_REQUEST)

        if not user.check_password(old_password):
            return Response({'error': 'Old password is incorrect'}, status=status.HTTP_400_BAD_REQUEST)

        user.set_password(new_password)
        user.save()
        return Response({'detail': 'Password changed successfully'}, status=status.HTTP_200_OK)


class CurrentProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        profile, _ = UserProfile.objects.get_or_create(user=request.user)
        return Response(UserProfileSerializer(profile).data, status=status.HTTP_200_OK)

    def put(self, request, *args, **kwargs):
        # Reuse logic from UserProfileViewSet.update
            profile, _ = UserProfile.objects.get_or_create(user=request.user)
            user = profile.user

            user_data = request.data.get('user', {})
            if user_data:
                user.first_name = user_data.get('first_name', user.first_name)
                user.last_name = user_data.get('last_name', user.last_name)
                email = user_data.get('email')
                if email:
                    user.email = email
                user.save()

            # Handle file upload (multipart/form-data)
            if hasattr(request, 'FILES') and request.FILES.get('profile_picture'):
                profile.profile_picture = request.FILES.get('profile_picture')

            bio = request.data.get('bio')
            if bio is not None:
                profile.bio = bio

            if 'two_factor_enabled' in request.data:
                profile.two_factor_enabled = bool(request.data.get('two_factor_enabled'))
            if 'profile_public' in request.data:
                profile.profile_public = bool(request.data.get('profile_public'))
            if 'show_email' in request.data:
                profile.show_email = bool(request.data.get('show_email'))

            profile.save()
            return Response(UserProfileSerializer(profile).data, status=status.HTTP_200_OK)


class TwoFactorGenerateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        profile, _ = UserProfile.objects.get_or_create(user=request.user)

        # Generate a secret and save it temporarily
        secret = pyotp.random_base32()
        profile.totp_secret = secret
        profile.save()

        # Create provisioning URI
        name = request.user.email or request.user.username
        issuer = 'Traveloop'
        otpauth = pyotp.totp.TOTP(secret).provisioning_uri(name=name, issuer_name=issuer)

        # Generate QR PNG and return as data URI
        qr = qrcode.make(otpauth)
        buffered = io.BytesIO()
        qr.save(buffered, format='PNG')
        img_b64 = base64.b64encode(buffered.getvalue()).decode()
        data_uri = f"data:image/png;base64,{img_b64}"

        return Response({'otpauth_url': otpauth, 'qr_code': data_uri}, status=status.HTTP_200_OK)


class TwoFactorVerifyView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        code = request.data.get('code')
        profile, _ = UserProfile.objects.get_or_create(user=request.user)

        if not profile.totp_secret:
            return Response({'error': 'No TOTP secret present'}, status=status.HTTP_400_BAD_REQUEST)

        totp = pyotp.TOTP(profile.totp_secret)
        if totp.verify(code, valid_window=1):
            profile.two_factor_enabled = True
            profile.save()
            return Response({'detail': 'Two-factor enabled'}, status=status.HTTP_200_OK)
        else:
            return Response({'error': 'Invalid code'}, status=status.HTTP_400_BAD_REQUEST)


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

    @action(detail=True, methods=['patch'])
    def finish_trip(self, request, pk=None):
        trip = self.get_object()
        actual_spending = request.data.get('actual_spending')
        if actual_spending is not None:
            trip.actual_spending = actual_spending
            trip.is_completed = True
            trip.save()
            return Response(TripSerializer(trip).data, status=status.HTTP_200_OK)
        return Response({'error': 'actual_spending is required'}, status=status.HTTP_400_BAD_REQUEST)

    def destroy(self, request, *args, **kwargs):
        """Allow deletion only by the trip owner."""
        trip = self.get_object()
        if trip.user != request.user:
            return Response({'error': 'You do not have permission to delete this trip.'}, status=status.HTTP_403_FORBIDDEN)
        return super().destroy(request, *args, **kwargs)


class StopViewSet(viewsets.ModelViewSet):
    serializer_class = StopSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        trip_id = self.kwargs.get('trip_pk')
        return Stop.objects.filter(trip_id=trip_id)

    def _fetch_weather_for(self, latitude, longitude, date_str):
        """Call WeatherAPI forecast endpoint and return a simplified summary and warning flag.

        Expects `settings.WEATHERAPI_KEY` to be set. Returns None on failure.
        """
        key = getattr(settings, 'WEATHERAPI_KEY', None)
        if not key:
            return None

        try:
            # WeatherAPI forecast endpoint supports q as lat,lon and dt for date
            url = f"http://api.weatherapi.com/v1/forecast.json"
            params = {
                'key': key,
                'q': f"{latitude},{longitude}",
                'dt': date_str,
                'days': 1,
            }
            resp = requests.get(url, params=params, timeout=6)
            resp.raise_for_status()
            payload = resp.json()

            # Navigate to the day's forecast
            forecast_day = None
            if 'forecast' in payload and 'forecastday' in payload['forecast'] and len(payload['forecast']['forecastday']) > 0:
                forecast_day = payload['forecast']['forecastday'][0]

            current = payload.get('current') or {}

            summary = {
                'date': date_str,
                'condition': (forecast_day or {}).get('day', {}).get('condition', {}).get('text') or current.get('condition', {}).get('text', ''),
                'max_temp_c': (forecast_day or {}).get('day', {}).get('maxtemp_c'),
                'min_temp_c': (forecast_day or {}).get('day', {}).get('mintemp_c'),
                'max_wind_kph': (forecast_day or {}).get('day', {}).get('maxwind_kph') or current.get('wind_kph'),
                'chance_of_rain': (forecast_day or {}).get('day', {}).get('daily_chance_of_rain') or (forecast_day or {}).get('day', {}).get('daily_chance_of_rain', 0),
            }

            # Decide if warning is needed
            warn_reasons = []
            cond = (summary.get('condition') or '').lower()
            if 'storm' in cond or 'thunder' in cond or 'rain' in cond or 'snow' in cond or 'sleet' in cond:
                warn_reasons.append('Precipitation expected: ' + summary.get('condition', ''))
            try:
                if summary.get('chance_of_rain') is not None and int(summary.get('chance_of_rain') or 0) >= 50:
                    warn_reasons.append(f"High chance of rain ({summary.get('chance_of_rain')}%)")
            except Exception:
                pass
            try:
                if summary.get('max_wind_kph') is not None and float(summary.get('max_wind_kph') or 0) >= 60:
                    warn_reasons.append(f"Strong winds ({summary.get('max_wind_kph')} kph)")
            except Exception:
                pass

            return {
                'forecast': summary,
                'warning': len(warn_reasons) > 0,
                'warnings': warn_reasons,
            }
        except Exception:
            return None

    def create(self, request, *args, **kwargs):
        # Create the stop, then call weatherapi and include any warning in the response body
        trip_id = self.kwargs.get('trip_pk')
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(trip_id=trip_id)
        headers = self.get_success_headers(serializer.data)

        # Try to enrich with weather info for arrival_date
        lat = serializer.data.get('latitude')
        lon = serializer.data.get('longitude')
        arrival = serializer.data.get('arrival_date')
        weather_info = None
        if lat is not None and lon is not None and arrival:
            weather_info = self._fetch_weather_for(lat, lon, arrival)

        response_data = serializer.data
        if weather_info is not None:
            response_data['weather'] = weather_info

        return Response(response_data, status=status.HTTP_201_CREATED, headers=headers)


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


class PublicTripView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, share_token, *args, **kwargs):
        try:
            share = TripShare.objects.select_related('trip').get(share_token=share_token)
        except TripShare.DoesNotExist:
            return Response({'error': 'Shared trip not found'}, status=status.HTTP_404_NOT_FOUND)

        if not share.is_public:
            return Response({'error': 'This trip is not public'}, status=status.HTTP_403_FORBIDDEN)

        return Response(
            {
                'share_token': share.share_token,
                'trip': TripSerializer(share.trip).data,
                'created_at': share.created_at,
            },
            status=status.HTTP_200_OK,
        )
