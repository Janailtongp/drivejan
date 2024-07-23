from box.models import User, Folder, Attachment
from rest_framework import serializers

# Serializers define the API representation.
class UserSerializer(serializers.HyperlinkedModelSerializer):
    class Meta:
        model = User
        fields = ['pk', 'name', 'url', 'username', 'email', 'is_staff', 'gravatar_url']

class FolderSerializer(serializers.HyperlinkedModelSerializer):
    created_at = serializers.DateTimeField(format="%d/%m/%Y as %H:%M")
    class Meta:
        model = Folder
        fields = [
            "pk",
            "name",
            "full_path",
            "get_items",
            "created_at",
        ]

class AttachmentSerializer(serializers.HyperlinkedModelSerializer):
    class Meta:
        model = Attachment
        fields = "__all__"