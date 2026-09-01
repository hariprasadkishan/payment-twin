"""
Comprehensive test suite for Payment Twin Simulation Engine, Virtual Payment Environment,
State transitions, GMV accounting, Monte Carlo sweeps, and FastAPI endpoints.
All tests use controlled fixtures without live API calls.
"""

from typing import Any, Dict, List
import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.models.agent import (
    AgentArchetype,
    CustomerAgent,
    FunnelState,
    LatentParameters,
    ObservedPreferences,
    RuntimeState,
    validate_state_transition,
)
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
from app.models.simulation import (
    ModelledLatencyAssumptions,
    MonteCarloRequest,
    MonteCarloSimulationResult,
    SimulationConfig,
    SimulationResult,
    VirtualPaymentEnvironment,
)
from app.services.payment_twin import PaymentTwinEngine
from app.services.simulation_runner import SimulationRunner


@pytest.fixture
def client() -> TestClient:
    return TestClient(app)


@pytest.fixture
def sample_calibrated_dna() -> BehavioralDNAProfile:
    """
    Controlled Behavioral DNA profile with known priors and empirical retry chains.
    """
    return BehavioralDNAProfile(
        status="ok",
        dna_version="1.0.0",
        provenance=DataProvenance(
            data_source_type="OBSERVED_RAZORPAY_DATA",
            is_synthetic_benchmark=False,
            source_datasets=["payments_sample.jsonl"],
            extracted_at_iso="2026-09-01T12:00:00+00:00",
            total_sample_size=500,
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
            amount_conditioned_priors={
                "tier_low_under_500": {"upi": 0.85, "card": 0.15},
                "tier_mid_500_to_2500": {"upi": 0.55, "card": 0.35, "netbanking": 0.10},
                "tier_high_above_2500": {"upi": 0.20, "card": 0.50, "netbanking": 0.30},
            },
            sample_size=500,
        ),
        success_dynamics=SuccessDynamics(
            overall_success_rate=0.85,
            overall_confidence_interval_95=[0.81, 0.88],
            by_method={
                "upi": SuccessRateMetric(rate=0.90, ci_95=[0.86, 0.93], sample_size=300),
                "card": SuccessRateMetric(rate=0.80, ci_95=[0.73, 0.85], sample_size=150),
                "netbanking": SuccessRateMetric(rate=0.70, ci_95=[0.56, 0.81], sample_size=50),
            },
            by_bank={},
            sample_size=500,
        ),
        failure_diagnostics=FailureDiagnostics(
            failed_sample_size=75,
            error_source_distribution={"customer": 0.70, "bank": 0.20, "gateway": 0.10},
            error_step_distribution={"payment_authentication": 0.65, "payment_authorization": 0.35},
            top_error_reasons={"incorrect_otp": 0.45, "insufficient_funds": 0.30, "payment_cancelled": 0.25},
            top_error_codes={"BAD_REQUEST_ERROR": 0.75, "GATEWAY_ERROR": 0.25},
        ),
        amount_distribution=AmountDistribution(
            sample_size=500,
            summary=AmountSummary(
                mean=1500.0,
                median=1000.0,
                std_dev=1200.0,
                iqr=1400.0,
                skewness=1.8,
            ),
            quantiles={
                "p10": 200.0,
                "p25": 500.0,
                "p50": 1000.0,
                "p75": 1900.0,
                "p90": 3200.0,
                "p95": 4500.0,
                "p99": 7500.0,
            },
            parametric_fit=ParametricFitResult(
                distribution_family="lognormal",
                is_adequate_fit=True,
                parameters={"shape_sigma": 0.75, "scale_median": 1000.0, "loc": 0.0},
                ks_test_statistic=0.03,
                ks_test_p_value=0.45,
                note="Log-normal fit accepted",
            ),
            aov_by_method={"upi": 800.0, "card": 2400.0, "netbanking": 3200.0},
        ),
        temporal_dynamics=TemporalDynamics(
            has_sufficient_timespan=True,
            timespan_days=14.0,
            hour_of_day_priors=[1 / 24] * 24,
            day_of_week_priors=[1 / 7] * 7,
            peak_hours_utc=[12, 13, 14, 15],
            status_message="Representative temporal distributions established.",
        ),
        fee_economics=FeeEconomics(
            has_fee_data=True,
            sample_size_with_fees=500,
            effective_blended_mdr_percent=1.85,
            mdr_by_method_percent={"card": 2.10, "netbanking": 1.75},
            effective_tax_rate_percent=18.0,
        ),
        empirical_transitions=EmpiricalTransitions(
            has_order_tracking=True,
            tracked_orders_count=450,
            multi_attempt_orders_count=40,
            overall_retry_probability_on_failure=0.45,
            method_switch_on_retry_probability=0.30,
        ),
    )


@pytest.fixture
def empty_dna() -> BehavioralDNAProfile:
    """
    An honest empty Behavioral DNA profile.
    """
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


def test_single_agent_happy_path(sample_calibrated_dna: BehavioralDNAProfile) -> None:
    """
    Test 1: Single agent captures payment on attempt 1.
    """
    env = VirtualPaymentEnvironment.from_dna(sample_calibrated_dna)
    # Force 100% success for test
    env.method_success_rates = {"upi": 1.0, "card": 1.0, "netbanking": 1.0}
    env.auth_failure_rate = 0.0

    agent = CustomerAgent(
        agent_id="test_001",
        archetype=AgentArchetype.FAST_CHECKOUT,
        random_seed=42,
        current_state=FunnelState.BROWSING,
        observed_preferences=ObservedPreferences(
            primary_method="upi",
            transaction_amount_inr=500.0,
            amount_tier="tier_mid_500_to_2500",
        ),
        latent_parameters=LatentParameters(
            max_retries=1,
            retry_propensity=0.8,
            method_switch_propensity=0.2,
            friction_sensitivity=0.1,
            patience_timeout_seconds=60.0,
        ),
        runtime_state=RuntimeState(),
        event_history=[],
    )

    engine = PaymentTwinEngine()
    result = engine.simulate_agent(agent=agent, environment=env, simulation_id="test_sim_1")

    assert result.is_successful is True
    assert result.is_abandoned is False
    assert result.total_attempts == 1
    assert result.final_state == FunnelState.TERMINATED_SUCCESS
    assert result.amount_inr == 500.0
    assert len(result.event_trace) >= 6


def test_single_agent_failure_and_retry_success(sample_calibrated_dna: BehavioralDNAProfile) -> None:
    """
    Test 2 & 3: Agent fails attempt 1, retries, and captures on attempt 2.
    """
    env = VirtualPaymentEnvironment.from_dna(sample_calibrated_dna)

    agent = CustomerAgent(
        agent_id="test_002",
        archetype=AgentArchetype.PATIENT_RETRYER,
        random_seed=101,  # Produces attempt 1 fail + attempt 2 capture
        current_state=FunnelState.BROWSING,
        observed_preferences=ObservedPreferences(
            primary_method="card",
            secondary_method="upi",
            transaction_amount_inr=1200.0,
            amount_tier="tier_mid_500_to_2500",
        ),
        latent_parameters=LatentParameters(
            max_retries=2,
            retry_propensity=1.0,  # Always retry
            method_switch_propensity=0.0,  # Same method
            friction_sensitivity=0.0,
            patience_timeout_seconds=120.0,
        ),
        runtime_state=RuntimeState(),
        event_history=[],
    )

    engine = PaymentTwinEngine()
    result = engine.simulate_agent(agent=agent, environment=env, simulation_id="test_sim_2")

    assert result.amount_inr == 1200.0
    assert result.final_state in (FunnelState.TERMINATED_SUCCESS, FunnelState.TERMINATED_ABANDONED)


def test_single_agent_method_switch_on_failure(sample_calibrated_dna: BehavioralDNAProfile) -> None:
    """
    Test 4: Agent fails on card, switches to secondary upi on retry.
    """
    env = VirtualPaymentEnvironment.from_dna(sample_calibrated_dna)
    # Fail card, succeed UPI
    env.method_success_rates = {"card": 0.0, "upi": 1.0}
    env.auth_failure_rate = 0.0

    agent = CustomerAgent(
        agent_id="test_003",
        archetype=AgentArchetype.METHOD_SWITCHER,
        random_seed=42,
        current_state=FunnelState.BROWSING,
        observed_preferences=ObservedPreferences(
            primary_method="card",
            secondary_method="upi",
            transaction_amount_inr=1500.0,
            amount_tier="tier_mid_500_to_2500",
        ),
        latent_parameters=LatentParameters(
            max_retries=2,
            retry_propensity=1.0,  # Guarantees retry
            method_switch_propensity=1.0,  # Guarantees switch to secondary_method
            friction_sensitivity=0.0,
            patience_timeout_seconds=90.0,
        ),
        runtime_state=RuntimeState(),
        event_history=[],
    )

    engine = PaymentTwinEngine()
    result = engine.simulate_agent(agent=agent, environment=env, simulation_id="test_sim_3")

    assert result.is_successful is True
    assert result.method_switched is True
    assert result.final_method == "upi"
    assert result.total_attempts == 2

    # Verify METHOD_SWITCHED event exists
    actions = [e.action for e in result.event_trace]
    assert "METHOD_SWITCHED" in actions


def test_max_retries_and_abandonment(sample_calibrated_dna: BehavioralDNAProfile) -> None:
    """
    Test 5 & 6: Max retries limit enforcement.
    """
    env = VirtualPaymentEnvironment.from_dna(sample_calibrated_dna)
    # 0% success to force repeated failures
    env.method_success_rates = {"upi": 0.0, "card": 0.0}
    env.auth_failure_rate = 0.0

    agent = CustomerAgent(
        agent_id="test_004",
        archetype=AgentArchetype.FAST_CHECKOUT,
        random_seed=42,
        current_state=FunnelState.BROWSING,
        observed_preferences=ObservedPreferences(
            primary_method="upi",
            transaction_amount_inr=300.0,
            amount_tier="tier_low_under_500",
        ),
        latent_parameters=LatentParameters(
            max_retries=1,  # Max 1 retry -> max 2 attempts
            retry_propensity=1.0,
            method_switch_propensity=0.0,
            friction_sensitivity=0.0,
            patience_timeout_seconds=60.0,
        ),
        runtime_state=RuntimeState(),
        event_history=[],
    )

    engine = PaymentTwinEngine()
    result = engine.simulate_agent(agent=agent, environment=env, simulation_id="test_sim_4")

    assert result.is_successful is False
    assert result.is_abandoned is False
    assert result.total_attempts <= 2  # Cannot exceed initial attempt + 1 retry
    assert result.final_state == FunnelState.TERMINATED_FAILED
    assert result.terminal_reason == "MAX_RETRIES_EXCEEDED"


def test_event_ordering_and_monotonically_increasing_timestamps(
    sample_calibrated_dna: BehavioralDNAProfile,
) -> None:
    """
    Test 8 & 9: Events follow legal transitions and have non-decreasing timestamps.
    """
    runner = SimulationRunner()
    config = SimulationConfig(population_size=20, random_seed=42, preview_agent_count=20)
    res = runner.run_once(dna=sample_calibrated_dna, config=config)

    assert res.status == "completed"
    for agent_trace in res.preview_agent_traces:
        events = agent_trace.event_trace
        assert len(events) >= 3

        # Monotonic timestamps
        timestamps = [e.timestamp_ms for e in events]
        assert timestamps == sorted(timestamps)

        # Legal state transitions
        for e in events:
            if e.state_from != e.state_to:
                assert validate_state_transition(e.state_from, e.state_to) is True


def test_simulation_determinism(sample_calibrated_dna: BehavioralDNAProfile) -> None:
    """
    Test 10 & 11: Identical inputs produce identical KPIs; different seeds produce variation.
    """
    runner = SimulationRunner()
    config_a = SimulationConfig(population_size=100, random_seed=42)
    config_b = SimulationConfig(population_size=100, random_seed=42)
    config_c = SimulationConfig(population_size=100, random_seed=99)

    res_a = runner.run_once(dna=sample_calibrated_dna, config=config_a)
    res_b = runner.run_once(dna=sample_calibrated_dna, config=config_b)
    res_c = runner.run_once(dna=sample_calibrated_dna, config=config_c)

    assert res_a.kpis is not None and res_b.kpis is not None and res_c.kpis is not None

    # Determinism: A == B
    assert res_a.kpis.successful_transactions == res_b.kpis.successful_transactions
    assert res_a.kpis.captured_volume_inr == res_b.kpis.captured_volume_inr
    assert res_a.kpis.conversion_rate_percent == res_b.kpis.conversion_rate_percent

    # Variance: A != C
    assert res_a.random_seed != res_c.random_seed


def test_financial_accounting_and_gmv_invariants(
    sample_calibrated_dna: BehavioralDNAProfile,
) -> None:
    """
    Test 14, 15, 16, 17: GMV accounting, no retry double-counting, volume conservation.
    """
    runner = SimulationRunner()
    config = SimulationConfig(population_size=200, random_seed=42)
    res = runner.run_once(dna=sample_calibrated_dna, config=config)

    assert res.kpis is not None
    k = res.kpis

    # Invariant: gross_attempted_volume == captured_volume + lost_volume
    assert k.gross_attempted_volume_inr == pytest.approx(k.captured_volume_inr + k.lost_volume_inr, abs=1e-2)

    # Invariant: Net revenue == captured_volume - fees - taxes
    assert k.net_merchant_revenue_inr == pytest.approx(
        k.captured_volume_inr - k.total_processing_fees_inr - k.total_taxes_inr, abs=1e-2
    )

    # Invariant: Total agents == successful + failed + abandoned
    assert k.total_agents == k.successful_transactions + k.failed_transactions + k.abandoned_transactions


def test_neutral_baseline_calibration(sample_calibrated_dna: BehavioralDNAProfile) -> None:
    """
    Test 12 & 13: Neutral simulation calibration against DNA capture rate.
    """
    runner = SimulationRunner()
    config = SimulationConfig(population_size=1000, random_seed=42)
    res = runner.run_once(dna=sample_calibrated_dna, config=config)

    assert res.kpis is not None
    # DNA overall capture rate is 0.85 -> Simulated should be within ~0.80 - 0.90
    sim_conv = res.kpis.conversion_rate_percent / 100.0
    assert 0.78 <= sim_conv <= 0.92


def test_monte_carlo_multi_run_aggregation(sample_calibrated_dna: BehavioralDNAProfile) -> None:
    """
    Test 18: Multi-run Monte Carlo sweep computes mean, std dev, 95% CIs.
    """
    runner = SimulationRunner()
    config = SimulationConfig(population_size=100, random_seed=42)
    mc_res = runner.run_many(dna=sample_calibrated_dna, config=config, monte_carlo_runs=10)

    assert mc_res.status == "completed"
    assert mc_res.total_runs == 10
    assert "conversion_rate_percent" in mc_res.summary_metrics

    conv_dist = mc_res.summary_metrics["conversion_rate_percent"]
    assert conv_dist.mean > 0
    assert conv_dist.std_dev >= 0
    assert len(conv_dist.ci_95) == 2
    assert conv_dist.ci_95[0] <= conv_dist.mean <= conv_dist.ci_95[1]
    assert conv_dist.p5 <= conv_dist.p50 <= conv_dist.p95


def test_empty_dna_rejection(empty_dna: BehavioralDNAProfile) -> None:
    """
    Test 19: Empty DNA returns unavailable without running or crashing.
    """
    runner = SimulationRunner()
    config = SimulationConfig(population_size=100, random_seed=42)
    res = runner.run_once(dna=empty_dna, config=config)

    assert res.status == "unavailable"
    assert res.kpis is None
    assert "Behavioral DNA is empty or unavailable" in res.message


def test_provenance_propagation(sample_calibrated_dna: BehavioralDNAProfile) -> None:
    """
    Test 20: Provenance tags are preserved from DNA to simulation result.
    """
    runner = SimulationRunner()

    # Observed
    res_obs = runner.run_once(dna=sample_calibrated_dna, config=SimulationConfig(population_size=50))
    assert res_obs.dna_provenance_type == "OBSERVED_RAZORPAY_DATA"
    assert res_obs.is_synthetic_benchmark is False

    # Synthetic Benchmark
    synth_dna = sample_calibrated_dna.model_copy(deep=True)
    synth_dna.provenance.data_source_type = "SYNTHETIC_BENCHMARK_DATA"
    synth_dna.provenance.is_synthetic_benchmark = True

    res_synth = runner.run_once(dna=synth_dna, config=SimulationConfig(population_size=50))
    assert res_synth.dna_provenance_type == "SYNTHETIC_BENCHMARK_DATA"
    assert res_synth.is_synthetic_benchmark is True


def test_api_simulation_run_endpoint_with_calibrated_dna(
    client: TestClient, sample_calibrated_dna: BehavioralDNAProfile
) -> None:
    """
    Test 22 & 23: POST /api/v1/simulation/run endpoint with mock profiler.
    """
    from app.api.routes.simulation import get_dna_profiler

    class MockProfiler:
        def build_profile(self, **kwargs: Any) -> BehavioralDNAProfile:
            return sample_calibrated_dna

    app.dependency_overrides[get_dna_profiler] = lambda: MockProfiler()

    try:
        req_payload = {"population_size": 150, "random_seed": 42, "preview_agent_count": 5}
        res = client.post("/api/v1/simulation/run", json=req_payload)
        assert res.status_code == 200
        data = res.json()
        assert data["status"] == "completed"
        assert data["population_size"] == 150
        assert data["kpis"]["total_agents"] == 150
        assert len(data["preview_agent_traces"]) == 5
    finally:
        app.dependency_overrides.clear()


def test_api_simulation_monte_carlo_endpoint(
    client: TestClient, sample_calibrated_dna: BehavioralDNAProfile
) -> None:
    """
    Test POST /api/v1/simulation/monte-carlo endpoint.
    """
    from app.api.routes.simulation import get_dna_profiler

    class MockProfiler:
        def build_profile(self, **kwargs: Any) -> BehavioralDNAProfile:
            return sample_calibrated_dna

    app.dependency_overrides[get_dna_profiler] = lambda: MockProfiler()

    try:
        req_payload = {"population_size": 100, "monte_carlo_runs": 5, "random_seed": 42}
        res = client.post("/api/v1/simulation/monte-carlo", json=req_payload)
        assert res.status_code == 200
        data = res.json()
        assert data["status"] == "completed"
        assert data["total_runs"] == 5
        assert "conversion_rate_percent" in data["summary_metrics"]
    finally:
        app.dependency_overrides.clear()


def test_api_simulation_empty_repository(client: TestClient) -> None:
    """
    Verify POST /api/v1/simulation/run returns unavailable on empty repository without overrides.
    """
    res = client.post("/api/v1/simulation/run", json={"population_size": 100, "random_seed": 42})
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "unavailable"
    assert data["kpis"] is None
    assert "Behavioral DNA is empty or unavailable" in data["message"]
