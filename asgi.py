import os

from django.core.asgi import get_asgi_application
from channels.auth import AuthMiddlewareStack
from channels.routing import ProtocolTypeRouter, URLRouter
import box.routing

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'setup.settings')

application = ProtocolTypeRouter({
    "http": get_asgi_application(),
    "websocket": #AuthMiddlewareStack( 
        URLRouter(
            box.routing.websocket_urlpatterns
        )
    #),
})

# AuthMiddlewareStack unused becouse we needs acess without login