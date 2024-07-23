import pyqrcode
import io
import base64
from rest_framework import viewsets
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.response import Response

from django.http import JsonResponse
from box.models import User, Folder, Attachment
from box.api_serializer import UserSerializer, FolderSerializer, AttachmentSerializer

# ViewSets define the view behavior.
class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer

    def get_queryset(self):
        return self.queryset.filter(id=self.request.user.pk)

class FolderViewSet(viewsets.ModelViewSet):
    queryset = Folder.objects.all()
    serializer_class = FolderSerializer

    def get_queryset(self):
        return self.queryset.filter(owner_id=self.request.user.pk)

    def list(self, request):
        # Only root Folders
        queryset = self.get_queryset().filter(parent__isnull=True)
        serializer = self.serializer_class(queryset, many=True)
        return Response(serializer.data)

class AttachmentViewSet(viewsets.ModelViewSet):
    queryset = Attachment.objects.all()
    serializer_class = AttachmentSerializer

    @classmethod
    def get_extra_actions(cls):
        return []


@api_view(["GET"])
@authentication_classes([])
@permission_classes([])
def qrcode_generate(request, uuid):
    """return a qrcode from a uuid."""
    qrcode: pyqrcode.QRCode = pyqrcode.create(uuid)
    image: io.BytesIO = io.BytesIO()
    qrcode.png(image, scale=6)
    encoded: str = base64.b64encode(image.getvalue()).decode("ascii")
    return JsonResponse({"qrcode": encoded}, safe=False)
