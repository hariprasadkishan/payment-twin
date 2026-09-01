"""
Comprehensive test suite for DatasetLoaderService, JSONL validation, summary metrics, and API endpoints.
Tests use temporary directories and fixtures without calling external APIs.
"""

import json
from pathlib import Path
from typing import Any, Dict, List
import pandas as pd
import pytest
from fastapi.testclient import TestClient

from app.core.exceptions import ResourceNotFoundError
from app.main import app
from app.models.dataset import DatasetListResponse, DatasetSummaryResponse
from app.models.payment import NormalizedPaymentRecord
from app.services.dataset_reader import DatasetLoaderService


@pytest.fixture
def client() -> TestClient:
    return TestClient(app)


@pytest.fixture
def sample_valid_records() -> List[Dict[str, Any]]:
    """
    List of verified NormalizedPaymentRecord dictionaries.
    """
    return [
        {
            "payment_id": "pay_REC001",
            "order_id": "order_ORD001",
            "amount_paise": 100000,
            "amount_inr": 1000.0,
            "currency": "INR",
            "status": "captured",
            "method": "upi",
            "bank": None,
            "wallet": None,
            "vpa_provider": "okaxis",
            "international": False,
            "captured": True,
            "fee_paise": 2000,
            "tax_paise": 360,
            "fee_inr": 20.0,
            "tax_inr": 3.6,
            "error_code": None,
            "error_description": None,
            "error_source": None,
            "error_step": None,
            "error_reason": None,
            "acquirer_rrn": "RRN001",
            "acquirer_auth_code": "AUTH001",
            "created_at_unix": 1725150000,
            "created_at_iso": "2026-09-01T00:00:00+00:00",
        },
        {
            "payment_id": "pay_REC002",
            "order_id": "order_ORD002",
            "amount_paise": 300000,
            "amount_inr": 3000.0,
            "currency": "INR",
            "status": "captured",
            "method": "card",
            "bank": "HDFC",
            "wallet": None,
            "vpa_provider": None,
            "international": False,
            "captured": True,
            "fee_paise": 6000,
            "tax_paise": 1080,
            "fee_inr": 60.0,
            "tax_inr": 10.8,
            "error_code": None,
            "error_description": None,
            "error_source": None,
            "error_step": None,
            "error_reason": None,
            "acquirer_rrn": "RRN002",
            "acquirer_auth_code": "AUTH002",
            "created_at_unix": 1725150100,
            "created_at_iso": "2026-09-01T00:01:40+00:00",
        },
        {
            "payment_id": "pay_REC003",
            "order_id": "order_ORD003",
            "amount_paise": 200000,
            "amount_inr": 2000.0,
            "currency": "INR",
            "status": "failed",
            "method": "netbanking",
            "bank": "SBIN",
            "wallet": None,
            "vpa_provider": None,
            "international": False,
            "captured": False,
            "fee_paise": None,
            "tax_paise": None,
            "fee_inr": None,
            "tax_inr": None,
            "error_code": "BAD_REQUEST_ERROR",
            "error_description": "User cancelled on bank portal",
            "error_source": "customer",
            "error_step": "payment_authorization",
            "error_reason": "payment_cancelled",
            "acquirer_rrn": None,
            "acquirer_auth_code": None,
            "created_at_unix": 1725150200,
            "created_at_iso": "2026-09-01T00:03:20+00:00",
        },
    ]


def test_empty_raw_directory_returns_empty_summary(tmp_path: Path) -> None:
    """
    When data/raw is empty, service should return a graceful 'empty' status response.
    """
    loader = DatasetLoaderService(raw_data_dir=str(tmp_path))
    files = loader.list_dataset_files()
    assert len(files) == 0

    summary = loader.compute_summary()
    assert summary.status == "empty"
    assert summary.total_records == 0
    assert "No payment datasets" in summary.message


def test_load_valid_jsonl_dataset(tmp_path: Path, sample_valid_records: List[Dict[str, Any]]) -> None:
    """
    Verify clean JSONL file loading and record validation.
    """
    file_path = tmp_path / "payments_20260901_test.jsonl"
    with open(file_path, "w", encoding="utf-8") as f:
        for rec in sample_valid_records:
            f.write(json.dumps(rec) + "\n")

    loader = DatasetLoaderService(raw_data_dir=str(tmp_path))
    records, errors = loader.load_records_from_file(file_path.name)

    assert len(records) == 3
    assert len(errors) == 0
    assert records[0].payment_id == "pay_REC001"
    assert records[1].amount_inr == 3000.0
    assert records[2].status == "failed"


def test_detect_malformed_json_and_schema_errors(
    tmp_path: Path, sample_valid_records: List[Dict[str, Any]]
) -> None:
    """
    Verify that malformed JSON lines and schema violations are captured as validation errors
    without failing or discarding valid records.
    """
    file_path = tmp_path / "payments_corrupted.jsonl"
    with open(file_path, "w", encoding="utf-8") as f:
        # Line 1: Valid record
        f.write(json.dumps(sample_valid_records[0]) + "\n")
        # Line 2: Malformed JSON syntax
        f.write("{ invalid json syntax line !!\n")
        # Line 3: Valid record
        f.write(json.dumps(sample_valid_records[1]) + "\n")
        # Line 4: Missing required field (payment_id)
        invalid_schema = sample_valid_records[2].copy()
        del invalid_schema["payment_id"]
        f.write(json.dumps(invalid_schema) + "\n")

    loader = DatasetLoaderService(raw_data_dir=str(tmp_path))
    records, errors = loader.load_records_from_file(file_path.name)

    assert len(records) == 2
    assert len(errors) == 2

    # Check Error on line 2 (JSON syntax error)
    err_line2 = next(e for e in errors if e.line_number == 2)
    assert err_line2.error_type == "JSON_DECODE_ERROR"

    # Check Error on line 4 (Schema validation error)
    err_line4 = next(e for e in errors if e.line_number == 4)
    assert err_line4.error_type == "SCHEMA_VALIDATION_ERROR"
    assert err_line4.field_name == "payment_id"


def test_compute_summary_metrics(tmp_path: Path, sample_valid_records: List[Dict[str, Any]]) -> None:
    """
    Verify mathematical calculations for financial, status, and method metrics.
    """
    file_path = tmp_path / "payments_summary_test.jsonl"
    with open(file_path, "w", encoding="utf-8") as f:
        for rec in sample_valid_records:
            f.write(json.dumps(rec) + "\n")

    loader = DatasetLoaderService(raw_data_dir=str(tmp_path))
    summary = loader.compute_summary()

    assert summary.status == "ok"
    assert summary.total_records == 3

    # Financial checks: [1000, 3000, 2000]
    assert summary.financial_metrics is not None
    assert summary.financial_metrics.total_amount_inr == 6000.0
    assert summary.financial_metrics.average_amount_inr == 2000.0
    assert summary.financial_metrics.median_amount_inr == 2000.0
    assert summary.financial_metrics.min_amount_inr == 1000.0
    assert summary.financial_metrics.max_amount_inr == 3000.0
    assert summary.financial_metrics.total_fee_inr == 80.0
    assert summary.financial_metrics.total_tax_inr == 14.4

    # Status checks: 2 captured, 1 failed
    assert summary.status_metrics is not None
    assert summary.status_metrics.captured_count == 2
    assert summary.status_metrics.failed_count == 1
    assert summary.status_metrics.success_rate_percent == 66.67
    assert summary.status_metrics.failure_rate_percent == 33.33

    # Method distribution: 1 upi, 1 card, 1 netbanking
    assert summary.method_distribution == {"upi": 1, "card": 1, "netbanking": 1}
    assert summary.method_percentage == {"upi": 33.33, "card": 33.33, "netbanking": 33.33}

    # Bank distribution: HDFC, SBIN
    assert summary.bank_distribution == {"HDFC": 1, "SBIN": 1}

    # VPA Provider: okaxis
    assert summary.vpa_provider_distribution == {"okaxis": 1}


def test_convert_to_pandas_dataframe(tmp_path: Path, sample_valid_records: List[Dict[str, Any]]) -> None:
    """
    Verify conversion of dataset records into a Pandas DataFrame.
    """
    file_path = tmp_path / "payments_df_test.jsonl"
    with open(file_path, "w", encoding="utf-8") as f:
        for rec in sample_valid_records:
            f.write(json.dumps(rec) + "\n")

    loader = DatasetLoaderService(raw_data_dir=str(tmp_path))
    df = loader.to_dataframe()

    assert isinstance(df, pd.DataFrame)
    assert len(df) == 3
    assert list(df["payment_id"]) == ["pay_REC001", "pay_REC002", "pay_REC003"]
    assert df["amount_inr"].mean() == 2000.0
    assert "email" not in df.columns
    assert "contact" not in df.columns


def test_load_nonexistent_file_raises_404(tmp_path: Path) -> None:
    """
    Loading a non-existent file should raise ResourceNotFoundError.
    """
    loader = DatasetLoaderService(raw_data_dir=str(tmp_path))
    with pytest.raises(ResourceNotFoundError) as exc_info:
        loader.load_records_from_file("does_not_exist.jsonl")
    assert exc_info.value.status_code == 404


def test_api_list_and_summary_endpoints(
    client: TestClient, tmp_path: Path, sample_valid_records: List[Dict[str, Any]]
) -> None:
    """
    Verify GET /api/v1/data/datasets and GET /api/v1/data/datasets/summary routes through TestClient.
    """
    from app.api.routes.data import get_dataset_loader_service

    # Write test file
    file_path = tmp_path / "payments_api_test.jsonl"
    with open(file_path, "w", encoding="utf-8") as f:
        for rec in sample_valid_records:
            f.write(json.dumps(rec) + "\n")

    app.dependency_overrides[get_dataset_loader_service] = lambda: DatasetLoaderService(
        raw_data_dir=str(tmp_path)
    )

    try:
        # 1. Test Listing Endpoint
        res_list = client.get("/api/v1/data/datasets")
        assert res_list.status_code == 200
        list_data = res_list.json()
        assert list_data["status"] == "ok"
        assert list_data["total_datasets"] == 1
        assert list_data["datasets"][0]["filename"] == "payments_api_test.jsonl"
        assert list_data["datasets"][0]["valid_records"] == 3

        # 2. Test Summary Endpoint
        res_sum = client.get("/api/v1/data/datasets/summary")
        assert res_sum.status_code == 200
        sum_data = res_sum.json()
        assert sum_data["status"] == "ok"
        assert sum_data["total_records"] == 3
        assert sum_data["financial_metrics"]["total_amount_inr"] == 6000.0
        assert sum_data["status_metrics"]["captured_count"] == 2

    finally:
        app.dependency_overrides.clear()


def test_api_empty_datasets_endpoint(client: TestClient, tmp_path: Path) -> None:
    """
    Verify GET /api/v1/data/datasets returns empty status when no files exist.
    """
    from app.api.routes.data import get_dataset_loader_service

    app.dependency_overrides[get_dataset_loader_service] = lambda: DatasetLoaderService(
        raw_data_dir=str(tmp_path)
    )

    try:
        res_list = client.get("/api/v1/data/datasets")
        assert res_list.status_code == 200
        assert res_list.json()["status"] == "empty"

        res_sum = client.get("/api/v1/data/datasets/summary")
        assert res_sum.status_code == 200
        assert res_sum.json()["status"] == "empty"
    finally:
        app.dependency_overrides.clear()
