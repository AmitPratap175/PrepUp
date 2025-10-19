from django.apps import AppConfig


class ApiConfig(AppConfig):
    """
    Configuration for the 'api' Django app.

    This class sets the configuration for the 'api' app, including the
    default auto field for models and the app name.
    """
    default_auto_field = "django.db.models.BigAutoField"
    name = "auth_server.api"
