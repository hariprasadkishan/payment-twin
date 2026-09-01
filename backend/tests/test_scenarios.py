"""
Comprehensive test suite for What-If Scenario Engine, Interventions, Scenario Isolation,
Common Random Numbers (CRN) fairness, paired delta comparisons, attribution trails,
parameter grid matrix sweeps, and API endpoints.
All tests use controlled fixtures without live API calls.
"""

from typing import Any, Dict, List
import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.models.agent import CustomerAgent
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
from app.models.scenario import (
    InterventionMode,
    InterventionType,
    ScenarioCompareRequest,
    ScenarioConfig,
    ScenarioIntervention,
    ScenarioMatrixRequest,
    ScenarioRunRequest,
)
from app.models.simulation import SimulationConfig, VirtualPaymentEnvironment
from app.services.scenario_engine import ScenarioEngine


@pytest.fixture
def client() -> TestClient:
    return TestClient(app)


@pytest.fixture
def calibrated_dna() -> BehavioralDNAProfile:
    """
    Controlled Behavioral DNA profile with known priors for testing What-If interventions.
    """
    return BehavioralDNAProfile(
        status="ok",
        dna_version="1.0.0",
        provenance=DataProvenance(
            data_source_type="OBSERVED_RAZORPAY_DATA",
            is_synthetic_benchmark=False,
            source_datasets=["payments_test.jsonl"],
            extracted_at_iso="2026-09-01T12:00:00+00:00",
            total_sample_size=600,
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
            sample_size=600,
        ),
        success_dynamics=SuccessDynamics(
            overall_success_rate=0.85,
            overall_confidence_interval_95=[0.81, 0.88],
            by_method={
                "upi": SuccessRateMetric(rate=0.88, ci_95=[0.84, 0.91], sample_size=360),
                "card": SuccessRateMetric(rate=0.80, ci_95=[0.73, 0.85], sample_size=180),
                "netbanking": SuccessRateMetric(rate=0.70, ci_95=[0.56, 0.81], sample_size=60),
            },
            by_bank={"HDFC": SuccessRateMetric(rate=0.85, ci_95=[0.78, 0.90], sample_size=200)},
            sample_size=600,
        ),
        failure_diagnostics=FailureDiagnostics(
            failed_sample_size=90,
            error_source_distribution={"customer": 0.70, "bank": 0.20, "gateway": 0.10},
            error_step_distribution={"payment_authentication": 0.60, "payment_authorization": 0.40},
            top_error_reasons={"incorrect_otp": 0.45, "insufficient_funds": 0.35, "payment_cancelled": 0.20},
            top_error_codes={"BAD_REQUEST_ERROR": 0.80, "GATEWAY_ERROR": 0.20},
        ),
        amount_distribution=AmountDistribution(
            sample_size=600,
            summary=AmountSummary(
                mean=1600.0,
                median=1000.0,
                std_dev=1300.0,
                iqr=1500.0,
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
            aov_by_method={"upi": 850.0, "card": 2600.0, "netbanking": 3400.0},
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
            sample_size_with_fees=600,
            effective_blended_mdr_percent=1.90,
            mdr_by_method_percent={"card": 2.10, "netbanking": 1.75, "upi": 0.0},
            effective_tax_rate_percent=18.0,
        ),
        empirical_transitions=EmpiricalTransitions(
            has_order_tracking=True,
            tracked_orders_count=520,
            multi_attempt_orders_count=50,
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


def test_baseline_environment_immutability(calibrated_dna: BehavioralDNAProfile) -> None:
    """
    Test 1: Scenario execution must NOT mutate the baseline environment.
    """
    engine = ScenarioEngine()
    base_env = VirtualPaymentEnvironment.from_dna(calibrated_dna)
    base_env_copy = base_env.model_dump()

    inv = [
        ScenarioIntervention(
            intervention_type=InterventionType.METHOD_SUCCESS_RATE,
            target="upi",
            mode=InterventionMode.ABSOLUTE,
            value=0.99,
        ),
        ScenarioIntervention(
            intervention_type=InterventionType.FEE_MDR_RATE,
            target="card",
            value=1.50,
        ),
    ]

    scen_env = engine.apply_interventions_to_environment(base_env, inv)

    assert scen_env.method_success_rates["upi"] == 0.99
    assert scen_env.mdr_rates_percent["card"] == 1.50

    # Regression test proving baseline_before == baseline_after
    assert base_env.model_dump() == base_env_copy


def test_method_success_rate_absolute_and_delta(calibrated_dna: BehavioralDNAProfile) -> None:
    """
    Test 2 & 3: Tests absolute and delta success rate modifications.
    """
    engine = ScenarioEngine()
    base_env = VirtualPaymentEnvironment.from_dna(calibrated_dna)

    # Absolute
    inv_abs = [
        ScenarioIntervention(
            intervention_type=InterventionType.METHOD_SUCCESS_RATE,
            target="card",
            mode=InterventionMode.ABSOLUTE,
            value=0.92,
        )
    ]
    env_abs = engine.apply_interventions_to_environment(base_env, inv_abs)
    assert env_abs.method_success_rates["card"] == 0.92

    # Delta
    inv_delta = [
        ScenarioIntervention(
            intervention_type=InterventionType.METHOD_SUCCESS_RATE,
            target="card",
            mode=InterventionMode.DELTA,
            value=0.05,
        )
    ]
    env_delta = engine.apply_interventions_to_environment(base_env, inv_delta)
    assert env_delta.method_success_rates["card"] == pytest.approx(0.85, abs=1e-3)


def test_routing_preference_intervention(calibrated_dna: BehavioralDNAProfile) -> None:
    """
    Test 4 & 5: Method routing shift boosts target method.
    """
    engine = ScenarioEngine()
    agents = engine._generate_base_agent_population(calibrated_dna, population_size=200, random_seed=42)

    inv = [
        ScenarioIntervention(
            intervention_type=InterventionType.METHOD_ROUTING_PREFERENCE,
            target="upi",
            shift_percentage=25.0,
        )
    ]

    scen_agents = engine.apply_interventions_to_agents(agents, inv, random_seed=42)

    base_upi_count = sum(1 for a in agents if a.observed_preferences.primary_method == "upi")
    scen_upi_count = sum(1 for a in scen_agents if a.observed_preferences.primary_method == "upi")

    assert scen_upi_count > base_upi_count


def test_retry_and_switch_interventions(calibrated_dna: BehavioralDNAProfile) -> None:
    """
    Test 6, 7, 8, 9: Retry policy overrides and method switch fallbacks.
    """
    engine = ScenarioEngine()
    agents = engine._generate_base_agent_population(calibrated_dna, population_size=50, random_seed=42)

    inv = [
        ScenarioIntervention(
            intervention_type=InterventionType.RETRY_POLICY,
            max_retries_override=3,
            retry_propensity_multiplier=1.5,
        ),
        ScenarioIntervention(
            intervention_type=InterventionType.METHOD_SWITCH_POLICY,
            switch_propensity_override=0.85,
            preferred_fallback_method="upi",
        ),
    ]

    scen_agents = engine.apply_interventions_to_agents(agents, inv, random_seed=42)

    for a in scen_agents:
        assert a.latent_parameters.max_retries == 3
        assert a.latent_parameters.method_switch_propensity == 0.85
        if a.observed_preferences.primary_method != "upi":
            assert a.observed_preferences.secondary_method == "upi"


def test_latency_and_fee_interventions(calibrated_dna: BehavioralDNAProfile) -> None:
    """
    Test 10 & 11: Latency friction and fee MDR modifications.
    """
    engine = ScenarioEngine()
    base_env = VirtualPaymentEnvironment.from_dna(calibrated_dna)

    inv = [
        ScenarioIntervention(
            intervention_type=InterventionType.LATENCY_FRICTION,
            auth_latency_multiplier=0.6,
            gateway_proc_latency_multiplier=0.75,
        ),
        ScenarioIntervention(
            intervention_type=InterventionType.FEE_MDR_RATE,
            target="card",
            value=1.65,
        ),
    ]

    scen_env = engine.apply_interventions_to_environment(base_env, inv)

    assert scen_env.latency_assumptions.upi_auth_latency_sec[0] == pytest.approx(
        base_env.latency_assumptions.upi_auth_latency_sec[0] * 0.6, abs=1e-2
    )
    assert scen_env.mdr_rates_percent["card"] == 1.65


def test_bank_health_intervention(calibrated_dna: BehavioralDNAProfile) -> None:
    """
    Test 12: Bank health multiplier scales bank success rate.
    """
    engine = ScenarioEngine()
    base_env = VirtualPaymentEnvironment.from_dna(calibrated_dna)

    inv = [
        ScenarioIntervention(
            intervention_type=InterventionType.BANK_HEALTH_MODIFIER,
            target="HDFC",
            health_multiplier=0.5,
        )
    ]

    scen_env = engine.apply_interventions_to_environment(base_env, inv)
    assert scen_env.bank_success_rates["HDFC"] == pytest.approx(0.425, abs=1e-3)


def test_validation_errors_rejection(calibrated_dna: BehavioralDNAProfile) -> None:
    """
    Test 13-18: Validates rejection of invalid probabilities, MDRs, unsupported methods, and banks.
    """
    engine = ScenarioEngine()
    base_env = VirtualPaymentEnvironment.from_dna(calibrated_dna)

    # Invalid probability > 1.0
    with pytest.raises(ValueError, match="out of bounds"):
        engine.apply_interventions_to_environment(
            base_env,
            [
                ScenarioIntervention(
                    intervention_type=InterventionType.METHOD_SUCCESS_RATE,
                    target="upi",
                    mode=InterventionMode.ABSOLUTE,
                    value=1.5,
                )
            ],
        )

    # Invalid MDR > 10%
    with pytest.raises(ValueError, match="MDR percentage"):
        engine.apply_interventions_to_environment(
            base_env,
            [
                ScenarioIntervention(
                    intervention_type=InterventionType.FEE_MDR_RATE,
                    target="card",
                    value=15.0,
                )
            ],
        )

    # Unsupported method
    with pytest.raises(ValueError, match="Invalid target method"):
        engine.apply_interventions_to_environment(
            base_env,
            [
                ScenarioIntervention(
                    intervention_type=InterventionType.METHOD_SUCCESS_RATE,
                    target="crypto_currency",
                    mode=InterventionMode.ABSOLUTE,
                    value=0.90,
                )
            ],
        )

    # Unsupported bank
    with pytest.raises(ValueError, match="Target bank 'NONEXISTENT_BANK' not found"):
        engine.apply_interventions_to_environment(
            base_env,
            [
                ScenarioIntervention(
                    intervention_type=InterventionType.BANK_HEALTH_MODIFIER,
                    target="NONEXISTENT_BANK",
                    health_multiplier=0.5,
                )
            ],
        )


def test_common_random_numbers_and_paired_deltas(calibrated_dna: BehavioralDNAProfile) -> None:
    """
    Test 19, 21, 23: Common Random Numbers evaluate same agents; GMV is conserved.
    """
    engine = ScenarioEngine()

    scen = ScenarioConfig(
        scenario_id="scen_upi_boost",
        scenario_name="Boost UPI Success to 95%",
        interventions=[
            ScenarioIntervention(
                intervention_type=InterventionType.METHOD_SUCCESS_RATE,
                target="upi",
                mode=InterventionMode.ABSOLUTE,
                value=0.95,
            )
        ],
        population_size=300,
        random_seed=42,
    )

    base_cfg = SimulationConfig(population_size=300, random_seed=42)
    resp = engine.compare(dna=calibrated_dna, baseline_config=base_cfg, scenarios=[scen])

    assert resp.status == "completed"
    assert len(resp.comparisons) == 1

    cmp = resp.comparisons[0]
    metrics = cmp.metric_comparisons

    # GMV conservation invariant: gross attempted GMV is identical
    assert metrics["gross_attempted_volume_inr"].absolute_delta == 0.0
    assert metrics["gross_attempted_volume_inr"].percentage_delta == 0.0

    # Uplift in conversion rate
    assert metrics["conversion_rate_percent"].absolute_delta > 0
    assert metrics["captured_volume_inr"].absolute_delta > 0
    assert metrics["lost_volume_inr"].absolute_delta < 0


def test_multi_scenario_comparison(calibrated_dna: BehavioralDNAProfile) -> None:
    """
    Test 26: Compares Baseline vs Scenario A vs Scenario B.
    """
    engine = ScenarioEngine()

    scen_a = ScenarioConfig(
        scenario_id="scen_a",
        scenario_name="Scenario A: UPI 95%",
        interventions=[
            ScenarioIntervention(
                intervention_type=InterventionType.METHOD_SUCCESS_RATE,
                target="upi",
                mode=InterventionMode.ABSOLUTE,
                value=0.95,
            )
        ],
        population_size=200,
        random_seed=42,
    )

    scen_b = ScenarioConfig(
        scenario_id="scen_b",
        scenario_name="Scenario B: Card MDR 1.5%",
        interventions=[
            ScenarioIntervention(
                intervention_type=InterventionType.FEE_MDR_RATE,
                target="card",
                value=1.50,
            )
        ],
        population_size=200,
        random_seed=42,
    )

    base_cfg = SimulationConfig(population_size=200, random_seed=42)
    resp = engine.compare(dna=calibrated_dna, baseline_config=base_cfg, scenarios=[scen_a, scen_b])

    assert resp.status == "completed"
    assert len(resp.comparisons) == 2
    assert resp.comparisons[0].scenario_id == "scen_a"
    assert resp.comparisons[1].scenario_id == "scen_b"


def test_scenario_matrix_grid_expansion_and_ranking(calibrated_dna: BehavioralDNAProfile) -> None:
    """
    Test 27 & 28: Cartesian product matrix sweep and ranking.
    """
    engine = ScenarioEngine()

    req = ScenarioMatrixRequest(
        matrix_name="UPI & Card Grid",
        interventions_grid={
            "upi_success_rate": [0.85, 0.95],
            "card_mdr": [2.10, 1.60],
        },
        population_size=150,
        random_seed=42,
        ranking_criterion="net_merchant_revenue_inr",
    )

    resp = engine.expand_and_run_matrix(dna=calibrated_dna, request=req)

    assert resp.status == "completed"
    assert resp.total_scenarios_evaluated == 4  # 2 x 2
    assert len(resp.ranked_scenarios) == 4
    assert resp.ranked_scenarios[0].rank == 1
    # Ranked descending by net revenue
    revs = [item.net_merchant_revenue_inr for item in resp.ranked_scenarios]
    assert revs == sorted(revs, reverse=True)


def test_scenario_matrix_exceeding_25_rejected(calibrated_dna: BehavioralDNAProfile) -> None:
    """
    Test 28: Grid exceeding 25 scenarios is rejected.
    """
    engine = ScenarioEngine()

    req = ScenarioMatrixRequest(
        matrix_name="Large Grid",
        interventions_grid={
            "upi_success_rate": [0.80, 0.85, 0.90, 0.95],
            "card_mdr": [1.5, 1.7, 1.9, 2.1],
            "max_retries": [1, 2],
        },  # 4 x 4 x 2 = 32 > 25
        population_size=100,
        random_seed=42,
    )

    with pytest.raises(ValueError, match="exceeding the maximum limit of 25"):
        engine.expand_and_run_matrix(dna=calibrated_dna, request=req)


def test_attribution_trail_structure(calibrated_dna: BehavioralDNAProfile) -> None:
    """
    Test 29: Attribution chain has 4 structured tiers.
    """
    engine = ScenarioEngine()
    scen = ScenarioConfig(
        scenario_id="scen_attr",
        scenario_name="Attribution Test",
        interventions=[
            ScenarioIntervention(
                intervention_type=InterventionType.METHOD_SUCCESS_RATE,
                target="upi",
                mode=InterventionMode.ABSOLUTE,
                value=0.95,
            )
        ],
        population_size=100,
        random_seed=42,
    )

    resp = engine.compare(
        dna=calibrated_dna,
        baseline_config=SimulationConfig(population_size=100, random_seed=42),
        scenarios=[scen],
    )

    trail = resp.comparisons[0].attribution_trail
    assert len(trail) == 4
    categories = [t.category for t in trail]
    assert categories == ["DIRECT_LEVER", "FUNNEL_REACTION", "CONVERSION_IMPACT", "FINANCIAL_BOTTOM_LINE"]


def test_empty_dna_rejection(empty_dna: BehavioralDNAProfile) -> None:
    """
    Test 31: Rejects execution on empty DNA with status 'unavailable'.
    """
    engine = ScenarioEngine()
    scen = ScenarioConfig(
        scenario_id="scen_empty",
        scenario_name="Empty Test",
        interventions=[
            ScenarioIntervention(
                intervention_type=InterventionType.METHOD_SUCCESS_RATE,
                target="upi",
                mode=InterventionMode.ABSOLUTE,
                value=0.95,
            )
        ],
    )

    res_run = engine.run_scenario(dna=empty_dna, scenario=scen)
    assert res_run.status == "unavailable"

    res_cmp = engine.compare(
        dna=empty_dna,
        baseline_config=SimulationConfig(population_size=50),
        scenarios=[scen],
    )
    assert res_cmp.status == "unavailable"


def test_api_scenarios_endpoints(client: TestClient, calibrated_dna: BehavioralDNAProfile) -> None:
    """
    Test 32: FastAPI endpoints for /scenarios/run, /scenarios/compare, and /scenarios/matrix.
    """
    from app.api.routes.scenarios import get_dna_profiler

    class MockProfiler:
        def build_profile(self, **kwargs: Any) -> BehavioralDNAProfile:
            return calibrated_dna

    app.dependency_overrides[get_dna_profiler] = lambda: MockProfiler()

    try:
        # 1. /scenarios/run
        payload_run = {
            "scenario": {
                "scenario_id": "scen_api_run",
                "scenario_name": "API Run Test",
                "interventions": [
                    {
                        "intervention_type": "METHOD_SUCCESS_RATE",
                        "target": "upi",
                        "mode": "ABSOLUTE",
                        "value": 0.95,
                    }
                ],
                "population_size": 100,
                "random_seed": 42,
            }
        }
        res_run = client.post("/api/v1/scenarios/run", json=payload_run)
        assert res_run.status_code == 200
        assert res_run.json()["status"] == "completed"

        # 2. /scenarios/compare
        payload_cmp = {
            "scenarios": [
                {
                    "scenario_id": "scen_api_cmp_1",
                    "scenario_name": "UPI 95%",
                    "interventions": [
                        {
                            "intervention_type": "METHOD_SUCCESS_RATE",
                            "target": "upi",
                            "mode": "ABSOLUTE",
                            "value": 0.95,
                        }
                    ],
                }
            ],
            "population_size": 100,
            "random_seed": 42,
        }
        res_cmp = client.post("/api/v1/scenarios/compare", json=payload_cmp)
        assert res_cmp.status_code == 200
        assert res_cmp.json()["status"] == "completed"
        assert len(res_cmp.json()["comparisons"]) == 1

        # 3. /scenarios/matrix
        payload_mat = {
            "matrix_name": "API Matrix",
            "interventions_grid": {
                "upi_success_rate": [0.85, 0.95],
                "card_mdr": [2.10, 1.70],
            },
            "population_size": 100,
            "random_seed": 42,
        }
        res_mat = client.post("/api/v1/scenarios/matrix", json=payload_mat)
        assert res_mat.status_code == 200
        assert res_mat.json()["status"] == "completed"
        assert res_mat.json()["total_scenarios_evaluated"] == 4
    finally:
        app.dependency_overrides.clear()


def test_api_scenarios_empty_repository(client: TestClient) -> None:
    """
    Verify /scenarios endpoints return unavailable on empty repository without mock.
    """
    payload = {
        "scenario": {
            "scenario_id": "scen_empty_api",
            "scenario_name": "Empty Test",
            "interventions": [
                {
                    "intervention_type": "METHOD_SUCCESS_RATE",
                    "target": "upi",
                    "mode": "ABSOLUTE",
                    "value": 0.95,
                }
            ],
        }
    }
    res = client.post("/api/v1/scenarios/run", json=payload)
    assert res.status_code == 200
    assert res.json()["status"] == "unavailable"
