from django.contrib import admin
from django.urls import include, path, re_path
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api-auth/', include('rest_framework.urls'))
]
if "box" in settings.INSTALLED_APPS:
    urlpatterns.append(re_path(r"^api/box/", include("box.api_urls")))
    urlpatterns.append(re_path(r"", include("box.urls")))


if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)