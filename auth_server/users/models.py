import uuid
from django.contrib.auth.models import AbstractUser
from django.db import models

from .managers import CustomUserManager


class User(AbstractUser):
    """
    Custom user model that extends Django's AbstractUser.

    This model is designed to be compatible with the user schema defined in the
    shared/schema.ts file of the project.

    Fields:
        id (UUIDField): The primary key for the user.
        name (CharField): The user's full name.
        email (EmailField): The user's email address, used for login.
        exam_type (CharField): The type of exam the user is preparing for (e.g., "cat", "gate").
        is_trial_user (BooleanField): Flag to indicate if the user is on a trial plan.
        current_streak (IntegerField): The user's current streak in days.
        total_score (IntegerField): The user's total score.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    email = models.EmailField(unique=True)
    exam_type = models.CharField(max_length=50)
    is_trial_user = models.BooleanField(default=True)
    current_streak = models.IntegerField(default=0)
    total_score = models.IntegerField(default=0)
    username = None

    objects = CustomUserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = []

    def __str__(self):
        """
        String representation of the User object.
        """
        return self.email
