"""
Payment data ingestion and normalization service.
"""

import json
import os
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, List, Optional

from app.core.config import Settings, get_settings
from app.core.exceptions import DataIngestionError
from app.core.logging import logger
from app.models.payment import (
    NormalizedPaymentRecord,
    PaymentIngestionRequest,
    PaymentIngestionResponse,
    RazorpayPaymentItem,
)
from app.services.razorpay_client import RazorpayClient


class PaymentIngestionService:
    """
    Coordinates data ingestion from Razorpay API, applies sanitization/normalization,
    and persists normalized datasets for downstream analysis.
    """

    def __init__(
        self,
        client: Optional[RazorpayClient] = None,
        raw_data_dir: Optional[str] = None,
    ) -> None:
        self.client = client or RazorpayClient()
        settings: Settings = get_settings()
        
        # Resolve target storage directory
        target_dir = raw_data_dir or settings.DATA_RAW_DIR
        if not os.path.isabs(target_dir):
            # Resolve relative to project root or workspace
            base_dir = Path(__file__).resolve().parent.parent.parent.parent
            self.raw_data_dir = (base_dir / target_dir).resolve()
        else:
            self.raw_data_dir = Path(target_dir).resolve()

    def _ensure_storage_dir(self) -> Path:
        """
        Ensures the data/raw storage directory exists on disk.
        """
        try:
            self.raw_data_dir.mkdir(parents=True, exist_ok=True)
            return self.raw_data_dir
        except Exception as exc:
            logger.error("Failed to create raw data directory at %s: %s", self.raw_data_dir, str(exc))
            raise DataIngestionError(f"Could not create storage directory: {self.raw_data_dir}") from exc

    def normalize_records(self, raw_items: List[RazorpayPaymentItem]) -> List[NormalizedPaymentRecord]:
        """
        Converts a list of raw Razorpay payment items into sanitized NormalizedPaymentRecord objects.
        """
        normalized_records: List[NormalizedPaymentRecord] = []
        for raw in raw_items:
            try:
                record = NormalizedPaymentRecord.from_raw(raw)
                normalized_records.append(record)
            except Exception as exc:
                logger.warning("Skipping malformed payment item %s: %s", getattr(raw, "id", "UNKNOWN"), str(exc))

        return normalized_records

    def save_normalized_records(
        self,
        records: List[NormalizedPaymentRecord],
        batch_id: str,
    ) -> Path:
        """
        Saves normalized records into a deterministic JSONL file under data/raw/.
        """
        storage_dir = self._ensure_storage_dir()
        timestamp_str = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
        filename = f"payments_{timestamp_str}_{batch_id[:8]}.jsonl"
        target_path = storage_dir / filename

        try:
            with open(target_path, "w", encoding="utf-8") as f:
                for record in records:
                    f.write(record.model_dump_json() + "\n")
            logger.info("Saved %d normalized payment records to %s", len(records), target_path)
            return target_path
        except Exception as exc:
            logger.error("Failed to write normalized records to %s: %s", target_path, str(exc))
            raise DataIngestionError(f"Failed to persist dataset to {target_path}") from exc

    async def ingest_payments(
        self,
        request: PaymentIngestionRequest,
    ) -> PaymentIngestionResponse:
        """
        Executes end-to-end payment ingestion, normalization, and optional persistence.
        """
        batch_id = str(uuid.uuid4())
        logger.info("Starting ingestion batch [%s] with params: %s", batch_id, request.model_dump())

        # Step 1: Retrieve raw payment records from Razorpay API
        raw_items = await self.client.fetch_payments(
            count=request.count,
            skip=request.skip,
            from_timestamp=request.from_timestamp,
            to_timestamp=request.to_timestamp,
            max_pages=request.max_pages,
        )

        records_fetched = len(raw_items)

        # Step 2: Normalize and sanitize records
        normalized_records = self.normalize_records(raw_items)
        records_saved = len(normalized_records)

        # Step 3: Save records to disk if requested
        saved_file_path: Optional[str] = None
        if request.save_to_disk and normalized_records:
            path_obj = self.save_normalized_records(normalized_records, batch_id)
            saved_file_path = str(path_obj)

        # Step 4: Compute summary breakdowns
        methods_breakdown: Dict[str, int] = {}
        status_breakdown: Dict[str, int] = {}
        min_ts: Optional[int] = None
        max_ts: Optional[int] = None

        for rec in normalized_records:
            methods_breakdown[rec.method] = methods_breakdown.get(rec.method, 0) + 1
            status_breakdown[rec.status] = status_breakdown.get(rec.status, 0) + 1
            if min_ts is None or rec.created_at_unix < min_ts:
                min_ts = rec.created_at_unix
            if max_ts is None or rec.created_at_unix > max_ts:
                max_ts = rec.created_at_unix

        logger.info(
            "Ingestion batch [%s] completed: fetched=%d, normalized=%d, statuses=%s",
            batch_id,
            records_fetched,
            records_saved,
            status_breakdown,
        )

        return PaymentIngestionResponse(
            status="success",
            batch_id=batch_id,
            records_fetched=records_fetched,
            records_saved=records_saved,
            file_path=saved_file_path,
            timestamp_range={"min_unix": min_ts, "max_unix": max_ts},
            methods_breakdown=methods_breakdown,
            status_breakdown=status_breakdown,
        )
