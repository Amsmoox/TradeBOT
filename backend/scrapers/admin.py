from django.contrib import admin
from django.utils.html import format_html
from .models import ScrapedData, ScrapingWatermark, EconomicEvent, ScraperCredentials

@admin.register(ScrapedData)
class ScrapedDataAdmin(admin.ModelAdmin):
    list_display = ('instrument', 'action', 'entry_price', 'status_signal', 'scrape_date', 'source_url')
    list_filter = ('status_signal', 'action', 'scrape_date', 'is_processed')
    search_fields = ('instrument', 'content_text', 'source_url')
    readonly_fields = ('scrape_date', 'signal_hash')
    ordering = ('-scrape_date',)
    
    fieldsets = (
        ('Signal Information', {
            'fields': ('instrument', 'action', 'entry_price', 'take_profit', 'stop_loss', 'status_signal')
        }),
        ('Content', {
            'fields': ('content_html', 'content_text', 'source_url')
        }),
        ('Metadata', {
            'fields': ('scrape_date', 'status', 'is_processed', 'signal_hash', 'missing_count'),
            'classes': ('collapse',)
        }),
    )

@admin.register(ScrapingWatermark)
class ScrapingWatermarkAdmin(admin.ModelAdmin):
    list_display = ('source', 'last_timestamp', 'consecutive_no_changes', 'scrape_interval')
    list_filter = ('source', 'last_timestamp')
    readonly_fields = ('last_timestamp', 'last_modified')
    ordering = ('-last_timestamp',)

@admin.register(EconomicEvent)
class EconomicEventAdmin(admin.ModelAdmin):
    list_display = ('event_name', 'currency', 'impact', 'day', 'time', 'scheduled_time')
    list_filter = ('currency', 'impact', 'day', 'scheduled_time')
    search_fields = ('event_name', 'currency')
    ordering = ('scheduled_time',)

@admin.register(ScraperCredentials)
class ScraperCredentialsAdmin(admin.ModelAdmin):
    list_display = ('scraper_name', 'username', 'login_url', 'is_active', 'updated_at')
    list_filter = ('scraper_name', 'is_active', 'created_at', 'updated_at')
    search_fields = ('scraper_name', 'username', 'login_url')
    readonly_fields = ('created_at', 'updated_at')
    ordering = ('scraper_name',)
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('scraper_name', 'is_active')
        }),
        ('Authentication', {
            'fields': ('username', 'password', 'api_key'),
            'classes': ('collapse',)
        }),
        ('URLs', {
            'fields': ('login_url', 'signals_url')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def get_readonly_fields(self, request, obj=None):
        if obj:  # Editing an existing object
            return self.readonly_fields + ('scraper_name',)
        return self.readonly_fields

