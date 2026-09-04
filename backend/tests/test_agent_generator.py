"""
Comprehensive test suite for CustomerAgent models, state machine transitions,
AgentPopulationGenerator service, calibration invariants, and FastAPI endpoints.
All tests use controlled fixtures without live API calls.
"""

from pathlib import Path
from typing import Any, Dict, List
import numpy as np
import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.models.agent import (
    AgentArchetype,
    AgentGenerationRequest,
    AgentGenerationResponse,
    CustomerAgent,
    FunnelState,
    VALID_STATE_TRANSITIONS,
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
from app.services.agent_generator import AgentPopulationGenerator
from app.services.dataset_reader import DatasetLoaderService
from app.services.dna_profiler import BehavioralDNAProfiler


@pytest.fixture
def client() -> TestClient:
    return TestClient(app)


@pytest.fixture
def sample_calibrated_dna() -> BehavioralDNAProfile:
    """
    A controlled Behavioral DNA profile with known priors and empirical retry chains.
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
    profiler = BehavioralDNAProfiler()
    return profiler._build_empty_profile(
        now_iso="2026-09-01T00:00:00+00:00", source_files=[], is_synthetic=False
    )


def test_state_machine_valid_and_invalid_transitions() -> None:
    """
    Validate legal state transitions and rejection of illegal leaps.
    """
    # Legal transitions
    assert validate_state_transition(FunnelState.BROWSING, FunnelState.CHECKOUT_OPENED) is True
    assert validate_state_transition(FunnelState.CHECKOUT_OPENED, FunnelState.METHOD_SELECTED) is True
    assert validate_state_transition(FunnelState.METHOD_SELECTED, FunnelState.AUTHENTICATING) is True
    assert validate_state_transition(FunnelState.AUTHENTICATING, FunnelState.PROCESSING) is True
    assert validate_state_transition(FunnelState.PROCESSING, FunnelState.SUCCESS) is True
    assert validate_state_transition(FunnelState.SUCCESS, FunnelState.TERMINATED_SUCCESS) is True

    # Retry loops
    assert validate_state_transition(FunnelState.PROCESSING, FunnelState.FAILED) is True
    assert validate_state_transition(FunnelState.FAILED, FunnelState.RETRY_EVALUATION) is True
    assert validate_state_transition(FunnelState.RETRY_EVALUATION, FunnelState.METHOD_SELECTED) is True
    assert validate_state_transition(FunnelState.RETRY_EVALUATION, FunnelState.ABANDONED) is True

    # Illegal transitions
    assert validate_state_transition(FunnelState.BROWSING, FunnelState.SUCCESS) is False
    assert validate_state_transition(FunnelState.TERMINATED_SUCCESS, FunnelState.BROWSING) is False
    assert validate_state_transition(FunnelState.TERMINATED_ABANDONED, FunnelState.PROCESSING) is False


def test_customer_agent_transition_to_method(sample_calibrated_dna: BehavioralDNAProfile) -> None:
    """
    Validate that customer agent state changes record event history and terminate cleanly.
    """
    generator = AgentPopulationGenerator()
    resp = generator.generate_population(sample_calibrated_dna, population_size=1, random_seed=42)
    assert resp.status == "ok"
    agent = resp.preview_agents[0]

    assert agent.current_state == FunnelState.BROWSING
    assert len(agent.event_history) == 0

    # Execute valid path
    assert agent.transition_to(FunnelState.CHECKOUT_OPENED, "OPEN_CHECKOUT") is True
    assert agent.current_state == FunnelState.CHECKOUT_OPENED
    assert len(agent.event_history) == 1

    # Attempt illegal transition
    assert agent.transition_to(FunnelState.SUCCESS, "ILLEGAL_LEAP") is False
    assert agent.current_state == FunnelState.CHECKOUT_OPENED


def test_deterministic_generation(sample_calibrated_dna: BehavioralDNAProfile) -> None:
    """
    Verify that identical inputs produce byte-identical agents deterministically.
    """
    generator = AgentPopulationGenerator()
    resp1 = generator.generate_population(sample_calibrated_dna, population_size=50, random_seed=123)
    resp2 = generator.generate_population(sample_calibrated_dna, population_size=50, random_seed=123)

    assert resp1.status == "ok" and resp2.status == "ok"
    assert resp1.total_generated_count == 50
    assert resp2.total_generated_count == 50

    for a1, a2 in zip(resp1.preview_agents, resp2.preview_agents):
        assert a1.agent_id == a2.agent_id
        assert a1.archetype == a2.archetype
        assert a1.observed_preferences == a2.observed_preferences
        assert a1.latent_parameters == a2.latent_parameters


def test_different_seeds_produce_distinct_agents(sample_calibrated_dna: BehavioralDNAProfile) -> None:
    """
    Changing the seed produces different individual agents.
    """
    generator = AgentPopulationGenerator()
    resp1 = generator.generate_population(sample_calibrated_dna, population_size=10, random_seed=42)
    resp2 = generator.generate_population(sample_calibrated_dna, population_size=10, random_seed=99)

    assert resp1.preview_agents[0].agent_id != resp2.preview_agents[0].agent_id
    assert resp1.preview_agents[0].random_seed != resp2.preview_agents[0].random_seed


def test_population_sizing_and_bounds_validation(sample_calibrated_dna: BehavioralDNAProfile) -> None:
    """
    Verify population sizing contracts and rejection of invalid bounds.
    """
    generator = AgentPopulationGenerator()

    for size in [1, 50, 500, 1000]:
        resp = generator.generate_population(sample_calibrated_dna, population_size=size, preview_count=10)
        assert resp.status == "ok"
        assert resp.total_generated_count == size
        assert len(resp.preview_agents) == min(10, size)

    # Invalid sizes raise ValueError
    with pytest.raises(ValueError):
        generator.generate_population(sample_calibrated_dna, population_size=0)

    with pytest.raises(ValueError):
        generator.generate_population(sample_calibrated_dna, population_size=-10)

    with pytest.raises(ValueError):
        generator.generate_population(sample_calibrated_dna, population_size=15000)


def test_agent_parameter_bounds(sample_calibrated_dna: BehavioralDNAProfile) -> None:
    """
    Validate that all generated agent parameters stay strictly within mathematical bounds.
    """
    generator = AgentPopulationGenerator()
    resp = generator.generate_population(sample_calibrated_dna, population_size=200, random_seed=42, preview_count=200)

    for agent in resp.preview_agents:
        # Observed
        assert agent.observed_preferences.transaction_amount_inr > 0.0
        assert agent.observed_preferences.primary_method in ("upi", "card", "netbanking")
        assert agent.observed_preferences.amount_tier in ("tier_low_under_500", "tier_mid_500_to_2500", "tier_high_above_2500")

        # Latent
        lp = agent.latent_parameters
        assert 0.0 <= lp.retry_propensity <= 1.0
        assert 0.0 <= lp.method_switch_propensity <= 1.0
        assert 0.0 <= lp.friction_sensitivity <= 1.0
        assert 1.0 <= lp.patience_timeout_seconds <= 300.0
        assert 0 <= lp.max_retries <= 5


def test_method_distribution_calibration(sample_calibrated_dna: BehavioralDNAProfile) -> None:
    """
    Verify that generated population closely reproduces the DNA's method distribution (MAE <= 0.05 for N=1000).
    """
    generator = AgentPopulationGenerator()
    resp = generator.generate_population(sample_calibrated_dna, population_size=1000, random_seed=42)

    assert resp.status == "ok"
    assert resp.calibration_diagnostics is not None
    assert resp.calibration_diagnostics.is_calibrated is True
    assert resp.calibration_diagnostics.method_distribution_mae is not None
    assert resp.calibration_diagnostics.method_distribution_mae <= 0.05


def test_retry_and_switch_calibration(sample_calibrated_dna: BehavioralDNAProfile) -> None:
    """
    Verify that population retry and switch propensities calibrate around DNA empirical values.
    """
    generator = AgentPopulationGenerator()
    resp = generator.generate_population(sample_calibrated_dna, population_size=500, random_seed=42, preview_count=500)

    assert resp.status == "ok"
    diag = resp.calibration_diagnostics
    assert diag is not None
    assert diag.retry_rate_drift is not None
    assert diag.retry_rate_drift <= 0.08  # Mean retry propensity within 8% of target 0.45

    # Check that agents are marked as calibrated
    assert resp.preview_agents[0].latent_parameters.is_retry_calibrated is True
    assert resp.preview_agents[0].latent_parameters.is_method_switch_calibrated is True


def test_empty_dna_rejection(empty_dna: BehavioralDNAProfile) -> None:
    """
    Empty Behavioral DNA must be rejected with 'unavailable' status and 0 agents.
    """
    generator = AgentPopulationGenerator()
    resp = generator.generate_population(empty_dna, population_size=100)

    assert resp.status == "unavailable"
    assert resp.total_generated_count == 0
    assert resp.preview_agents == []
    assert "Behavioral DNA is empty or unavailable" in resp.message


def test_provenance_inheritance(sample_calibrated_dna: BehavioralDNAProfile) -> None:
    """
    Verify that population metadata inherits source DNA provenance accurately.
    """
    generator = AgentPopulationGenerator()

    # Observed
    resp_obs = generator.generate_population(sample_calibrated_dna, population_size=10)
    assert resp_obs.population_metadata is not None
    assert resp_obs.population_metadata.dna_provenance_type == "OBSERVED_RAZORPAY_DATA"
    assert resp_obs.population_metadata.is_synthetic_benchmark is False

    # Synthetic Benchmark DNA
    synth_dna = sample_calibrated_dna.model_copy(deep=True)
    synth_dna.provenance.data_source_type = "SYNTHETIC_BENCHMARK_DATA"
    synth_dna.provenance.is_synthetic_benchmark = True

    resp_synth = generator.generate_population(synth_dna, population_size=10)
    assert resp_synth.population_metadata is not None
    assert resp_synth.population_metadata.dna_provenance_type == "SYNTHETIC_BENCHMARK_DATA"
    assert resp_synth.population_metadata.is_synthetic_benchmark is True


def test_all_archetypes_generated(sample_calibrated_dna: BehavioralDNAProfile) -> None:
    """
    Verify that all four archetypes are instantiated across a reasonably sized population.
    """
    generator = AgentPopulationGenerator()
    resp = generator.generate_population(sample_calibrated_dna, population_size=500, random_seed=42)

    assert resp.status == "ok"
    archetypes_map = resp.calibration_diagnostics.archetype_distribution
    assert archetypes_map["FAST_CHECKOUT"] > 0
    assert archetypes_map["PATIENT_RETRYER"] > 0
    assert archetypes_map["METHOD_SWITCHER"] > 0
    assert archetypes_map["HIGH_TICKET"] > 0


def test_api_generate_agents_endpoint_with_calibrated_dna(
    client: TestClient, sample_calibrated_dna: BehavioralDNAProfile
) -> None:
    """
    Verify POST /api/v1/agents/generate endpoint with mocked profiler returning calibrated DNA.
    """
    from app.api.routes.agents import get_dna_profiler

    class MockProfiler:
        def build_profile(self, **kwargs: Any) -> BehavioralDNAProfile:
            return sample_calibrated_dna

    app.dependency_overrides[get_dna_profiler] = lambda: MockProfiler()

    try:
        req_payload = {"population_size": 250, "random_seed": 42, "preview_count": 5}
        res = client.post("/api/v1/agents/generate", json=req_payload)
        assert res.status_code == 200
        data = res.json()
        assert data["status"] == "ok"
        assert data["total_generated_count"] == 250
        assert len(data["preview_agents"]) == 5
        assert data["population_metadata"]["random_seed"] == 42
        assert data["calibration_diagnostics"]["is_calibrated"] is True
    finally:
        app.dependency_overrides.clear()


def test_api_generate_agents_endpoint_with_empty_repository(
    client: TestClient, tmp_path: Path
) -> None:
    """
    Verify that POST /api/v1/agents/generate refuses generation when data/raw is empty.
    """
    from app.api.routes.agents import get_dna_profiler

    empty_loader = DatasetLoaderService(raw_data_dir=str(tmp_path))
    empty_profiler = BehavioralDNAProfiler(loader=empty_loader)
    app.dependency_overrides[get_dna_profiler] = lambda: empty_profiler

    try:
        req_payload = {"population_size": 100, "random_seed": 42}
        res = client.post("/api/v1/agents/generate", json=req_payload)
        assert res.status_code == 200
        data = res.json()
        assert data["status"] == "unavailable"
        assert data["total_generated_count"] == 0
        assert "Behavioral DNA is empty or unavailable" in data["message"]
    finally:
        app.dependency_overrides.clear()
