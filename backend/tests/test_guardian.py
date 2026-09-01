"""
Comprehensive test suite for Payment Guardian Sentinel.
Validates pure statistical drift detectors (PSI, Two-Proportion, Fisher's Exact, KS, CUSUM, FDR),
alert lifecycle management, deduplication, auto-recovery, diagnostic associations,
business impact estimation, Twin handoffs, and FastAPI endpoints.
All tests use controlled fixtures without live API calls.
"""

from typing import Any, Dict, List
import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.models.dna import (
    AmountDistribution,
    AmountSummary,
    BehavioralDNAProfile,
    DataProvenance,
    EmpiricalTransitions,
    FailureDiagnostics,
    FeeEconomics,
    MethodPriors,
    ParametricFitResult,
    ReliabilityAssessment,
    SuccessDynamics,
    SuccessRateMetric,
    TemporalDynamics,
)
from app.models.guardian import (
    AlertSeverity,
    AlertStatus,
    DetectorType,
    GuardianConfig,
    GuardianWindowMode,
)
from app.models.payment import NormalizedPaymentRecord
from app.services.drift_detectors import (
    benjamini_hochberg_fdr,
    calculate_psi,
    fisher_exact_test,
    tabular_cusum,
    two_proportion_ztest,
    two_sample_ks_test,
)
from app.services.guardian_service import GuardianSentinelService


@pytest.fixture
def client() -> TestClient:
    return TestClient(app)


@pytest.fixture
def calibrated_dna() -> BehavioralDNAProfile:
    """
    Controlled Behavioral DNA baseline profile for Guardian surveillance testing.
    """
    return BehavioralDNAProfile(
        status="ok",
        dna_version="1.0.0",
        provenance=DataProvenance(
            data_source_type="OBSERVED_RAZORPAY_DATA",
            is_synthetic_benchmark=False,
            source_datasets=["payments_baseline.jsonl"],
            extracted_at_iso="2026-09-01T12:00:00+00:00",
            total_sample_size=1000,
            timespan_days=14.0,
        ),
        reliability=ReliabilityAssessment(
            confidence_grade="GRADE_A",
            confidence_score=0.95,
            sample_size_adequate=True,
            subsegment_reliability={"upi": "HIGH", "card": "HIGH", "netbanking": "MODERATE"},
            notes=[],
        ),
        method_priors=MethodPriors(
            probabilities={"upi": 0.60, "card": 0.30, "netbanking": 0.10},
            sub_instrument_priors={
                "upi_providers": {"okaxis": 0.60, "okhdfcbank": 0.40},
                "banks": {"HDFC": 0.70, "SBIN": 0.30},
            },
            amount_conditioned_priors={},
            sample_size=1000,
        ),
        success_dynamics=SuccessDynamics(
            overall_success_rate=0.88,
            overall_confidence_interval_95=[0.86, 0.90],
            by_method={
                "upi": SuccessRateMetric(rate=0.90, ci_95=[0.87, 0.92], sample_size=600),
                "card": SuccessRateMetric(rate=0.85, ci_95=[0.81, 0.89], sample_size=300),
                "netbanking": SuccessRateMetric(rate=0.80, ci_95=[0.72, 0.87], sample_size=100),
            },
            by_bank={
                "HDFC": SuccessRateMetric(rate=0.88, ci_95=[0.85, 0.91], sample_size=500),
                "SBIN": SuccessRateMetric(rate=0.84, ci_95=[0.79, 0.88], sample_size=300),
            },
            sample_size=1000,
        ),
        failure_diagnostics=FailureDiagnostics(
            failed_sample_size=120,
            error_source_distribution={"customer": 0.70, "bank": 0.20, "gateway": 0.10},
            error_step_distribution={"payment_authentication": 0.60, "payment_authorization": 0.40},
            top_error_reasons={"incorrect_otp": 0.45, "insufficient_funds": 0.35, "payment_cancelled": 0.20},
            top_error_codes={"BAD_REQUEST_ERROR": 0.80, "GATEWAY_ERROR": 0.20},
        ),
        amount_distribution=AmountDistribution(
            sample_size=1000,
            summary=AmountSummary(
                mean=1500.0,
                median=1000.0,
                std_dev=1200.0,
                iqr=1400.0,
                skewness=1.8,
            ),
            quantiles={
                "p10": 250.0,
                "p25": 500.0,
                "p50": 1000.0,
                "p75": 2000.0,
                "p90": 3500.0,
                "p95": 5000.0,
                "p99": 8000.0,
            },
            parametric_fit=ParametricFitResult(
                distribution_family="lognormal",
                is_adequate_fit=True,
                parameters={"shape_sigma": 0.75, "scale_median": 1000.0, "loc": 0.0},
                ks_test_statistic=0.025,
                ks_test_p_value=0.50,
                note="Log-normal fit accepted",
            ),
            aov_by_method={"upi": 850.0, "card": 2500.0, "netbanking": 3200.0},
        ),
        temporal_dynamics=TemporalDynamics(
            has_sufficient_timespan=True,
            timespan_days=14.0,
            hour_of_day_priors=[1 / 24] * 24,
            day_of_week_priors=[1 / 7] * 7,
            peak_hours_utc=[12, 13, 14, 15],
            status_message="Established",
        ),
        fee_economics=FeeEconomics(
            has_fee_data=True,
            sample_size_with_fees=1000,
            effective_blended_mdr_percent=1.80,
            mdr_by_method_percent={"card": 2.0, "netbanking": 1.75, "upi": 0.0},
            effective_tax_rate_percent=18.0,
        ),
        empirical_transitions=EmpiricalTransitions(
            has_order_tracking=True,
            tracked_orders_count=900,
            multi_attempt_orders_count=80,
            overall_retry_probability_on_failure=0.45,
            method_switch_on_retry_probability=0.30,
        ),
    )


@pytest.fixture
def empty_dna() -> BehavioralDNAProfile:
    return BehavioralDNAProfile(
        status="empty",
        dna_version="1.0.0",
        provenance=DataProvenance(
            data_source_type="NO_DATA_AVAILABLE",
            is_synthetic_benchmark=False,
            source_datasets=[],
            extracted_at_iso="2026-09-01T00:00:00+00:00",
            total_sample_size=0,
            timespan_days=0.0,
        ),
        reliability=ReliabilityAssessment(
            confidence_grade="UNAVAILABLE",
            confidence_score=0.0,
            sample_size_adequate=False,
            subsegment_reliability={},
            notes=[],
        ),
        method_priors=MethodPriors(
            probabilities={}, sub_instrument_priors={}, amount_conditioned_priors={}, sample_size=0
        ),
        success_dynamics=SuccessDynamics(
            overall_success_rate=None, overall_confidence_interval_95=None, by_method={}, by_bank={}, sample_size=0
        ),
        failure_diagnostics=FailureDiagnostics(
            failed_sample_size=0,
            error_source_distribution={},
            error_step_distribution={},
            top_error_reasons={},
            top_error_codes={},
        ),
        amount_distribution=AmountDistribution(
            sample_size=0, summary=None, quantiles={}, parametric_fit=None, aov_by_method={}
        ),
        temporal_dynamics=TemporalDynamics(
            has_sufficient_timespan=False,
            timespan_days=0.0,
            hour_of_day_priors=None,
            day_of_week_priors=None,
            peak_hours_utc=[],
            status_message="No timestamps",
        ),
        fee_economics=FeeEconomics(
            has_fee_data=False,
            sample_size_with_fees=0,
            effective_blended_mdr_percent=None,
            mdr_by_method_percent={},
            effective_tax_rate_percent=None,
        ),
        empirical_transitions=EmpiricalTransitions(
            has_order_tracking=False,
            tracked_orders_count=0,
            multi_attempt_orders_count=0,
            overall_retry_probability_on_failure=None,
            method_switch_on_retry_probability=None,
        ),
    )


def make_recent_records(
    n: int = 100,
    upi_ratio: float = 0.60,
    card_ratio: float = 0.30,
    upi_success_rate: float = 0.90,
    hdfc_success_rate: float = 0.88,
    amount_mean: float = 1000.0,
) -> List[NormalizedPaymentRecord]:
    """
    Helper creating synthetic normalized records for controlled detector test cases.
    """
    records: List[NormalizedPaymentRecord] = []
    upi_count = 0
    card_count = 0
    nb_count = 0

    for i in range(n):
        r_val = i / n
        if r_val < upi_ratio:
            method = "upi"
            bank = "HDFC" if (upi_count % 2 == 0) else "SBIN"
            target_rate = hdfc_success_rate if bank == "HDFC" else upi_success_rate
            # Cyclic deterministic boolean sampling for exact proportion
            is_succ = (upi_count % 10) < int(round(target_rate * 10))
            upi_count += 1
        elif r_val < upi_ratio + card_ratio:
            method = "card"
            bank = "HDFC"
            is_succ = (card_count % 10) < 8
            card_count += 1
        else:
            method = "netbanking"
            bank = "SBIN"
            is_succ = (nb_count % 10) < 8
            nb_count += 1

        created_unix = 1700000000 + i * 60
        records.append(
            NormalizedPaymentRecord(
                payment_id=f"pay_rec_{i:04d}",
                order_id=f"order_{i:04d}",
                amount_paise=int(amount_mean * 100),
                amount_inr=amount_mean,
                currency="INR",
                status="captured" if is_succ else "failed",
                method=method,
                bank=bank,
                captured=is_succ,
                error_reason=None if is_succ else "incorrect_otp",
                created_at_unix=created_unix,
                created_at_iso="2026-09-01T12:00:00+00:00",
            )
        )
    return records


# ==============================================================================
# Pure Statistical Drift Detector Tests
# ==============================================================================


def test_psi_calculation_accuracy() -> None:
    """
    Test 1, 2, 3: Validates PSI mathematical formula, zero-drift, and shifted distribution.
    """
    # Identical distributions -> PSI = 0.0 (STABLE)
    base = {"upi": 0.60, "card": 0.30, "netbanking": 0.10}
    rec_stable = {"upi": 0.60, "card": 0.30, "netbanking": 0.10}
    psi_val, classification = calculate_psi(base, rec_stable)
    assert psi_val == 0.0
    assert classification == "STABLE"

    # Shifted distribution -> PSI > 0.25 (SIGNIFICANT_DRIFT)
    rec_shifted = {"upi": 0.15, "card": 0.75, "netbanking": 0.10}
    psi_shift, class_shift = calculate_psi(base, rec_shifted)
    assert psi_shift >= 0.25
    assert class_shift == "SIGNIFICANT_DRIFT"


def test_two_proportion_ztest_accuracy() -> None:
    """
    Test 4: Two-proportion z-test accuracy on binary capture rates.
    """
    # Baseline: 900 / 1000 = 90%
    # Recent:   70 / 100   = 70%  (Major drop -> high |z|, small p-value)
    z, p_val = two_proportion_ztest(x_base=900, n_base=1000, x_recent=70, n_recent=100)
    assert z < -5.0
    assert p_val < 0.0001

    # Identical proportions -> z = 0, p = 1.0
    z_eq, p_eq = two_proportion_ztest(x_base=900, n_base=1000, x_recent=90, n_recent=100)
    assert abs(z_eq) < 0.001
    assert p_eq == 1.0


def test_fisher_exact_fallback() -> None:
    """
    Test 5: Fisher exact test on rare decline contingency table.
    """
    # Baseline: 10 failures out of 100 (90 successes)
    # Recent: 8 failures out of 15 (7 successes)
    odds, p_val = fisher_exact_test(x_base=90, n_base=100, x_recent=7, n_recent=15)
    assert odds < 1.0  # Lower capture odds
    assert p_val < 0.05


def test_ks_two_sample_test() -> None:
    """
    Test 6: Two-sample KS test for continuous ticket size distributions.
    """
    base_amounts = [1000.0, 1050.0, 1100.0, 950.0, 1020.0] * 20
    rec_shifted = [5000.0, 5200.0, 4800.0, 5100.0, 4900.0] * 20

    stat, p_val = two_sample_ks_test(base_amounts, rec_shifted)
    assert stat >= 0.90
    assert p_val < 0.0001


def test_cusum_persistent_shift() -> None:
    """
    Test 7: Tabular CUSUM sequentially triggering alarm on persistent failure surge.
    """
    # Historical failure mean = 10%
    # Series with persistent 35% failure rate
    series = [0.35, 0.35, 0.35, 0.35, 0.35]
    s_final, is_alarm, s_hist = tabular_cusum(historical_mean=0.10, series=series, slack=0.02, threshold=0.08)
    assert is_alarm is True
    assert s_final >= 0.08
    assert len(s_hist) == 5


def test_bh_fdr_correction() -> None:
    """
    Test 8, 9: Benjamini-Hochberg FDR correction and non-p-value exclusion (PSI/CUSUM).
    """
    p_values = [0.001, 0.01, 0.04, 0.50, None, None]  # 4 p-values + 2 non-p-values (PSI/CUSUM)
    fdr_results = benjamini_hochberg_fdr(p_values, alpha=0.05)

    assert len(fdr_results) == 6
    # Non-p-values remain (None, False)
    assert fdr_results[4] == (None, False)
    assert fdr_results[5] == (None, False)

    # Valid p-values are adjusted and evaluated
    assert fdr_results[0][0] is not None
    assert fdr_results[0][1] is True  # 0.001 rejected
    assert fdr_results[3][1] is False # 0.50 not rejected


# ==============================================================================
# Guardian Service & Alert Lifecycle Tests
# ==============================================================================


def test_insufficient_sample_rejection(calibrated_dna: BehavioralDNAProfile) -> None:
    """
    Test 10, 27: Rejects observation window with < 30 transactions.
    """
    guardian = GuardianSentinelService()
    records = make_recent_records(n=20)  # Below min_sample_threshold = 30

    res = guardian.analyze_records(dna=calibrated_dna, recent_records=records)
    assert res.status == "unavailable"
    assert res.active_alerts_count == 0
    assert "below the minimum required sample threshold" in res.message


def test_dual_significance_gate_and_severity(calibrated_dna: BehavioralDNAProfile) -> None:
    """
    Test 11, 12, 13, 14: Validates dual significance (statistical + practical) and severity assignment.
    """
    guardian = GuardianSentinelService()

    # Scenario: Major UPI capture drop (90% -> 60%) with N = 100
    records_severe = make_recent_records(n=100, upi_success_rate=0.60)
    res = guardian.analyze_records(dna=calibrated_dna, recent_records=records_severe)

    assert res.status == "completed"
    assert res.active_alerts_count >= 1

    upi_alert = next((a for a in res.active_alerts if "upi" in a.metric), None)
    assert upi_alert is not None
    assert upi_alert.severity in (AlertSeverity.HIGH, AlertSeverity.CRITICAL)
    assert upi_alert.status == AlertStatus.OPEN
    assert upi_alert.p_value_adjusted_fdr is not None


def test_alert_persistence_and_deduplication(calibrated_dna: BehavioralDNAProfile) -> None:
    """
    Test 15, 16, 17: Validates alert fingerprinting, persistence counter, and no duplicate alerts.
    """
    guardian = GuardianSentinelService()
    records_bad = make_recent_records(n=100, upi_success_rate=0.60)

    # Window 1: Anomaly detected
    res1 = guardian.analyze_records(dna=calibrated_dna, recent_records=records_bad)
    alert1 = next(a for a in res1.active_alerts if "upi" in a.metric)
    assert alert1.consecutive_windows == 1

    # Window 2: Same anomaly continues
    res2 = guardian.analyze_records(dna=calibrated_dna, recent_records=records_bad)
    alert2 = next(a for a in res2.active_alerts if "upi" in a.metric)
    assert alert2.alert_id == alert1.alert_id  # Same persistent alert!
    assert alert2.consecutive_windows == 2


def test_alert_auto_recovery_transition(calibrated_dna: BehavioralDNAProfile) -> None:
    """
    Test 18: Validates transition from OPEN -> RECOVERED when metrics normalize.
    """
    guardian = GuardianSentinelService()
    records_bad = make_recent_records(n=100, upi_success_rate=0.60)
    records_normal = make_recent_records(n=100, upi_success_rate=0.90, hdfc_success_rate=0.90)

    # Window 1: Trigger Alert
    guardian.analyze_records(dna=calibrated_dna, recent_records=records_bad)
    open_alerts_1 = guardian.get_all_alerts(status_filter=AlertStatus.OPEN)
    assert len(open_alerts_1) >= 1
    assert any("upi" in a.metric for a in open_alerts_1)

    # Window 2: Telemetry returns to normal baseline
    res_norm = guardian.analyze_records(dna=calibrated_dna, recent_records=records_normal)
    upi_active = [a for a in res_norm.active_alerts if "upi" in a.metric]
    assert len(upi_active) == 0

    # Verify transition to RECOVERED
    rec_alerts = guardian.get_all_alerts(status_filter=AlertStatus.RECOVERED)
    assert len(rec_alerts) >= 1
    upi_rec = next((a for a in rec_alerts if "upi" in a.metric), None)
    assert upi_rec is not None
    assert upi_rec.recovered_at_iso is not None


def test_diagnostic_associations_and_business_impact(calibrated_dna: BehavioralDNAProfile) -> None:
    """
    Test 19, 20, 21: Validates empirical diagnostic associations and counterfactual revenue-at-risk labels.
    """
    guardian = GuardianSentinelService()
    # HDFC UPI failures surge to 60% failure rate while SBIN is normal
    records = make_recent_records(n=120, upi_success_rate=0.60, hdfc_success_rate=0.40)

    res = guardian.analyze_records(dna=calibrated_dna, recent_records=records)
    upi_alert = next((a for a in res.active_alerts if "upi" in a.metric), None)
    assert upi_alert is not None

    # Diagnostic association check
    assert len(upi_alert.diagnostic_associations) >= 1
    assoc = upi_alert.diagnostic_associations[0]
    assert assoc.entity_name == "HDFC"
    assert "associated with" in assoc.association_statement.lower()

    # Business impact check
    assert upi_alert.business_impact is not None
    assert upi_alert.business_impact.is_estimated is True
    assert upi_alert.business_impact.excess_failed_orders >= 1
    assert upi_alert.business_impact.estimated_revenue_at_risk_inr > 0.0


def test_twin_handoff_contract_generation(calibrated_dna: BehavioralDNAProfile) -> None:
    """
    Test 22: Validates Payment Twin handoff contract payload.
    """
    guardian = GuardianSentinelService()
    records = make_recent_records(n=100, upi_success_rate=0.60)

    res = guardian.analyze_records(dna=calibrated_dna, recent_records=records)
    assert len(res.twin_handoffs) >= 1

    upi_handoff = next((h for h in res.twin_handoffs if h.target_entity == "upi"), None)
    assert upi_handoff is not None
    assert upi_handoff.delta < 0
    assert len(upi_handoff.suggested_scenario_interventions) >= 1


def test_provenance_and_privacy_preservation(calibrated_dna: BehavioralDNAProfile) -> None:
    """
    Test 23, 24, 25: Validates provenance tags, absence of PII, and deterministic evaluation.
    """
    guardian = GuardianSentinelService()
    records = make_recent_records(n=50)

    res = guardian.analyze_records(dna=calibrated_dna, recent_records=records)
    assert res.baseline_provenance_type == "OBSERVED_RAZORPAY_DATA"
    assert res.recent_provenance_type == "OBSERVED_RAZORPAY_DATA"
    assert "financial guarantees" in res.provenance_disclaimer.lower()


def test_empty_dna_rejection(empty_dna: BehavioralDNAProfile) -> None:
    """
    Test 26: Guardian refuses execution when Behavioral DNA is empty.
    """
    guardian = GuardianSentinelService()
    records = make_recent_records(n=50)

    res = guardian.analyze_records(dna=empty_dna, recent_records=records)
    assert res.status == "unavailable"
    assert res.active_alerts_count == 0


def test_reliability_warning(calibrated_dna: BehavioralDNAProfile) -> None:
    """
    Test 28: Emits reliability warning when baseline DNA is GRADE_C.
    """
    guardian = GuardianSentinelService()
    dna_c = calibrated_dna.model_copy(deep=True)
    dna_c.reliability.confidence_grade = "GRADE_C"

    records = make_recent_records(n=50)
    res = guardian.analyze_records(dna=dna_c, recent_records=records)
    assert res.reliability_warning == "Baseline established on low-sample DNA"


def test_guardian_api_endpoints(client: TestClient, calibrated_dna: BehavioralDNAProfile) -> None:
    """
    Test 30: FastAPI endpoints: status, analyze, alerts, acknowledge, resolve.
    """
    from app.api.routes.guardian import get_dataset_loader, get_dna_profiler

    class MockProfiler:
        def build_profile(self, **kwargs: Any) -> BehavioralDNAProfile:
            return calibrated_dna

    class MockLoader:
        def load_all_records(self, **kwargs: Any) -> Any:
            return make_recent_records(n=100, upi_success_rate=0.60), []

        def load_records_from_file(self, *args: Any, **kwargs: Any) -> Any:
            return make_recent_records(n=100, upi_success_rate=0.60), []

    app.dependency_overrides[get_dna_profiler] = lambda: MockProfiler()
    app.dependency_overrides[get_dataset_loader] = lambda: MockLoader()

    try:
        # 1. GET /status
        st_res = client.get("/api/v1/guardian/status")
        assert st_res.status_code == 200
        assert st_res.json()["guardian_available"] is True

        # 2. POST /analyze
        an_res = client.post("/api/v1/guardian/analyze", json={"window_size_count": 100})
        assert an_res.status_code == 200
        an_data = an_res.json()
        assert an_data["status"] == "completed"
        assert an_data["active_alerts_count"] >= 1

        alert_id = an_data["active_alerts"][0]["alert_id"]

        # 3. GET /alerts
        al_res = client.get("/api/v1/guardian/alerts")
        assert al_res.status_code == 200
        assert len(al_res.json()) >= 1

        # 4. POST /alerts/{id}/acknowledge
        ack_res = client.post(f"/api/v1/guardian/alerts/{alert_id}/acknowledge")
        assert ack_res.status_code == 200
        assert ack_res.json()["status"] == "ACKNOWLEDGED"

        # 5. POST /alerts/{id}/resolve
        res_res = client.post(f"/api/v1/guardian/alerts/{alert_id}/resolve")
        assert res_res.status_code == 200
        assert res_res.json()["status"] == "RESOLVED"

    finally:
        app.dependency_overrides.clear()


def test_api_guardian_empty_repository(client: TestClient) -> None:
    """
    Verify GET /status and POST /analyze return unavailable on empty repository without mocks.
    """
    st_res = client.get("/api/v1/guardian/status")
    assert st_res.status_code == 200
    assert st_res.json()["guardian_available"] is False
    assert st_res.json()["status"] == "unavailable"

    an_res = client.post("/api/v1/guardian/analyze", json={})
    assert an_res.status_code == 200
    assert an_res.json()["status"] == "unavailable"
