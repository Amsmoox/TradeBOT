from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import send_telegram_alert, fetch_and_send_signals, OutputDestinationViewSet, CredentialTestResultViewSet

# Create a router and register our viewsets
router = DefaultRouter()
router.register(r'output-destinations', OutputDestinationViewSet, basename='output-destinations')
router.register(r'test-results', CredentialTestResultViewSet, basename='test-results')

urlpatterns = [
    path('send-alert/', send_telegram_alert, name='send-alert'),
    path('send-signals/', fetch_and_send_signals, name='send-signals'),
    path('', include(router.urls)),  # Add the credential management APIs
]
