from django.contrib.auth.models import BaseUserManager

class CustomUserManager(BaseUserManager):
    """
    Custom manager for the User model.

    This manager uses the email address as the unique identifier for
    authentication, replacing the standard username field. It provides
    methods to create standard users and superusers.
    """
    def create_user(self, email, password, **extra_fields):
        """
        Creates and saves a new User.

        Args:
            email (str): The user's email address.
            password (str): The user's chosen password.
            **extra_fields: Additional fields for the user model.

        Returns:
            The newly created user object.

        Raises:
            ValueError: If the email field is not provided.
        """
        if not email:
            raise ValueError('The Email must be set')
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save()
        return user

    def create_superuser(self, email, password, **extra_fields):
        """
        Creates and saves a new Superuser.

        This method sets the 'is_staff', 'is_superuser', and 'is_active'
        fields to True by default.

        Args:
            email (str): The superuser's email address.
            password (str): The superuser's chosen password.
            **extra_fields: Additional fields for the user model.

        Returns:
            The newly created superuser object.

        Raises:
            ValueError: If 'is_staff' or 'is_superuser' is not True.
        """
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('is_active', True)

        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser must have is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser must have is_superuser=True.')
        return self.create_user(email, password, **extra_fields)
