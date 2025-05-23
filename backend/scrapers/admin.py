from django.contrib import admin
from django.utils.html import format_html
from .models import ScrapedData, EconomicEvent

@admin.register(ScrapedData)
class ScrapedDataAdmin(admin.ModelAdmin):
    list_display = ('signal_display', 'instrument', 'action', 'entry_price', 'take_profit', 'stop_loss', 'status_signal', 'scrape_date')
    search_fields = ('instrument', 'action', 'content_text')
    readonly_fields = ('scrape_date', 'content_html_display')
    list_filter = ('scrape_date', 'action', 'status_signal', 'instrument')
    fieldsets = (
        ('Signal Details', {
            'fields': ('instrument', 'action', 'entry_price', 'take_profit', 'stop_loss', 'status_signal')
        }),
        ('Metadata', {
            'fields': ('scrape_date', 'source_url', 'status', 'is_processed')
        }),
        ('Content', {
            'fields': ('content_text', 'content_html_display')
        }),
    )
    
    def content_html_display(self, obj):
        """Display HTML content in a formatted way in the admin"""
        if not obj.content_html:
            return "No HTML content"
        return format_html('<div style="max-height: 300px; overflow-y: auto;">{}</div>', obj.content_html)
    content_html_display.short_description = "HTML Content"
    
    def signal_display(self, obj):
        """Render signal with colored indicators"""
        if obj.action.lower() == 'buy':
            action_color = 'green'
            emoji = '🟢'
        elif obj.action.lower() == 'sell':
            action_color = 'red'
            emoji = '🔴'
        else:
            action_color = 'gray'
            emoji = '⚪'
            
        status_emoji = '⚡' if obj.status_signal.lower() == 'active' else '⏳'
        
        return format_html(
            '{} {} <strong style="color: {};">{}</strong> {}', 
            emoji, status_emoji, action_color, obj.action, obj.instrument
        )
    signal_display.short_description = "Signal"

@admin.register(EconomicEvent)
class EconomicEventAdmin(admin.ModelAdmin):
    list_display = ('day', 'time', 'currency', 'event_name', 'impact', 'actual', 'forecast')
    search_fields = ('day', 'time', 'currency', 'event_name', 'impact', 'actual', 'forecast')
    list_filter = ('day', 'time', 'currency', 'impact')

