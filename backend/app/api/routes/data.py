"""
Data ingestion API endpoints.
"""

from fastapi import APIRouter, Depends, status
from app.models.payment import (
    PaymentIngestionRequest,
    PaymentIngestionResponse,
    RazorpayConnectionTestResponse,
)
from app.services.ingestion import PaymentIngestionService
from app.services.razorpay_client import RazorpayClient

router = APIRouter(prefix="/data", tags=["Data Ingestion"])


def get_ingestion_service() -> PaymentIngestionService:
    """
    Dependency provider for PaymentIngestionService.
    """
    return PaymentIngestionService()


def get_razorpay_client() -> RazorpayClient:
    """
    Dependency provider for RazorpayClient.
    """
    return RazorpayClient()


@router.get(
    "/razorpay/test-connection",
    response_model=RazorpayConnectionTestResponse,
    status_code=status.HTTP_200_OK,
    summary="Verify Razorpay API Connectivity",
    description="Makes an authenticated read-only request to Razorpay Test Mode to verify credentials and connectivity.",
)
async def test_razorpay_connection(
    client: RazorpayClient = Depends(get_razorpay_client),
) -> RazorpayConnectionTestResponse:
    """
    Verifies Razorpay API authentication without exposing secrets.
    """
    result = await client.test_connection()
    return RazorpayConnectionTestResponse(**result)


@router.post(
    "/payments/ingest",
    response_model=PaymentIngestionResponse,
    status_code=status.HTTP_200_OK,
    summary="Ingest Razorpay Test Payments",
    description=(
        "Retrieves payments from the configured Razorpay Test Mode account, "
        "normalizes and sanitizes the records, and saves the dataset under data/raw/."
    ),
)
async def ingest_payments(
    request: PaymentIngestionRequest = PaymentIngestionRequest(),
    service: PaymentIngestionService = Depends(get_ingestion_service),
) -> PaymentIngestionResponse:
    """
    Triggers payment data ingestion and normalization.
    """
    return await service.ingest_payments(request)
