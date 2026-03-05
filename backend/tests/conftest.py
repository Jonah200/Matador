import pytest
from fastapi.testclient import TestClient

from app.main import app

@pytest.fixture(scope="module")
def test_app():
    return app

@pytest.fixture(scope="module")
def client():
    with TestClient(app) as c:
        yield c