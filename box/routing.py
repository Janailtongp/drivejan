from django.urls import re_path
from box.consumers import TokenAutenticateConsumer

websocket_urlpatterns = [
    re_path(r'ws/box/(?P<uuid>[0-9a-f-]+)/$', TokenAutenticateConsumer.as_asgi()),
]
