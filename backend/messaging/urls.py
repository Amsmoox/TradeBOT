# from django.urls import path
# from .views import send_demo_message
#
# urlpatterns = [
#     path("send/", send_demo_message),
# ]


from django.urls import path
from .views import send_telegram_alert

urlpatterns = [
    path('send-alert/', send_telegram_alert, name='send-alert'),
]
