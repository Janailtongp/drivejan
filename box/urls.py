from django.urls import path
from box.views import home_page

urlpatterns = [
    path('', home_page)
]
