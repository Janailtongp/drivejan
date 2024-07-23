from box.models import User, Folder, Attachment
from rest_framework import serializers

# Serializers define the API representation.
class UserSerializer(serializers.HyperlinkedModelSerializer):
    class Meta:
        model = User
        fields = ['pk', 'name', 'url', 'username', 'email', 'is_staff', 'gravatar_url']

class FolderSerializer(serializers.HyperlinkedModelSerializer):
    created_at = serializers.DateTimeField(format="%d/%m/%Y as %H:%M", read_only=True)
    owner_id = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(),
        write_only=True,
        source="owner",
    )
    parent_id = serializers.PrimaryKeyRelatedField(
        queryset=Folder.objects.all(),
        write_only=True,
        allow_null=True,
        source="parent",
    )


    class Meta:
        model = Folder
        fields = [
            "pk",
            "name",
            "full_path",
            "get_items",
            "created_at",
            "owner_id",
            "parent_id",
            "get_amount",
        ]

class AttachmentSerializer(serializers.HyperlinkedModelSerializer):
    created_at = serializers.DateTimeField(format="%d/%m/%Y as %H:%M", read_only=True)
    folder_id = serializers.PrimaryKeyRelatedField(
        queryset=Folder.objects.all(),
        write_only=True,
        allow_null=True,
        source="folder",
    )
    class Meta:
        model = Attachment
        fields = [
            "pk",
            "file",
            "local_file",
            "folder_id",
            "created_at",
            "get_size",
        ]