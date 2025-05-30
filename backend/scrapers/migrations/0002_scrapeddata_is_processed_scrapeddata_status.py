# Generated by Django 4.2.20 on 2025-05-11 11:57

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('scrapers', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='scrapeddata',
            name='is_processed',
            field=models.BooleanField(default=False, help_text='Whether the data has been processed'),
        ),
        migrations.AddField(
            model_name='scrapeddata',
            name='status',
            field=models.CharField(choices=[('success', 'Success'), ('error', 'Error'), ('pending', 'Pending')], default='pending', help_text='Status of the scraping operation', max_length=10),
        ),
    ]
