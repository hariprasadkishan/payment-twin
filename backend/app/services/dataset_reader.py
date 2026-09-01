"""
Dataset loading, validation, and summary inspection service for normalized payment records.
"""

import json
import os
import statistics
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple, Union

import pandas as pd
from pydantic import ValidationError

from app.core.config import Settings, get_settings
from app.core.exceptions import DataIngestionError, ResourceNotFoundError
from app.core.logging import logger
from app.models.dataset import (
    DatasetFileInfo,
    DatasetListResponse,
    DatasetSummaryResponse,
    DatasetValidationError,
    FinancialSummary,
    StatusSummary,
    TimeRangeSummary,
)
from app.models.payment import NormalizedPaymentRecord


class DatasetLoaderService:
    """
    Service responsible for loading, inspecting, and validating normalized payment datasets from data/raw/.
    """

    def __init__(self, raw_data_dir: Optional[str] = None) -> None:
        settings: Settings = get_settings()
        target_dir = raw_data_dir or settings.DATA_RAW_DIR

        if not os.path.isabs(target_dir):
            base_dir = Path(__file__).resolve().parent.parent.parent.parent
            self.raw_data_dir = (base_dir / target_dir).resolve()
        else:
            self.raw_data_dir = Path(target_dir).resolve()

    def get_raw_data_dir(self) -> Path:
        """
        Returns the resolved Path to data/raw/, ensuring it exists.
        """
        self.raw_data_dir.mkdir(parents=True, exist_ok=True)
        return self.raw_data_dir

    def list_dataset_files(self) -> List[DatasetFileInfo]:
        """
        Scans data/raw/ for all .jsonl files and computes validation and metadata statistics.
        """
        storage_dir = self.get_raw_data_dir()
        file_paths = sorted(list(storage_dir.glob("*.jsonl")))

        dataset_infos: List[DatasetFileInfo] = []

        for p in file_paths:
            stat_info = p.stat()
            file_size = stat_info.st_size
            created_iso = datetime.fromtimestamp(stat_info.st_ctime, tz=timezone.utc).isoformat()
            modified_iso = datetime.fromtimestamp(stat_info.st_mtime, tz=timezone.utc).isoformat()

            valid_records, validation_errors, total_lines = self._validate_and_read_file(p)
            is_valid = len(validation_errors) == 0 and total_lines > 0

            dataset_infos.append(
                DatasetFileInfo(
                    filename=p.name,
                    file_path=str(p),
                    file_size_bytes=file_size,
                    total_lines=total_lines,
                    valid_records=len(valid_records),
                    invalid_records=len(validation_errors),
                    is_valid=is_valid,
                    created_at_iso=created_iso,
                    modified_at_iso=modified_iso,
                    validation_errors=validation_errors,
                )
            )

        return dataset_infos

    def _validate_and_read_file(
        self, file_path: Path
    ) -> Tuple[List[NormalizedPaymentRecord], List[DatasetValidationError], int]:
        """
        Reads a single JSONL file line by line, capturing validation errors without crashing.
        """
        valid_records: List[NormalizedPaymentRecord] = []
        validation_errors: List[DatasetValidationError] = []
        line_num = 0

        try:
            with open(file_path, "r", encoding="utf-8") as f:
                for line in f:
                    line_num += 1
                    line_str = line.strip()
                    if not line_str:
                        continue

                    # 1. Check for JSON parse errors
                    try:
                        raw_dict = json.loads(line_str)
                    except json.JSONDecodeError as exc:
                        validation_errors.append(
                            DatasetValidationError(
                                line_number=line_num,
                                error_type="JSON_DECODE_ERROR",
                                message=f"Invalid JSON on line {line_num}: {str(exc)}",
                            )
                        )
                        continue

                    # 2. Check for Pydantic schema validation errors
                    try:
                        record = NormalizedPaymentRecord.model_validate(raw_dict)
                        valid_records.append(record)
                    except ValidationError as exc:
                        field_err = exc.errors()[0]["loc"][0] if exc.errors() else None
                        msg = exc.errors()[0]["msg"] if exc.errors() else str(exc)
                        validation_errors.append(
                            DatasetValidationError(
                                line_number=line_num,
                                error_type="SCHEMA_VALIDATION_ERROR",
                                message=f"Validation failed on line {line_num} (field: {field_err}): {msg}",
                                field_name=str(field_err) if field_err else None,
                            )
                        )
                    except Exception as exc:
                        validation_errors.append(
                            DatasetValidationError(
                                line_number=line_num,
                                error_type="UNEXPECTED_ERROR",
                                message=f"Unexpected error validating line {line_num}: {str(exc)}",
                            )
                        )

        except Exception as exc:
            logger.error("Failed to read dataset file at %s: %s", file_path, str(exc))
            raise DataIngestionError(f"Failed to read dataset file at {file_path}") from exc

        return valid_records, validation_errors, line_num

    def load_records_from_file(
        self, filename: str
    ) -> Tuple[List[NormalizedPaymentRecord], List[DatasetValidationError]]:
        """
        Loads records from a specific file in data/raw/.
        """
        storage_dir = self.get_raw_data_dir()
        target_path = (storage_dir / filename).resolve()

        if not target_path.exists() or not target_path.is_file():
            logger.warning("Dataset file '%s' was not found in %s", filename, storage_dir)
            raise ResourceNotFoundError(resource_type="DatasetFile", resource_id=filename)

        valid_records, validation_errors, _ = self._validate_and_read_file(target_path)
        return valid_records, validation_errors

    def load_all_records(self) -> Tuple[List[NormalizedPaymentRecord], List[DatasetValidationError]]:
        """
        Loads and aggregates records from all .jsonl files under data/raw/.
        """
        storage_dir = self.get_raw_data_dir()
        file_paths = sorted(list(storage_dir.glob("*.jsonl")))

        all_records: List[NormalizedPaymentRecord] = []
        all_errors: List[DatasetValidationError] = []

        for p in file_paths:
            records, errors, _ = self._validate_and_read_file(p)
            all_records.extend(records)
            all_errors.extend(errors)

        return all_records, all_errors

    def to_dataframe(
        self,
        records: Optional[List[NormalizedPaymentRecord]] = None,
    ) -> pd.DataFrame:
        """
        Converts a list of NormalizedPaymentRecord objects (or all available records) into a Pandas DataFrame.
        """
        if records is None:
            records, _ = self.load_all_records()

        if not records:
            # Return empty DataFrame with the expected columns
            columns = list(NormalizedPaymentRecord.model_fields.keys())
            return pd.DataFrame(columns=columns)

        data = [r.model_dump() for r in records]
        df = pd.DataFrame(data)

        # Ensure numeric type conversions
        if "amount_inr" in df.columns:
            df["amount_inr"] = pd.to_numeric(df["amount_inr"], errors="coerce")
        if "amount_paise" in df.columns:
            df["amount_paise"] = pd.to_numeric(df["amount_paise"], errors="coerce")
        if "created_at_unix" in df.columns:
            df["created_at_unix"] = pd.to_numeric(df["created_at_unix"], errors="coerce")

        return df

    def compute_summary(self, filename: Optional[str] = None) -> DatasetSummaryResponse:
        """
        Calculates descriptive summary metrics over the loaded dataset.
        Returns a clean empty response if no records exist.
        """
        source_label = filename or "all_datasets"

        if filename:
            records, _ = self.load_records_from_file(filename)
        else:
            records, _ = self.load_all_records()

        if not records:
            return DatasetSummaryResponse(
                status="empty",
                message="No payment datasets are currently available.",
                dataset_source=source_label,
                total_records=0,
            )

        total_count = len(records)
        amounts_inr = [r.amount_inr for r in records]
        fees_inr = [r.fee_inr for r in records if r.fee_inr is not None]
        taxes_inr = [r.tax_inr for r in records if r.tax_inr is not None]

        # 1. Financial Metrics
        total_amt = round(sum(amounts_inr), 2)
        avg_amt = round(statistics.mean(amounts_inr), 2)
        median_amt = round(statistics.median(amounts_inr), 2)
        min_amt = round(min(amounts_inr), 2)
        max_amt = round(max(amounts_inr), 2)
        total_fee = round(sum(fees_inr), 2) if fees_inr else 0.0
        total_tax = round(sum(taxes_inr), 2) if taxes_inr else 0.0

        financial_summary = FinancialSummary(
            total_amount_inr=total_amt,
            average_amount_inr=avg_amt,
            median_amount_inr=median_amt,
            min_amount_inr=min_amt,
            max_amount_inr=max_amt,
            total_fee_inr=total_fee,
            total_tax_inr=total_tax,
        )

        # 2. Status Metrics
        status_counts: Dict[str, int] = {}
        captured_count = 0
        failed_count = 0
        other_count = 0

        for r in records:
            st = r.status.lower()
            status_counts[st] = status_counts.get(st, 0) + 1
            if st in ("captured", "paid"):
                captured_count += 1
            elif st == "failed":
                failed_count += 1
            else:
                other_count += 1

        success_rate = round((captured_count / total_count) * 100.0, 2)
        failure_rate = round((failed_count / total_count) * 100.0, 2)

        status_summary = StatusSummary(
            captured_count=captured_count,
            failed_count=failed_count,
            other_count=other_count,
            success_rate_percent=success_rate,
            failure_rate_percent=failure_rate,
            status_counts=status_counts,
        )

        # 3. Method, Bank, VPA, Currency distributions
        method_dist: Dict[str, int] = {}
        bank_dist: Dict[str, int] = {}
        vpa_dist: Dict[str, int] = {}
        currency_dist: Dict[str, int] = {}
        international_count = 0

        min_unix: Optional[int] = None
        max_unix: Optional[int] = None
        earliest_iso: Optional[str] = None
        latest_iso: Optional[str] = None

        for r in records:
            # Method
            method_dist[r.method] = method_dist.get(r.method, 0) + 1
            # Bank
            if r.bank:
                bank_dist[r.bank] = bank_dist.get(r.bank, 0) + 1
            # VPA Provider
            if r.vpa_provider:
                vpa_dist[r.vpa_provider] = vpa_dist.get(r.vpa_provider, 0) + 1
            # Currency
            currency_dist[r.currency] = currency_dist.get(r.currency, 0) + 1
            # International
            if r.international:
                international_count += 1
            # Timestamps
            if min_unix is None or r.created_at_unix < min_unix:
                min_unix = r.created_at_unix
                earliest_iso = r.created_at_iso
            if max_unix is None or r.created_at_unix > max_unix:
                max_unix = r.created_at_unix
                latest_iso = r.created_at_iso

        method_pct = {k: round((v / total_count) * 100.0, 2) for k, v in method_dist.items()}

        time_range_summary = None
        if min_unix is not None and max_unix is not None:
            time_range_summary = TimeRangeSummary(
                earliest_unix=min_unix,
                latest_unix=max_unix,
                earliest_iso=earliest_iso,
                latest_iso=latest_iso,
                timespan_seconds=max_unix - min_unix,
            )

        return DatasetSummaryResponse(
            status="ok",
            message="Dataset summary generated successfully.",
            dataset_source=source_label,
            total_records=total_count,
            financial_metrics=financial_summary,
            status_metrics=status_summary,
            method_distribution=method_dist,
            method_percentage=method_pct,
            bank_distribution=bank_dist,
            vpa_provider_distribution=vpa_dist,
            currency_distribution=currency_dist,
            international_count=international_count,
            time_range=time_range_summary,
        )
