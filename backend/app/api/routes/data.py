from typing import Optional
from fastapi import APIRouter, Depends, Query, status
from app.models.dataset import DatasetListResponse, DatasetSummaryResponse
from app.models.payment import (
    PaymentIngestionRequest,
    PaymentIngestionResponse,
    RazorpayConnectionTestResponse,
)
from app.services.dataset_reader import DatasetLoaderService
from app.services.ingestion import PaymentIngestionService
from app.services.razorpay_client import RazorpayClient

router = APIRouter(prefix="/data", tags=["Data Ingestion & Datasets"])


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


def get_dataset_loader_service() -> DatasetLoaderService:
    """
    Dependency provider for DatasetLoaderService.
    """
    return DatasetLoaderService()


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


@router.get(
    "/datasets",
    response_model=DatasetListResponse,
    status_code=status.HTTP_200_OK,
    summary="List Available Raw Datasets",
    description="Inspects data/raw/ and lists all available JSONL payment datasets with file health and record counts.",
)
def list_datasets(
    loader: DatasetLoaderService = Depends(get_dataset_loader_service),
) -> DatasetListResponse:
    """
    Lists stored raw datasets and their validation status.
    """
    datasets = loader.list_dataset_files()
    if not datasets:
        return DatasetListResponse(
            status="empty",
            message="No payment datasets are currently available.",
            total_datasets=0,
            datasets=[],
        )

    return DatasetListResponse(
        status="ok",
        message="Datasets retrieved successfully.",
        total_datasets=len(datasets),
        datasets=datasets,
    )


@router.get(
    "/datasets/summary",
    response_model=DatasetSummaryResponse,
    status_code=status.HTTP_200_OK,
    summary="Dataset Statistical Summary",
    description="Computes aggregate financial, method, and status metrics over raw payment datasets.",
)
def get_dataset_summary(
    filename: Optional[str] = Query(default=None, description="Optional specific JSONL filename to analyze"),
    loader: DatasetLoaderService = Depends(get_dataset_loader_service),
) -> DatasetSummaryResponse:
    """
    Generates summary statistics for a specific dataset or across all available datasets.
    """
    return loader.compute_summary(filename=filename)


@router.post(
    "/benchmark/load",
    response_model=DatasetListResponse,
    status_code=status.HTTP_200_OK,
    summary="Load Synthetic Benchmark Dataset",
    description="Generates and stores an aggregate synthetic benchmark dataset strictly tagged as SYNTHETIC_BENCHMARK_DATA for demonstration purposes.",
)
def load_benchmark_dataset(
    loader: DatasetLoaderService = Depends(get_dataset_loader_service),
) -> DatasetListResponse:
    """
    Seeds canonical synthetic benchmark payment records into data/raw/.
    """
    from app.services.benchmark_seeder import BenchmarkDatasetService
    seeder = BenchmarkDatasetService(loader=loader)
    seeder.seed_benchmark_file()
    datasets = loader.list_dataset_files()
    return DatasetListResponse(
        status="ok",
        message="Synthetic benchmark dataset seeded successfully.",
        total_datasets=len(datasets),
        datasets=datasets,
    )


@router.delete(
    "/benchmark/clear",
    response_model=DatasetListResponse,
    status_code=status.HTTP_200_OK,
    summary="Clear Synthetic Benchmark Dataset",
    description="Removes synthetic benchmark dataset from data/raw/ returning to honest empty state.",
)
def clear_benchmark_dataset(
    loader: DatasetLoaderService = Depends(get_dataset_loader_service),
) -> DatasetListResponse:
    """
    Clears synthetic benchmark file from data/raw/.
    """
    from app.services.benchmark_seeder import BenchmarkDatasetService
    seeder = BenchmarkDatasetService(loader=loader)
    seeder.clear_benchmark_file()
    datasets = loader.list_dataset_files()
    return DatasetListResponse(
        status="ok" if datasets else "empty",
        message="Synthetic benchmark dataset cleared." if not datasets else "Benchmark cleared; other datasets remain.",
        total_datasets=len(datasets),
        datasets=datasets,
    )

