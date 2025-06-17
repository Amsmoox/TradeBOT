from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .api import ForexSignalViewSet, manual_delta_scrape, watermark_info

# Create a router and register our viewsets
router = DefaultRouter()
router.register(r'forex-signals', ForexSignalViewSet, basename='forex-signals')

# URL patterns for the scrapers app
urlpatterns = [
    path('api/', include(router.urls)),
    # Standalone API endpoints for delta-scraping
    path('api/delta-scrape/', manual_delta_scrape, name='manual-delta-scrape'),
    path('api/watermark-info/', watermark_info, name='watermark-info'),
] 