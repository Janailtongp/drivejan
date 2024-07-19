import os
import uuid
from django.db import models
from django.db.models.signals import post_save
from django.contrib.auth.models import (
    AbstractBaseUser,
    PermissionsMixin,
    UserManager,
)
from django.conf import settings
from django.core import validators
from django.core.exceptions import ValidationError
from django.core.files.storage import FileSystemStorage

from mptt.fields import TreeForeignKey
from mptt.models import MPTTModel
from typing import Optional
# Create your models here.

from django.dispatch import receiver
from rest_framework.authtoken.models import Token

class User(AbstractBaseUser, PermissionsMixin):
    class Meta:
        db_table = "auth_user"
        ordering = ("name",)

    email = models.EmailField(unique=True)
    name = models.CharField(max_length=255)
    username = models.CharField(
        max_length=50,
        unique=True,
        help_text=(
            "Required. 50 characters or fewer. Letters, digits and @/./+/-/_ only."
        ),
        validators=[
            validators.RegexValidator(
                r"^[\w.@+-]+$",
                (
                    "Enter a valid username. "
                    "This value may contain only letters, numbers "
                    "and @/./+/-/_ characters."
                ),
                "invalid",
            )
        ],
        error_messages={
            "unique": ("A user with that username already exists.")
        },
    )

    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    USERNAME_FIELD = "username"
    objects = UserManager()

    def __str__(self) -> str:
        return self.email

@receiver(post_save, sender=settings.AUTH_USER_MODEL)
def create_auth_token(sender, instance=None, created=False, **kwargs):
    if created:
        Token.objects.create(user=instance)

class PerfilManager(models.Manager):
    def get_by_natural_key(self, name):
        return self.get(name=name)

class Folder(MPTTModel):
    owner = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    parent = TreeForeignKey(
        "self",
        null=True,
        blank=True,
        related_name="children",
        on_delete=models.CASCADE,
    )
    name = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)

    # NOTE: in the future shared_with field: 

    class Meta:
        unique_together = ("parent", "name")

    class MPTTMeta:
        order_insertion_by = ["name"]

    def __str__(self) -> str:
        return self.name

    def unicode_with_level(self, level_char="--"):
        return f"{self.level * level_char} {str(self)}"

    @staticmethod
    def get_root_folders():
        return Folder.objects.filter(parent__isnull=True)

    def validate_unique(self, *args, **kwargs):
        # https://stackoverflow.com/a/33308014 - handling unique together with
        # null foreign key problem
        if (not self.parent) and not (self.pk):
            already_exists: bool = Folder.objects.filter(
                name=self.name, parent__isnull=True
            ).exists()
            if already_exists:
                raise ValidationError(f"Duplicated folder {self.name}")
            
        return super(Folder, self).validate_unique(*args, **kwargs)

    def clean(self):
        if self.parent == self:
            raise ValidationError("A folder cannot be insert in herself")
        return super(Folder, self).clean()

    def save(self, *args, **kwargs):
        self.full_clean()
        return super(Folder, self).save(*args, **kwargs)


def attachment_unic_path(instance, filename):
    """Função usada no upload_to do Anexo para calcular um nome único."""
    filename, file_extension = os.path.splitext(filename)
    filename = "{}_{}{}".format(filename, uuid.uuid4(), file_extension)
    return os.path.join("attachments/", filename)


class Attachment(models.Model):
    file = models.FileField(
        upload_to=attachment_unic_path, max_length=300, blank=True
    )
    local_file = models.FileField(
        storage=FileSystemStorage(),
        blank=True,
        upload_to="devta/",
        max_length=1024,
    )
    folder = models.OneToOneField(Folder, on_delete=models.CASCADE)

    class Meta:
        ordering = ("file",)

    def get_filename_elipsys(self):
        name: str = self.get_realy_filename()
        if len(name) <= 50:
            return name
        return name[:50] + "..."

    def get_realy_filename(self) -> str:
        """Return the name witout UUID4."""
        name: str = ""
        if self.file:
            name = self.file.name
        if not name and self.local_file:
            name = self.local_file.name
        name = "_".join(os.path.basename(name).split("_")[:-1])
        return name.encode("utf-8")

    def get_ext(self) -> Optional[str]:
        name: Optional[str] = self.file.name
        if not name and self.local_file:
            name = self.local_file.name
        splitted = os.path.splitext(name)
        if len(splitted) == 2 and splitted[1]:
            return splitted[1]
        return None

    def get_file_object(self):
        if self.file.name:
            return self.file
        return self.local_file

    def get_raw_filename(self) -> str:
        """Returns the name of the file with the UUID4."""
        name: Optional[str] = self.file.name
        if not name and self.local_file:
            name = self.local_file.name
        return os.path.splitext(name)[0]

    def get_url(self) -> str:
        url: str = ""
        if self.file:
            url = self.file.url
        elif self.local_file:
            url = self.local_file.url
        return url

    def __str__(self) -> str:
        return "Attachment: {}".format(self.get_realy_filename())

