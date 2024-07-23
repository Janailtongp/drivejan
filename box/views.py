import uuid
from django.shortcuts import render
from box.models import Folder
# Create your views here.


def home_page(request):
    return render(request, 'home.html', {
        'ws_address': f'{uuid.uuid4()}'
    })
