import uuid
from django.contrib.auth.models import AbstractUser
from django.db import models

from .managers import CustomUserManager


class User(AbstractUser):
    """
    Custom user model that uses email as the primary identifier.

    This model extends Django's AbstractUser but replaces the username field
    with an email field for authentication. It includes additional fields
    relevant to the educational platform's features.

    Attributes:
        id (UUIDField): The primary key for the user.
        name (CharField): The user's full name.
        email (EmailField): The user's unique email address, used for login.
        exam_type (CharField): The exam the user is preparing for (e.g., "cat").
        is_trial_user (BooleanField): True if the user is on a trial period.
        current_streak (IntegerField): The user's daily activity streak.
        total_score (IntegerField): The user's aggregate score.
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
        Returns the email address as the string representation of the user.

        Returns:
            str: The user's email address.
        """
        return self.email

class Bookmark(models.Model):
    """
    Represents a user's bookmark of a specific quiz question.

    This model creates a relationship between a user and a question,
    allowing users to save questions for later review. A unique constraint
    ensures that a user cannot bookmark the same question multiple times.

    Attributes:
        id (UUIDField): The primary key for the bookmark.
        user (ForeignKey): A reference to the User who created the bookmark.
        subject (CharField): The subject of the bookmarked question.
        question_id (CharField): The unique identifier of the bookmarked question.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    subject = models.CharField(max_length=255)
    question_id = models.CharField(max_length=255)

    class Meta:
        unique_together = ('user', 'subject', 'question_id')

    def __str__(self):
        """
        Returns a string representation of the bookmark.

        Returns:
            str: A string identifying the user and the bookmarked question.
        """
        return f'{self.user.email} - {self.subject} - {self.question_id}'
