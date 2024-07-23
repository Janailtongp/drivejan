from rest_framework import routers
from django.urls import path, include
from box import api_view
from rest_framework.authtoken.views import obtain_auth_token

router = routers.DefaultRouter()
router.register(r'users', api_view.UserViewSet)
router.register(r'folders', api_view.FolderViewSet)
router.register(r'attachments', api_view.AttachmentViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path(r"api-token-auth/", obtain_auth_token, name="api_token_auth"),
    path(r"qrcode/<str:uuid>/", api_view.qrcode_generate, name="api_qrcode"),
]