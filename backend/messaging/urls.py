# from django.urls import path
# from .views import send_demo_message
#
# urlpatterns = [
#     path("send/", send_demo_message),
# ]

from django.urls import path
from .views import send_telegram_alert, fetch_and_send_signals

urlpatterns = [
    path('send-alert/', send_telegram_alert, name='send-alert'),
    path('send-signals/', fetch_and_send_signals, name='send-signals'),  # 🆕
]
