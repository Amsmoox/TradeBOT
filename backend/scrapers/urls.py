from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .api import ForexSignalViewSet

# Create a router and register our viewsets
router = DefaultRouter()
router.register(r'forex-signals', ForexSignalViewSet, basename='forex-signals')

# URL patterns for the scrapers app
urlpatterns = [
    path('api/', include(router.urls)),
] 