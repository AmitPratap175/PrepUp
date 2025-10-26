from fastapi.testclient import TestClient
from auth_server.main import app
from auth_server.core.database import get_db
from .database import override_get_db, TestingSessionLocal
import pytest
from auth_server.models import User

app.dependency_overrides[get_db] = override_get_db

client = TestClient(app)

@pytest.fixture(scope="function")
def db_session():
    connection = TestingSessionLocal()
    yield connection
    connection.query(User).delete()
    connection.commit()
    connection.close()

def test_signup_and_login(db_session):
    # Test signup
    signup_response = client.post(
        "/api/auth/signup",
        json={"name": "Test User", "email": "test@example.com", "password": "password", "exam_type": "cat"},
    )
    assert signup_response.status_code == 200
    signup_data = signup_response.json()
    assert signup_data["email"] == "test@example.com"
    assert "id" in signup_data

    # Test login
    login_response = client.post(
        "/api/auth/login",
        json={"email": "test@example.com", "password": "password"},
    )
    assert login_response.status_code == 200
    login_data = login_response.json()
    assert "access_token" in login_data
    assert login_data["token_type"] == "bearer"
