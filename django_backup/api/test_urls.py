from django.urls import path, re_path
from .tests_token_decorator import dummy_view

urlpatterns = [
    re_path(r'^dummy-url/$', dummy_view),
]