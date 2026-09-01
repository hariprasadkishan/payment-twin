"""
Synthetic Benchmark Dataset Seeder.
Generates an aggregate, realistic payment population strictly tagged as SYNTHETIC_BENCHMARK_DATA.
Never fabricates Razorpay live transactions.
"""

import json
import math
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, List, Optional
import numpy as np

from app.core.config import get_settings
from app.models.payment import NormalizedPaymentRecord
from app.services.dataset_reader import DatasetLoaderService


BENCHMARK_FILENAME = "synthetic_benchmark_retail_ecommerce.jsonl"


class BenchmarkDatasetService:
    """
    Generates and manages canonical synthetic benchmark datasets for demonstration
    when observed live Razorpay payment data is empty.
    """

    def __init__(self, loader: Optional[DatasetLoaderService] = None) -> None:
        self.loader = loader or DatasetLoaderService()

    def generate_benchmark_records(self, sample_size: int = 650, seed: int = 42) -> List[NormalizedPaymentRecord]:
        """
        Generates a statistically realistic, deterministic collection of normalized payment records.
        """
        rng = np.random.default_rng(seed)
        records: List[NormalizedPaymentRecord] = []

        base_timestamp = int(datetime(2026, 8, 1, 0, 0, 0, tzinfo=timezone.utc).timestamp())
        timespan_seconds = 30 * 86400  # 30 days

        # Payment Methods & Proportions
        methods = ["upi", "card", "netbanking", "wallet"]
        method_weights = [0.60, 0.28, 0.08, 0.04]

        upi_handles = ["okaxis", "okhdfcbank", "oksbi", "paytm", "ybl"]
        upi_handle_weights = [0.35, 0.30, 0.20, 0.10, 0.05]

        banks = ["HDFC", "SBIN", "ICIC", "UTIB", "KKBK"]
        bank_weights = [0.35, 0.25, 0.20, 0.12, 0.08]

        wallets = ["paytm", "mobikwik", "freecharge"]
        wallet_weights = [0.70, 0.20, 0.10]

        # Success probabilities by method
        success_probs = {
            "upi": 0.88,
            "card": 0.84,
            "netbanking": 0.76,
            "wallet": 0.92,
        }

        # MDR fee rates by method
        mdr_rates = {
            "card": 0.0185,       # 1.85% MDR
            "netbanking": 0.015,  # 1.50% MDR
            "wallet": 0.012,      # 1.20% MDR
            "upi": 0.00,          # 0.00% MDR
        }

        order_counter = 1000
        i = 0

        while i < sample_size:
            order_counter += 1
            order_id = f"order_bench_{order_counter}"

            # Method selection
            method = rng.choice(methods, p=method_weights)

            # Bank / VPA provider selection
            bank: Optional[str] = None
            vpa_provider: Optional[str] = None
            wallet: Optional[str] = None

            if method == "upi":
                vpa_provider = rng.choice(upi_handles, p=upi_handle_weights)
            elif method in ("card", "netbanking"):
                bank = rng.choice(banks, p=bank_weights)
            elif method == "wallet":
                wallet = rng.choice(wallets, p=wallet_weights)

            # Realistic Lognormal Transaction Amount (INR)
            mu = math.log(1450.0)
            sigma = 0.75
            amount_inr = round(float(rng.lognormal(mean=mu, sigma=sigma)), 2)
            amount_inr = max(120.0, min(18000.0, amount_inr))
            amount_paise = int(round(amount_inr * 100))

            # Timestamps with diurnal hour curve
            random_offset = int(rng.uniform(0, timespan_seconds))
            # Boost daytime transactions (10:00 to 22:00)
            hour_boost = int(rng.choice([10, 12, 14, 16, 18, 20, 21])) * 3600
            created_at_unix = base_timestamp + (random_offset // 86400) * 86400 + hour_boost + int(rng.uniform(0, 3600))
            created_at_iso = datetime.fromtimestamp(created_at_unix, tz=timezone.utc).isoformat()

            # Determine Success / Failure
            prob_success = success_probs[method]
            is_success = rng.random() < prob_success

            if is_success:
                status = "captured"
                captured = True
                fee_rate = mdr_rates[method]
                fee_inr = round(amount_inr * fee_rate, 2) if fee_rate > 0 else 0.0
                tax_inr = round(fee_inr * 0.18, 2) if fee_inr > 0 else 0.0  # 18% GST on MDR

                record = NormalizedPaymentRecord(
                    payment_id=f"pay_bench_{order_counter}_1",
                    order_id=order_id,
                    amount_paise=amount_paise,
                    amount_inr=amount_inr,
                    currency="INR",
                    status=status,
                    method=method,
                    bank=bank,
                    wallet=wallet,
                    vpa_provider=vpa_provider,
                    international=False,
                    captured=captured,
                    fee_paise=int(fee_inr * 100) if fee_inr > 0 else None,
                    tax_paise=int(tax_inr * 100) if tax_inr > 0 else None,
                    fee_inr=fee_inr if fee_inr > 0 else None,
                    tax_inr=tax_inr if tax_inr > 0 else None,
                    error_code=None,
                    error_description=None,
                    error_source=None,
                    error_step=None,
                    error_reason=None,
                    acquirer_rrn=f"RRN{rng.integers(10000000, 99999999)}",
                    acquirer_auth_code=f"AUTH{rng.integers(1000, 9999)}",
                    created_at_unix=created_at_unix,
                    created_at_iso=created_at_iso,
                )
                records.append(record)
                i += 1
            else:
                # Failed attempt
                status = "failed"
                captured = False

                error_src = rng.choice(["customer", "bank", "gateway"], p=[0.65, 0.23, 0.12])
                if error_src == "customer":
                    error_code = "BAD_REQUEST_ERROR"
                    error_step = "payment_authentication"
                    error_reason = rng.choice(["incorrect_otp", "insufficient_funds", "payment_cancelled"], p=[0.50, 0.35, 0.15])
                    error_desc = f"Customer error: {error_reason.replace('_', ' ')}"
                elif error_src == "bank":
                    error_code = "GATEWAY_ERROR"
                    error_step = "payment_authorization"
                    error_reason = rng.choice(["bank_server_down", "card_declined", "daily_limit_exceeded"], p=[0.45, 0.35, 0.20])
                    error_desc = f"Issuing bank error: {error_reason.replace('_', ' ')}"
                else:
                    error_code = "GATEWAY_ERROR"
                    error_step = "payment_authorization"
                    error_reason = "gateway_timeout"
                    error_desc = "Payment gateway request timed out."

                record = NormalizedPaymentRecord(
                    payment_id=f"pay_bench_{order_counter}_1",
                    order_id=order_id,
                    amount_paise=amount_paise,
                    amount_inr=amount_inr,
                    currency="INR",
                    status=status,
                    method=method,
                    bank=bank,
                    wallet=wallet,
                    vpa_provider=vpa_provider,
                    international=False,
                    captured=captured,
                    fee_paise=None,
                    tax_paise=None,
                    fee_inr=None,
                    tax_inr=None,
                    error_code=error_code,
                    error_description=error_desc,
                    error_source=error_src,
                    error_step=error_step,
                    error_reason=error_reason,
                    acquirer_rrn=None,
                    acquirer_auth_code=None,
                    created_at_unix=created_at_unix,
                    created_at_iso=created_at_iso,
                )
                records.append(record)
                i += 1

                # 45% of failed orders attempt a retry
                if rng.random() < 0.45 and i < sample_size:
                    retry_time_unix = created_at_unix + int(rng.uniform(60, 300))
                    # 30% switch payment method on retry
                    if rng.random() < 0.30:
                        retry_method = "upi" if method != "upi" else "card"
                        retry_vpa = "okaxis" if retry_method == "upi" else None
                        retry_bank = "HDFC" if retry_method == "card" else None
                    else:
                        retry_method = method
                        retry_vpa = vpa_provider
                        retry_bank = bank

                    retry_success = rng.random() < 0.75
                    retry_status = "captured" if retry_success else "failed"

                    fee_rate = mdr_rates[retry_method]
                    fee_inr = round(amount_inr * fee_rate, 2) if (retry_success and fee_rate > 0) else None
                    tax_inr = round(fee_inr * 0.18, 2) if (fee_inr and fee_inr > 0) else None

                    retry_rec = NormalizedPaymentRecord(
                        payment_id=f"pay_bench_{order_counter}_2",
                        order_id=order_id,
                        amount_paise=amount_paise,
                        amount_inr=amount_inr,
                        currency="INR",
                        status=retry_status,
                        method=retry_method,
                        bank=retry_bank,
                        wallet=None,
                        vpa_provider=retry_vpa,
                        international=False,
                        captured=retry_success,
                        fee_paise=int(fee_inr * 100) if fee_inr else None,
                        tax_paise=int(tax_inr * 100) if tax_inr else None,
                        fee_inr=fee_inr,
                        tax_inr=tax_inr,
                        error_code=None if retry_success else "BAD_REQUEST_ERROR",
                        error_description=None if retry_success else "Customer cancelled during retry OTP.",
                        error_source=None if retry_success else "customer",
                        error_step=None if retry_success else "payment_authentication",
                        error_reason=None if retry_success else "payment_cancelled",
                        acquirer_rrn=f"RRN{rng.integers(10000000, 99999999)}" if retry_success else None,
                        acquirer_auth_code=f"AUTH{rng.integers(1000, 9999)}" if retry_success else None,
                        created_at_unix=retry_time_unix,
                        created_at_iso=datetime.fromtimestamp(retry_time_unix, tz=timezone.utc).isoformat(),
                    )
                    records.append(retry_rec)
                    i += 1

        # Sort all records chronologically
        records.sort(key=lambda r: r.created_at_unix)
        return records

    def seed_benchmark_file(self, filename: str = BENCHMARK_FILENAME) -> Path:
        """
        Saves the generated benchmark dataset into data/raw/.
        """
        raw_dir = self.loader.get_raw_data_dir()
        file_path = raw_dir / filename

        records = self.generate_benchmark_records()

        with open(file_path, "w", encoding="utf-8") as f:
            for rec in records:
                f.write(rec.model_dump_json() + "\n")

        return file_path

    def clear_benchmark_file(self, filename: str = BENCHMARK_FILENAME) -> bool:
        """
        Deletes the benchmark dataset from data/raw/.
        """
        raw_dir = self.loader.get_raw_data_dir()
        file_path = raw_dir / filename
        if file_path.exists():
            file_path.unlink()
            return True
        return False
