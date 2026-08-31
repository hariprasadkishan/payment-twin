"""
Unit and integration tests for the /health endpoint and API documentation.
"""

import pytest
from fastapi.testclient import TestClient
from app.main import app


@pytest.fixture
def client() -> TestClient:
    """
    TestClient fixture for FastAPI application.
    """
    return TestClient(app)


def test_root_health_endpoint(client: TestClient) -> None:
    """
    Verify GET /health returns HTTP 200 and {'status': 'ok'}.
    """
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_api_v1_health_endpoint(client: TestClient) -> None:
    """
    Verify GET /api/v1/health returns HTTP 200 and {'status': 'ok'}.
    """
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_swagger_docs_available(client: TestClient) -> None:
    """
    Verify Swagger UI documentation is accessible at /docs.
    """
    response = client.get("/docs")
    assert response.status_code == 200
    assert "swagger-ui" in response.text.lower() or "html" in response.headers.get("content-type", "")


def test_openapi_schema_available(client: TestClient) -> None:
    """
    Verify OpenAPI schema JSON is valid and accessible at /openapi.json.
    """
    response = client.get("/openapi.json")
    assert response.status_code == 200
    schema = response.json()
    assert schema["info"]["title"] == "Payment Twin API"
    assert "/health" in schema["paths"]
