from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'trips', views.TripViewSet, basename='trip')
router.register(r'user-profile', views.UserProfileViewSet, basename='user-profile')

urlpatterns = [
    path('', include(router.urls)),
    path('trips/<uuid:trip_pk>/stops/', views.StopViewSet.as_view({'get': 'list', 'post': 'create'}), name='trip-stops'),
    path('trips/<uuid:trip_pk>/stops/<uuid:pk>/', views.StopViewSet.as_view({'get': 'retrieve', 'put': 'update', 'patch': 'partial_update', 'delete': 'destroy'}), name='trip-stop-detail'),
    path('trips/<uuid:trip_pk>/packing/', views.PackingItemViewSet.as_view({'get': 'list', 'post': 'create'}), name='trip-packing'),
    path('trips/<uuid:trip_pk>/packing/<uuid:pk>/', views.PackingItemViewSet.as_view({'get': 'retrieve', 'put': 'update', 'patch': 'partial_update', 'delete': 'destroy'}), name='trip-packing-detail'),
    path('trips/<uuid:trip_pk>/notes/', views.NoteViewSet.as_view({'get': 'list', 'post': 'create'}), name='trip-notes'),
    path('trips/<uuid:trip_pk>/notes/<uuid:pk>/', views.NoteViewSet.as_view({'get': 'retrieve', 'put': 'update', 'patch': 'partial_update', 'delete': 'destroy'}), name='trip-note-detail'),
    path('current-profile/', views.CurrentProfileView.as_view(), name='current-profile'),
    path('change-password/', views.ChangePasswordView.as_view(), name='change-password'),
    path('2fa/generate/', views.TwoFactorGenerateView.as_view(), name='2fa-generate'),
    path('2fa/verify/', views.TwoFactorVerifyView.as_view(), name='2fa-verify'),
    path('login/', views.UserLoginView.as_view(), name='login'),
    path('register/', views.UserRegistrationView.as_view(), name='register'),
    path('shared/<str:share_token>/', views.PublicTripView.as_view(), name='public-trip'),
    path('weather/forecast/', views.WeatherForecastView.as_view(), name='weather-forecast'),
]
