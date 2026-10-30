import pytest
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_app_imports_cleanly():
    assert app is not None
    assert app.title == "NeuroNudge Backend"


def test_health_endpoint_contract():
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_openapi_docs_accessible():
    response = client.get("/docs")
    assert response.status_code == 200
    assert "swagger-ui" in response.text.lower() or "html" in response.headers.get("content-type", "")


@pytest.mark.parametrize(
    "origin",
    [
        "http://localhost:8080",
        "http://localhost:5173",
    ],
)
def test_cors_headers(origin: str):
    headers = {
        "Origin": origin,
        "Access-Control-Request-Method": "GET",
    }
    response = client.options("/api/health", headers=headers)
    assert response.status_code == 200
    assert response.headers.get("access-control-allow-origin") == origin
