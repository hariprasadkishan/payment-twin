"""
Comprehensive test suite for Razorpay Test Mode data ingestion, normalization, and error handling.
All external Razorpay HTTP requests are strictly mocked.
"""

import json
from pathlib import Path
from typing import Any, Dict
from unittest.mock import AsyncMock, patch

import httpx
import pytest
from fastapi.testclient import TestClient

from app.core.config import get_settings
from app.core.exceptions import (
    RazorpayAPIError,
    RazorpayAuthError,
    RazorpayConfigurationError,
    RazorpayConnectionError,
)
from app.main import app
from app.models.payment import NormalizedPaymentRecord, PaymentIngestionRequest, RazorpayPaymentItem
from app.services.ingestion import PaymentIngestionService
from app.services.razorpay_client import RazorpayClient


@pytest.fixture
def client() -> TestClient:
    return TestClient(app)


@pytest.fixture
def sample_razorpay_payment_raw() -> Dict[str, Any]:
    """
    Standard raw Razorpay payment entity fixture based on official API specifications.
    """
    return {
        "id": "pay_TEST1234567890",
        "entity": "payment",
        "amount": 250000,  # ₹2500.00 in paise
        "currency": "INR",
        "status": "captured",
        "order_id": "order_ORD987654321",
        "invoice_id": None,
        "international": False,
        "method": "upi",
        "amount_refunded": 0,
        "refund_status": None,
        "captured": True,
        "description": "Test order payment",
        "card_id": None,
        "bank": None,
        "wallet": None,
        "vpa": "customer_test@okhdfcbank",
        "email": "customer.secret@example.com",  # PII to be redacted
        "contact": "+919876543210",              # PII to be redacted
        "fee": 5000,                             # ₹50.00 fee in paise
        "tax": 900,                              # ₹9.00 tax in paise
        "error_code": None,
        "error_description": None,
        "error_source": None,
        "error_step": None,
        "error_reason": None,
        "acquirer_data": {
            "rrn": "123456789012",
            "upi_transaction_id": "UPI987654321",
        },
        "created_at": 1725150000,
    }


@pytest.fixture
def sample_failed_payment_raw() -> Dict[str, Any]:
    """
    Failed card transaction fixture with official Razorpay error diagnostics.
    """
    return {
        "id": "pay_FAIL123456789",
        "entity": "payment",
        "amount": 100000,
        "currency": "INR",
        "status": "failed",
        "order_id": "order_FAILORD123",
        "invoice_id": None,
        "international": False,
        "method": "card",
        "amount_refunded": 0,
        "refund_status": None,
        "captured": False,
        "description": "Failed card attempt",
        "card_id": "card_CRD123456",
        "bank": "HDFC",
        "wallet": None,
        "vpa": None,
        "email": "user@example.com",
        "contact": "+919999999999",
        "fee": None,
        "tax": None,
        "error_code": "BAD_REQUEST_ERROR",
        "error_description": "Payment processing failed because of incorrect OTP",
        "error_source": "customer",
        "error_step": "payment_authentication",
        "error_reason": "incorrect_otp",
        "acquirer_data": {"auth_code": "DECLINED_AUTH"},
        "created_at": 1725150500,
    }


def test_normalization_sanitizes_pii_and_calculates_inr(sample_razorpay_payment_raw: Dict[str, Any]) -> None:
    """
    Verify normalization redacts email and contact PII, extracts VPA provider handle, and converts amounts.
    """
    raw_item = RazorpayPaymentItem.model_validate(sample_razorpay_payment_raw)
    normalized = NormalizedPaymentRecord.from_raw(raw_item)

    assert normalized.payment_id == "pay_TEST1234567890"
    assert normalized.order_id == "order_ORD987654321"
    assert normalized.amount_paise == 250000
    assert normalized.amount_inr == 2500.00
    assert normalized.currency == "INR"
    assert normalized.status == "captured"
    assert normalized.method == "upi"
    assert normalized.vpa_provider == "okhdfcbank"
    assert normalized.fee_paise == 5000
    assert normalized.fee_inr == 50.00
    assert normalized.tax_paise == 900
    assert normalized.tax_inr == 9.00
    assert normalized.acquirer_rrn == "123456789012"
    assert not hasattr(normalized, "email")
    assert not hasattr(normalized, "contact")
    assert "customer.secret@example.com" not in normalized.model_dump_json()
    assert "+919876543210" not in normalized.model_dump_json()


def test_normalization_failed_card_payment(sample_failed_payment_raw: Dict[str, Any]) -> None:
    """
    Verify error diagnostics (source, step, reason) are accurately normalized.
    """
    raw_item = RazorpayPaymentItem.model_validate(sample_failed_payment_raw)
    normalized = NormalizedPaymentRecord.from_raw(raw_item)

    assert normalized.status == "failed"
    assert normalized.method == "card"
    assert normalized.bank == "HDFC"
    assert normalized.error_code == "BAD_REQUEST_ERROR"
    assert normalized.error_source == "customer"
    assert normalized.error_step == "payment_authentication"
    assert normalized.error_reason == "incorrect_otp"
    assert normalized.fee_inr is None


@pytest.mark.asyncio
async def test_razorpay_client_missing_credentials_raises_config_error() -> None:
    """
    Client should raise RazorpayConfigurationError when keys are missing.
    """
    client = RazorpayClient(key_id="", key_secret="")
    with pytest.raises(RazorpayConfigurationError) as exc_info:
        await client.fetch_payments()
    assert exc_info.value.code == "RAZORPAY_CONFIG_ERROR"
    assert exc_info.value.status_code == 503


@pytest.mark.asyncio
async def test_razorpay_client_auth_failure_raises_401() -> None:
    """
    Client should translate HTTP 401 to RazorpayAuthError without leaking secrets.
    """
    client = RazorpayClient(key_id="rzp_test_invalid", key_secret="super_secret_key_123")

    mock_response = httpx.Response(
        status_code=401,
        json={"error": {"code": "BAD_REQUEST_ERROR", "description": "Invalid Key"}},
        request=httpx.Request("GET", "https://api.razorpay.com/v1/payments"),
    )

    with patch("httpx.AsyncClient.get", new_callable=AsyncMock, return_value=mock_response):
        with pytest.raises(RazorpayAuthError) as exc_info:
            await client.fetch_payments_page()
        assert exc_info.value.status_code == 401
        assert "super_secret_key_123" not in str(exc_info.value)


@pytest.mark.asyncio
async def test_razorpay_client_500_api_error() -> None:
    """
    Client should translate upstream 500 error to RazorpayAPIError.
    """
    client = RazorpayClient(key_id="rzp_test_valid", key_secret="secret_valid")

    mock_response = httpx.Response(
        status_code=500,
        json={"error": {"code": "SERVER_ERROR", "description": "Internal server error at acquirer"}},
        request=httpx.Request("GET", "https://api.razorpay.com/v1/payments"),
    )

    with patch("httpx.AsyncClient.get", new_callable=AsyncMock, return_value=mock_response):
        with pytest.raises(RazorpayAPIError) as exc_info:
            await client.fetch_payments_page()
        assert exc_info.value.status_code == 500
        assert exc_info.value.code == "SERVER_ERROR"


@pytest.mark.asyncio
async def test_razorpay_client_connection_timeout() -> None:
    """
    Client should translate httpx.TimeoutException to RazorpayConnectionError.
    """
    client = RazorpayClient(key_id="rzp_test_valid", key_secret="secret_valid")

    with patch("httpx.AsyncClient.get", side_effect=httpx.TimeoutException("Connection timed out")):
        with pytest.raises(RazorpayConnectionError) as exc_info:
            await client.fetch_payments_page()
        assert exc_info.value.status_code == 504


@pytest.mark.asyncio
async def test_razorpay_client_pagination(sample_razorpay_payment_raw: Dict[str, Any]) -> None:
    """
    Verify client handles pagination across multiple pages cleanly.
    """
    client = RazorpayClient(key_id="rzp_test_valid", key_secret="secret_valid")

    page_1 = {
        "entity": "collection",
        "count": 2,
        "items": [
            {**sample_razorpay_payment_raw, "id": "pay_P1_1"},
            {**sample_razorpay_payment_raw, "id": "pay_P1_2"},
        ],
    }
    page_2 = {
        "entity": "collection",
        "count": 1,
        "items": [
            {**sample_razorpay_payment_raw, "id": "pay_P2_1"},
        ],
    }

    mock_responses = [
        httpx.Response(status_code=200, json=page_1, request=httpx.Request("GET", "https://api.razorpay.com/v1/payments")),
        httpx.Response(status_code=200, json=page_2, request=httpx.Request("GET", "https://api.razorpay.com/v1/payments")),
    ]

    with patch("httpx.AsyncClient.get", new_callable=AsyncMock, side_effect=mock_responses):
        items = await client.fetch_payments(count=2, max_pages=3)
        assert len(items) == 3
        assert items[0].id == "pay_P1_1"
        assert items[1].id == "pay_P1_2"
        assert items[2].id == "pay_P2_1"


@pytest.mark.asyncio
async def test_ingest_payments_success(
    sample_razorpay_payment_raw: Dict[str, Any],
    sample_failed_payment_raw: Dict[str, Any],
    tmp_path: Path,
) -> None:
    """
    Verify complete ingestion workflow: fetching, normalizing, saving to disk, and building summaries.
    """
    mock_collection_data = {
        "entity": "collection",
        "count": 2,
        "items": [sample_razorpay_payment_raw, sample_failed_payment_raw],
    }

    mock_client = RazorpayClient(key_id="rzp_test_mock", key_secret="secret_mock")
    mock_response = httpx.Response(
        status_code=200,
        json=mock_collection_data,
        request=httpx.Request("GET", "https://api.razorpay.com/v1/payments"),
    )

    with patch("httpx.AsyncClient.get", new_callable=AsyncMock, return_value=mock_response):
        service = PaymentIngestionService(client=mock_client, raw_data_dir=str(tmp_path))

        response = await service.ingest_payments(PaymentIngestionRequest(count=10, save_to_disk=True))

        assert response.status == "success"
        assert response.records_fetched == 2
        assert response.records_saved == 2
        assert response.methods_breakdown == {"upi": 1, "card": 1}
        assert response.status_breakdown == {"captured": 1, "failed": 1}
        assert response.file_path is not None
        assert Path(response.file_path).exists()

        # Verify persisted JSONL contents
        with open(response.file_path, "r", encoding="utf-8") as f:
            lines = [json.loads(line) for line in f]
            assert len(lines) == 2
            assert lines[0]["payment_id"] == "pay_TEST1234567890"
            assert lines[1]["payment_id"] == "pay_FAIL123456789"


def test_api_ingest_endpoint_mocked(
    client: TestClient,
    sample_razorpay_payment_raw: Dict[str, Any],
) -> None:
    """
    Test POST /api/v1/data/payments/ingest through FastAPI test client.
    """
    mock_collection_data = {
        "entity": "collection",
        "count": 1,
        "items": [sample_razorpay_payment_raw],
    }

    mock_response = httpx.Response(
        status_code=200,
        json=mock_collection_data,
        request=httpx.Request("GET", "https://api.razorpay.com/v1/payments"),
    )

    with patch("httpx.AsyncClient.get", new_callable=AsyncMock, return_value=mock_response), \
         patch.object(get_settings(), "RAZORPAY_KEY_ID", "rzp_test_dummy"), \
         patch.object(get_settings(), "RAZORPAY_KEY_SECRET", "rzp_secret_dummy"):
        
        response = client.post("/api/v1/data/payments/ingest", json={"count": 50, "save_to_disk": False})

        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "success"
        assert data["records_fetched"] == 1
        assert data["records_saved"] == 1
        assert data["methods_breakdown"] == {"upi": 1}
