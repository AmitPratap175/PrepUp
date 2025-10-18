import pytest
from unittest.mock import patch, MagicMock

@pytest.fixture(autouse=True)
def mock_google_auth():
    with patch('google.auth.default', return_value=(MagicMock(), 'test-project')) as mock:
        yield mock