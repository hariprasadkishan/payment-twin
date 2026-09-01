"""
Comprehensive test suite for Behavioral DNA Profiler, statistical formulas, confidence grading,
Wilson confidence intervals, empirical transitions, and FastAPI endpoints.
All tests use controlled fixtures without live API calls.
"""

import json
from pathlib import Path
from typing import Any, Dict, List
import numpy as np
import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.models.dna import BehavioralDNAProfile, DNAStatusResponse
from app.models.payment import NormalizedPaymentRecord
from app.services.dataset_reader import DatasetLoaderService
from app.services.dna_profiler import (
    BehavioralDNAProfiler,
    compute_wilson_confidence_interval,
    normalize_frequencies,
)


@pytest.fixture
def client() -> TestClient:
    return TestClient(app)


@pytest.fixture
def sample_payment_records() -> List[NormalizedPaymentRecord]:
    """
    Controlled fixture of 10 payment records covering various methods, banks, amounts, and statuses.
    """
    raw_dicts = [
        # 3 UPI Captures (<500)
        {"payment_id": "pay_01", "order_id": "ord_1", "amount_paise": 20000, "amount_inr": 200.0, "currency": "INR", "status": "captured", "method": "upi", "bank": None, "wallet": None, "vpa_provider": "okaxis", "international": False, "captured": True, "fee_paise": 0, "tax_paise": 0, "fee_inr": 0.0, "tax_inr": 0.0, "error_code": None, "error_description": None, "error_source": None, "error_step": None, "error_reason": None, "created_at_unix": 1725100000, "created_at_iso": "2026-09-01T00:00:00+00:00"},
        {"payment_id": "pay_02", "order_id": "ord_2", "amount_paise": 35000, "amount_inr": 350.0, "currency": "INR", "status": "captured", "method": "upi", "bank": None, "wallet": None, "vpa_provider": "okhdfcbank", "international": False, "captured": True, "fee_paise": 0, "tax_paise": 0, "fee_inr": 0.0, "tax_inr": 0.0, "error_code": None, "error_description": None, "error_source": None, "error_step": None, "error_reason": None, "created_at_unix": 1725100100, "created_at_iso": "2026-09-01T00:01:40+00:00"},
        {"payment_id": "pay_03", "order_id": "ord_3", "amount_paise": 45000, "amount_inr": 450.0, "currency": "INR", "status": "captured", "method": "upi", "bank": None, "wallet": None, "vpa_provider": "okaxis", "international": False, "captured": True, "fee_paise": 0, "tax_paise": 0, "fee_inr": 0.0, "tax_inr": 0.0, "error_code": None, "error_description": None, "error_source": None, "error_step": None, "error_reason": None, "created_at_unix": 1725100200, "created_at_iso": "2026-09-01T00:03:20+00:00"},
        # 1 UPI Failure (<500)
        {"payment_id": "pay_04", "order_id": "ord_4", "amount_paise": 40000, "amount_inr": 400.0, "currency": "INR", "status": "failed", "method": "upi", "bank": None, "wallet": None, "vpa_provider": "okaxis", "international": False, "captured": False, "fee_paise": None, "tax_paise": None, "fee_inr": None, "tax_inr": None, "error_code": "BAD_REQUEST_ERROR", "error_description": "User cancelled in app", "error_source": "customer", "error_step": "payment_authentication", "error_reason": "payment_cancelled", "created_at_unix": 1725100300, "created_at_iso": "2026-09-01T00:05:00+00:00"},
        # 3 Card Transactions (500-2500): 2 Captured, 1 Failed
        {"payment_id": "pay_05", "order_id": "ord_5", "amount_paise": 120000, "amount_inr": 1200.0, "currency": "INR", "status": "captured", "method": "card", "bank": "HDFC", "wallet": None, "vpa_provider": None, "international": False, "captured": True, "fee_paise": 2400, "tax_paise": 432, "fee_inr": 24.0, "tax_inr": 4.32, "error_code": None, "error_description": None, "error_source": None, "error_step": None, "error_reason": None, "created_at_unix": 1725100400, "created_at_iso": "2026-09-01T00:06:40+00:00"},
        {"payment_id": "pay_06", "order_id": "ord_6", "amount_paise": 180000, "amount_inr": 1800.0, "currency": "INR", "status": "captured", "method": "card", "bank": "HDFC", "wallet": None, "vpa_provider": None, "international": False, "captured": True, "fee_paise": 3600, "tax_paise": 648, "fee_inr": 36.0, "tax_inr": 6.48, "error_code": None, "error_description": None, "error_source": None, "error_step": None, "error_reason": None, "created_at_unix": 1725100500, "created_at_iso": "2026-09-01T00:08:20+00:00"},
        {"payment_id": "pay_07", "order_id": "ord_7", "amount_paise": 220000, "amount_inr": 2200.0, "currency": "INR", "status": "failed", "method": "card", "bank": "SBIN", "wallet": None, "vpa_provider": None, "international": False, "captured": False, "fee_paise": None, "tax_paise": None, "fee_inr": None, "tax_inr": None, "error_code": "GATEWAY_ERROR", "error_description": "Incorrect OTP entered", "error_source": "customer", "error_step": "payment_authentication", "error_reason": "incorrect_otp", "created_at_unix": 1725100600, "created_at_iso": "2026-09-01T00:10:00+00:00"},
        # 3 High Amount Card/Netbanking (>2500): 2 Captured, 1 Failed
        {"payment_id": "pay_08", "order_id": "ord_8", "amount_paise": 500000, "amount_inr": 5000.0, "currency": "INR", "status": "captured", "method": "card", "bank": "HDFC", "wallet": None, "vpa_provider": None, "international": True, "captured": True, "fee_paise": 15000, "tax_paise": 2700, "fee_inr": 150.0, "tax_inr": 27.0, "error_code": None, "error_description": None, "error_source": None, "error_step": None, "error_reason": None, "created_at_unix": 1725100700, "created_at_iso": "2026-09-01T00:11:40+00:00"},
        {"payment_id": "pay_09", "order_id": "ord_9", "amount_paise": 320000, "amount_inr": 3200.0, "currency": "INR", "status": "captured", "method": "netbanking", "bank": "HDFC", "wallet": None, "vpa_provider": None, "international": False, "captured": True, "fee_paise": 6400, "tax_paise": 1152, "fee_inr": 64.0, "tax_inr": 11.52, "error_code": None, "error_description": None, "error_source": None, "error_step": None, "error_reason": None, "created_at_unix": 1725100800, "created_at_iso": "2026-09-01T00:13:20+00:00"},
        {"payment_id": "pay_10", "order_id": "ord_9", "amount_paise": 320000, "amount_inr": 3200.0, "currency": "INR", "status": "failed", "method": "card", "bank": "SBIN", "wallet": None, "vpa_provider": None, "international": False, "captured": False, "fee_paise": None, "tax_paise": None, "fee_inr": None, "tax_inr": None, "error_code": "BAD_REQUEST_ERROR", "error_description": "Insufficient funds", "error_source": "bank", "error_step": "payment_authorization", "error_reason": "insufficient_funds", "created_at_unix": 1725100750, "created_at_iso": "2026-09-01T00:12:30+00:00"},
    ]
    return [NormalizedPaymentRecord.model_validate(r) for r in raw_dicts]


def test_wilson_confidence_interval_formula() -> None:
    """
    Validate Wilson score confidence interval mathematical bounds.
    """
    # 80 successes out of 100 trials -> ~0.80 point estimate
    ci = compute_wilson_confidence_interval(80, 100)
    assert ci is not None
    assert len(ci) == 2
    assert 0.71 < ci[0] < 0.73  # Wilson lower bound ~0.711
    assert 0.86 < ci[1] < 0.88  # Wilson upper bound ~0.867
    assert ci[0] < 0.80 < ci[1]

    # Insufficient sample (< 5) returns None
    assert compute_wilson_confidence_interval(2, 3) is None


def test_normalize_frequencies_sums_to_one() -> None:
    """
    Validate that probability vectors always sum to 1.0 exactly.
    """
    counts = {"upi": 62, "card": 28, "netbanking": 10}
    probs = normalize_frequencies(counts)
    assert sum(probs.values()) == pytest.approx(1.0, abs=1e-5)
    assert probs["upi"] == 0.62
    assert probs["card"] == 0.28
    assert probs["netbanking"] == 0.10


def test_empty_dataset_profiling(tmp_path: Path) -> None:
    """
    Profiler on empty directory should return an honest, explicit empty profile without crashing.
    """
    loader = DatasetLoaderService(raw_data_dir=str(tmp_path))
    profiler = BehavioralDNAProfiler(loader=loader)

    status_resp = profiler.get_status()
    assert status_resp.status == "empty"
    assert status_resp.profiling_available is False
    assert status_resp.confidence_grade == "UNAVAILABLE"
    assert status_resp.available_sample_count == 0

    profile = profiler.build_profile()
    assert profile.status == "empty"
    assert profile.provenance.total_sample_size == 0
    assert profile.reliability.confidence_grade == "UNAVAILABLE"
    assert profile.method_priors.probabilities == {}
    assert profile.success_dynamics.overall_success_rate is None


def test_single_record_profiling(sample_payment_records: List[NormalizedPaymentRecord]) -> None:
    """
    Profiler with N=1 should produce INSUFFICIENT_DATA grade and no false certainty.
    """
    single = [sample_payment_records[0]]
    profiler = BehavioralDNAProfiler()
    profile = profiler.build_profile(records=single)

    assert profile.status == "ok"
    assert profile.provenance.total_sample_size == 1
    assert profile.reliability.confidence_grade == "INSUFFICIENT_DATA"
    assert profile.reliability.sample_size_adequate is False
    assert profile.method_priors.probabilities == {"upi": 1.0}
    assert profile.success_dynamics.overall_success_rate == 1.0
    assert profile.success_dynamics.overall_confidence_interval_95 is None  # N < 5


def test_sample_size_grading_tiers() -> None:
    """
    Validate approved sample size grading thresholds.
    """
    profiler = BehavioralDNAProfiler()

    grade_0, score_0, ad_0 = profiler._assess_sample_size(0)
    assert grade_0 == "UNAVAILABLE" and ad_0 is False

    grade_1, score_1, ad_1 = profiler._assess_sample_size(7)
    assert grade_1 == "INSUFFICIENT_DATA" and ad_1 is False

    grade_c, score_c, ad_c = profiler._assess_sample_size(25)
    assert grade_c == "GRADE_C" and ad_c is False

    grade_b, score_b, ad_b = profiler._assess_sample_size(100)
    assert grade_b == "GRADE_B" and ad_b is True

    grade_a, score_a, ad_a = profiler._assess_sample_size(500)
    assert grade_a == "GRADE_A" and ad_a is True


def test_method_priors_and_amount_conditioning(
    sample_payment_records: List[NormalizedPaymentRecord],
) -> None:
    """
    Verify method marginal priors and amount-tier conditioned distributions.
    """
    profiler = BehavioralDNAProfiler()
    profile = profiler.build_profile(records=sample_payment_records)

    priors = profile.method_priors
    assert sum(priors.probabilities.values()) == pytest.approx(1.0, abs=1e-4)
    # Total 10 records: 4 upi, 5 card, 1 netbanking
    assert priors.probabilities["upi"] == 0.40
    assert priors.probabilities["card"] == 0.50
    assert priors.probabilities["netbanking"] == 0.10

    # Sub-instrument: UPI providers
    assert "upi_providers" in priors.sub_instrument_priors
    assert "okaxis" in priors.sub_instrument_priors["upi_providers"]

    # Amount conditioned: low tier (<500) should be 100% upi
    assert "tier_low_under_500" in priors.amount_conditioned_priors
    assert priors.amount_conditioned_priors["tier_low_under_500"] == {"upi": 1.0}


def test_success_dynamics_and_failure_diagnostics(
    sample_payment_records: List[NormalizedPaymentRecord],
) -> None:
    """
    Verify success rates, Wilson CIs, and failure diagnostic distributions.
    """
    profiler = BehavioralDNAProfiler()
    profile = profiler.build_profile(records=sample_payment_records)

    # Success Dynamics: 7 captured out of 10 = 0.70
    sd = profile.success_dynamics
    assert sd.overall_success_rate == 0.70
    assert sd.overall_confidence_interval_95 is not None
    assert sd.overall_confidence_interval_95[0] < 0.70 < sd.overall_confidence_interval_95[1]

    # UPI: 3 captures out of 4 attempts = 0.75 (N=4 < 5 so ci_95 is None)
    assert sd.by_method["upi"].rate == 0.75
    assert sd.by_method["upi"].ci_95 is None

    # Card: 3 captures out of 5 attempts = 0.60 (N=5 >= 5 so ci_95 is computed)
    assert sd.by_method["card"].rate == 0.60
    assert sd.by_method["card"].ci_95 is not None

    # Failure Diagnostics: 3 failed payments (pay_04, pay_07, pay_10)
    fd = profile.failure_diagnostics
    assert fd.failed_sample_size == 3
    assert fd.error_source_distribution["customer"] == pytest.approx(2 / 3, abs=1e-2)
    assert fd.error_source_distribution["bank"] == pytest.approx(1 / 3, abs=1e-2)
    assert "incorrect_otp" in fd.top_error_reasons
    assert "payment_cancelled" in fd.top_error_reasons
    assert "insufficient_funds" in fd.top_error_reasons


def test_amount_statistics_and_quantiles(
    sample_payment_records: List[NormalizedPaymentRecord],
) -> None:
    """
    Verify descriptive metrics and quantiles for transaction amounts.
    """
    profiler = BehavioralDNAProfiler()
    profile = profiler.build_profile(records=sample_payment_records)

    ad = profile.amount_distribution
    assert ad.sample_size == 10
    assert ad.summary is not None
    assert ad.summary.mean > 0
    assert ad.summary.median > 0
    assert ad.summary.iqr >= 0
    assert "p50" in ad.quantiles
    assert "p90" in ad.quantiles
    assert ad.quantiles["p10"] <= ad.quantiles["p50"] <= ad.quantiles["p99"]

    # Small sample (N=10 < 30) should indicate inadequate sample for parametric fit
    assert ad.parametric_fit is not None
    assert ad.parametric_fit.is_adequate_fit is False
    assert "< 30" in (ad.parametric_fit.note or "")


def test_lognormal_goodness_of_fit_rejection() -> None:
    """
    Verify that non-lognormal data (e.g. bi-modal uniform mixture) rejects lognormal fit and falls back.
    """
    # Create 50 synthetic data points that clearly fail log-normal test (uniform 100 to 1000)
    np.random.seed(42)
    bimodal_data = np.concatenate([np.random.uniform(10, 20, 25), np.random.uniform(5000, 5010, 25)])

    profiler = BehavioralDNAProfiler()
    fit_res = profiler._fit_lognormal_distribution(bimodal_data, len(bimodal_data))

    assert fit_res is not None
    assert fit_res.is_adequate_fit is False
    assert "rejected" in (fit_res.note or "")


def test_empirical_transitions_retry_inference(
    sample_payment_records: List[NormalizedPaymentRecord],
) -> None:
    """
    Verify retry probability and method switching on order ord_9 (pay_10 failed -> pay_09 captured).
    """
    profiler = BehavioralDNAProfiler()
    profile = profiler.build_profile(records=sample_payment_records)

    tr = profile.empirical_transitions
    assert tr.has_order_tracking is True
    assert tr.tracked_orders_count == 9  # ord_1 to ord_9 (ord_9 appears twice)
    assert tr.multi_attempt_orders_count == 1  # ord_9 has 2 attempts

    # ord_9: Attempt 1 at t=1725100750 (Card, failed) -> Attempt 2 at t=1725100800 (Netbanking, captured)
    # Total orders where attempt 1 failed: ord_4 (failed, 1 attempt), ord_7 (failed, 1 attempt), ord_9 (failed, 2 attempts) -> 3 orders
    # Retried orders: ord_9 -> 1 order
    assert tr.overall_retry_probability_on_failure == pytest.approx(1 / 3, abs=1e-2)
    # Switched method on retry: ord_9 switched from card to netbanking -> 1.0 (100%)
    assert tr.method_switch_on_retry_probability == 1.0


def test_temporal_dynamics_insufficient_span(
    sample_payment_records: List[NormalizedPaymentRecord],
) -> None:
    """
    Verify temporal dynamics marks span insufficient when timestamps span < 7 days.
    """
    profiler = BehavioralDNAProfiler()
    profile = profiler.build_profile(records=sample_payment_records)

    td = profile.temporal_dynamics
    assert td.has_sufficient_timespan is False
    assert td.hour_of_day_priors is None
    assert "Insufficient temporal span" in td.status_message


def test_provenance_tagging(sample_payment_records: List[NormalizedPaymentRecord]) -> None:
    """
    Verify OBSERVED_RAZORPAY_DATA vs SYNTHETIC_BENCHMARK_DATA provenance enforcement.
    """
    profiler = BehavioralDNAProfiler()

    # Observed
    prof_obs = profiler.build_profile(records=sample_payment_records, is_synthetic=False)
    assert prof_obs.provenance.data_source_type == "OBSERVED_RAZORPAY_DATA"
    assert prof_obs.provenance.is_synthetic_benchmark is False

    # Synthetic
    prof_synth = profiler.build_profile(records=sample_payment_records, is_synthetic=True)
    assert prof_synth.provenance.data_source_type == "SYNTHETIC_BENCHMARK_DATA"
    assert prof_synth.provenance.is_synthetic_benchmark is True


def test_deterministic_output(sample_payment_records: List[NormalizedPaymentRecord]) -> None:
    """
    Verify that identical inputs produce identical mathematical results deterministically.
    """
    profiler = BehavioralDNAProfiler()
    prof1 = profiler.build_profile(records=sample_payment_records)
    prof2 = profiler.build_profile(records=sample_payment_records)

    assert prof1.method_priors.probabilities == prof2.method_priors.probabilities
    assert prof1.amount_distribution.summary == prof2.amount_distribution.summary
    assert prof1.success_dynamics.overall_success_rate == prof2.success_dynamics.overall_success_rate


def test_api_dna_status_and_profile_endpoints(
    client: TestClient, tmp_path: Path, sample_payment_records: List[NormalizedPaymentRecord]
) -> None:
    """
    Verify GET /api/v1/dna/status and GET /api/v1/dna/profile via FastAPI test client.
    """
    from app.api.routes.dna import get_dna_profiler

    # Write test file to tmp_path
    file_path = tmp_path / "payments_dna_test.jsonl"
    with open(file_path, "w", encoding="utf-8") as f:
        for rec in sample_payment_records:
            f.write(rec.model_dump_json() + "\n")

    loader = DatasetLoaderService(raw_data_dir=str(tmp_path))
    profiler = BehavioralDNAProfiler(loader=loader)

    app.dependency_overrides[get_dna_profiler] = lambda: profiler

    try:
        # 1. Test Status Endpoint
        res_status = client.get("/api/v1/dna/status")
        assert res_status.status_code == 200
        data_status = res_status.json()
        assert data_status["status"] in ("ready", "insufficient_data")
        assert data_status["profiling_available"] is True
        assert data_status["available_sample_count"] == 10
        assert data_status["confidence_grade"] == "GRADE_C"

        # 2. Test Profile Endpoint
        res_profile = client.get("/api/v1/dna/profile")
        assert res_profile.status_code == 200
        data_profile = res_profile.json()
        assert data_profile["status"] == "ok"
        assert data_profile["dna_version"] == "1.0.0"
        assert data_profile["provenance"]["total_sample_size"] == 10
        assert data_profile["method_priors"]["probabilities"]["upi"] == 0.40
        assert data_profile["success_dynamics"]["overall_success_rate"] == 0.70

    finally:
        app.dependency_overrides.clear()
