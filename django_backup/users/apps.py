from django.apps import AppConfig


class UsersConfig(AppConfig):
    """
    Configuration for the 'users' Django app.

    This class sets the configuration for the 'users' app, including the
    default auto field for models and the app name.
    """
    default_auto_field = "django.db.models.BigAutoField"
    name = "users"
