"""
Unit and integration tests for Razorpay connectivity and the test-connection endpoint.
All external HTTP requests are strictly mocked.
"""

from typing import Any, Dict
from unittest.mock import AsyncMock, patch
import httpx
import pytest
from fastapi.testclient import TestClient

from app.core.exceptions import RazorpayAuthError, RazorpayConnectionError
from app.main import app
from app.services.razorpay_client import RazorpayClient


@pytest.fixture
def client() -> TestClient:
    return TestClient(app)


@pytest.mark.asyncio
async def test_razorpay_client_test_connection_success_mocked() -> None:
    """
    Verify test_connection returns connection status without exposing credentials.
    """
    client_instance = RazorpayClient(key_id="rzp_test_mock", key_secret="secret_mock")
    mock_payload = {
        "entity": "collection",
        "count": 1,
        "items": [
            {
                "id": "pay_TEST12345",
                "entity": "payment",
                "amount": 50000,
                "currency": "INR",
                "status": "captured",
                "method": "upi",
                "created_at": 1725150000,
            }
        ],
    }

    mock_response = httpx.Response(
        status_code=200,
        json=mock_payload,
        request=httpx.Request("GET", "https://api.razorpay.com/v1/payments"),
    )

    with patch("httpx.AsyncClient.get", new_callable=AsyncMock, return_value=mock_response):
        result = await client_instance.test_connection()
        assert result["connected"] is True
        assert result["status"] == "ok"
        assert result["sample_count"] == 1
        assert "secret_mock" not in str(result)


@pytest.mark.asyncio
async def test_razorpay_client_test_connection_auth_failure_mocked() -> None:
    """
    Verify test_connection raises RazorpayAuthError on HTTP 401.
    """
    client_instance = RazorpayClient(key_id="rzp_test_bad", key_secret="bad_secret")
    mock_response = httpx.Response(
        status_code=401,
        json={"error": {"code": "BAD_REQUEST_ERROR", "description": "Invalid key_id or key_secret"}},
        request=httpx.Request("GET", "https://api.razorpay.com/v1/payments"),
    )

    with patch("httpx.AsyncClient.get", new_callable=AsyncMock, return_value=mock_response):
        with pytest.raises(RazorpayAuthError) as exc_info:
            await client_instance.test_connection()
        assert exc_info.value.status_code == 401
        assert "bad_secret" not in str(exc_info.value)


@pytest.mark.asyncio
async def test_razorpay_client_test_connection_timeout_mocked() -> None:
    """
    Verify test_connection raises RazorpayConnectionError on timeout.
    """
    client_instance = RazorpayClient(key_id="rzp_test_mock", key_secret="secret_mock")

    with patch("httpx.AsyncClient.get", side_effect=httpx.TimeoutException("Read timed out")):
        with pytest.raises(RazorpayConnectionError) as exc_info:
            await client_instance.test_connection()
        assert exc_info.value.status_code == 504


def test_api_test_connection_endpoint_success_mocked(client: TestClient) -> None:
    """
    Verify GET /api/v1/data/razorpay/test-connection returns HTTP 200 with connection status.
    """
    mock_payload = {
        "entity": "collection",
        "count": 0,
        "items": [],
    }
    mock_response = httpx.Response(
        status_code=200,
        json=mock_payload,
        request=httpx.Request("GET", "https://api.razorpay.com/v1/payments"),
    )

    with patch("httpx.AsyncClient.get", new_callable=AsyncMock, return_value=mock_response):
        response = client.get("/api/v1/data/razorpay/test-connection")
        assert response.status_code == 200
        data = response.json()
        assert data["connected"] is True
        assert data["status"] == "ok"
        assert "message" in data


def test_api_test_connection_endpoint_auth_failure_mocked(client: TestClient) -> None:
    """
    Verify GET /api/v1/data/razorpay/test-connection returns HTTP 401 with safe error message when auth fails.
    """
    mock_response = httpx.Response(
        status_code=401,
        json={"error": {"code": "BAD_REQUEST_ERROR", "description": "Unauthorized"}},
        request=httpx.Request("GET", "https://api.razorpay.com/v1/payments"),
    )

    with patch("httpx.AsyncClient.get", new_callable=AsyncMock, return_value=mock_response):
        response = client.get("/api/v1/data/razorpay/test-connection")
        assert response.status_code == 401
        data = response.json()
        assert data["error"]["code"] == "RAZORPAY_AUTH_ERROR"
