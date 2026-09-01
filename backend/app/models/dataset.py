"""
Pydantic schemas and data contracts for dataset loading, inspection, validation, and summaries.
"""

from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class DatasetValidationError(BaseModel):
    """
    Diagnostic error recorded when a JSONL record fails JSON parsing or schema validation.
    """

    line_number: int = Field(..., ge=1, description="Line number in the JSONL file (1-indexed)")
    error_type: str = Field(..., description="Category of error: JSON_DECODE_ERROR, SCHEMA_VALIDATION_ERROR, etc.")
    message: str = Field(..., description="Detailed description of the validation failure")
    field_name: Optional[str] = Field(default=None, description="Specific field that caused validation error, if known")


class DatasetFileInfo(BaseModel):
    """
    Metadata and health information for a raw dataset file located in data/raw/.
    """

    filename: str = Field(..., description="File name (e.g. payments_20260901_120000_abcd1234.jsonl)")
    file_path: str = Field(..., description="Absolute or relative path to the file")
    file_size_bytes: int = Field(..., ge=0, description="Size of file on disk in bytes")
    total_lines: int = Field(..., ge=0, description="Total number of lines in the file")
    valid_records: int = Field(..., ge=0, description="Count of successfully parsed and validated records")
    invalid_records: int = Field(..., ge=0, description="Count of malformed or invalid records")
    is_valid: bool = Field(..., description="True if all records in the file passed validation without errors")
    created_at_iso: Optional[str] = Field(default=None, description="File creation timestamp")
    modified_at_iso: Optional[str] = Field(default=None, description="File last modified timestamp")
    validation_errors: List[DatasetValidationError] = Field(
        default_factory=list, description="List of recorded validation errors, if any"
    )


class DatasetListResponse(BaseModel):
    """
    Response model for dataset listing endpoint (GET /api/v1/data/datasets).
    """

    status: str = Field(default="ok", description="Status code: 'ok' or 'empty'")
    message: str = Field(default="Datasets retrieved successfully.")
    total_datasets: int = Field(default=0, ge=0, description="Number of dataset files found")
    datasets: List[DatasetFileInfo] = Field(default_factory=list, description="List of dataset file metadata")


class FinancialSummary(BaseModel):
    """
    Aggregated financial metrics computed across normalized payment records.
    """

    total_amount_inr: float = Field(..., description="Sum of all transaction amounts in INR")
    average_amount_inr: float = Field(..., description="Arithmetic mean transaction amount in INR")
    median_amount_inr: float = Field(..., description="Median transaction amount in INR")
    min_amount_inr: float = Field(..., description="Minimum transaction amount in INR")
    max_amount_inr: float = Field(..., description="Maximum transaction amount in INR")
    total_fee_inr: float = Field(default=0.0, description="Sum of gateway fees in INR")
    total_tax_inr: float = Field(default=0.0, description="Sum of taxes on fees in INR")


class StatusSummary(BaseModel):
    """
    Status breakdown and conversion rates.
    """

    captured_count: int = Field(default=0, ge=0, description="Count of successfully captured/paid payments")
    failed_count: int = Field(default=0, ge=0, description="Count of failed payments")
    other_count: int = Field(default=0, ge=0, description="Count of authorized/refunded/created payments")
    success_rate_percent: float = Field(..., ge=0.0, le=100.0, description="Percentage of captured payments (0-100%)")
    failure_rate_percent: float = Field(..., ge=0.0, le=100.0, description="Percentage of failed payments (0-100%)")
    status_counts: Dict[str, int] = Field(default_factory=dict, description="Detailed count per exact status string")


class TimeRangeSummary(BaseModel):
    """
    Time distribution of payment transactions.
    """

    earliest_unix: Optional[int] = None
    latest_unix: Optional[int] = None
    earliest_iso: Optional[str] = None
    latest_iso: Optional[str] = None
    timespan_seconds: Optional[int] = None


class DatasetSummaryResponse(BaseModel):
    """
    Response model for dataset statistical summary (GET /api/v1/data/datasets/summary).
    """

    status: str = Field(default="ok", description="Status code: 'ok' or 'empty'")
    message: str = Field(default="Dataset summary generated successfully.")
    dataset_source: Optional[str] = Field(default=None, description="Dataset file analyzed or 'all_datasets'")
    total_records: int = Field(default=0, ge=0, description="Total number of valid records analyzed")
    financial_metrics: Optional[FinancialSummary] = None
    status_metrics: Optional[StatusSummary] = None
    method_distribution: Dict[str, int] = Field(default_factory=dict, description="Counts per payment method")
    method_percentage: Dict[str, float] = Field(default_factory=dict, description="Percentage share per payment method")
    bank_distribution: Dict[str, int] = Field(default_factory=dict, description="Counts per issuing/netbanking bank")
    vpa_provider_distribution: Dict[str, int] = Field(
        default_factory=dict, description="Counts per sanitized UPI provider handle"
    )
    currency_distribution: Dict[str, int] = Field(default_factory=dict, description="Counts per currency")
    international_count: int = Field(default=0, ge=0, description="Number of international transactions")
    time_range: Optional[TimeRangeSummary] = None
