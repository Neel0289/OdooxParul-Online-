from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'trips', views.TripViewSet, basename='trip')
router.register(r'user-profile', views.UserProfileViewSet, basename='user-profile')

urlpatterns = [
    path('', include(router.urls)),
    path('register/', views.UserRegistrationView.as_view(), name='register'),
    path('shared/<str:share_token>/', views.PublicTripView.as_view(), name='public-trip'),
]
