from rest_framework import viewsets
from box.models import User, Folder, Attachment
from box.api_serializer import UserSerializer, FolderSerializer, AttachmentSerializer

# ViewSets define the view behavior.
class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer

class FolderViewSet(viewsets.ModelViewSet):
    queryset = Folder.objects.all()
    serializer_class = FolderSerializer

class AttachmentViewSet(viewsets.ModelViewSet):
    queryset = Attachment.objects.all()
    serializer_class = AttachmentSerializer

    @classmethod
    def get_extra_actions(cls):
        return []


