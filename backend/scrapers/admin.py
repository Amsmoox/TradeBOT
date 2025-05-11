from django.contrib import admin
from .models import ScrapedData

@admin.register(ScrapedData)
class ScrapedDataAdmin(admin.ModelAdmin):
    list_display = ('source_url', 'scrape_date')
    search_fields = ('source_url', 'content_text')
    readonly_fields = ('scrape_date',)
    list_filter = ('scrape_date',)
