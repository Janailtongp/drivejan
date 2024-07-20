from django.shortcuts import render
from box.models import Folder
# Create your views here.


def home_page(request):
    folders = Folder.objects.all()
    return render(request, 'home.html', {
        'folders': folders,
        'user': request.user,
        'token_auth': request.user.get_api_token(),
    })