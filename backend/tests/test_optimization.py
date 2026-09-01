"""
Comprehensive test suite for Pareto Frontier Multi-Objective Optimization,
Dominance mathematics, Mixed objective directions, Constraint feasibility,
Common Random Numbers (CRN) population sharing, Baseline reuse, Uncertainty bounds,
Provenance propagation, and FastAPI endpoints.
All tests use controlled fixtures without live API calls.
"""

from typing import Any, Dict, List
from unittest.mock import MagicMock, patch
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
from app.models.optimization import (
    ConstraintType,
    MerchantConstraint,
    ObjectiveDefinition,
    ObjectiveDirection,
    ObjectiveType,
    OptimizationRequest,
    ParetoScenarioItem,
)
from app.services.pareto_optimizer import OBJECTIVE_REGISTRY, ParetoOptimizer


@pytest.fixture
def client() -> TestClient:
    return TestClient(app)


@pytest.fixture
def calibrated_dna() -> BehavioralDNAProfile:
    """
    Controlled Behavioral DNA profile with known priors for testing Pareto optimization.
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


# ==============================================================================
# Mathematical Dominance Tests
# ==============================================================================


def test_two_objective_maximize_maximize_dominance() -> None:
    """
    Test 1: Maximize/Maximize 2D Pareto dominance.
    A=(100, 90), B=(80, 70), C=(90, 95)
    A dominates B. C does not dominate A (trade-off).
    Frontier: {A, C}. Dominated: {B}.
    """
    optimizer = ParetoOptimizer()
    objs = [
        ObjectiveDefinition(
            objective_type=ObjectiveType.MAX_NET_REVENUE,
            metric_name="revenue",
            direction=ObjectiveDirection.MAXIMIZE,
            unit="INR",
        ),
        ObjectiveDefinition(
            objective_type=ObjectiveType.MAX_CONVERSION_RATE,
            metric_name="conversion",
            direction=ObjectiveDirection.MAXIMIZE,
            unit="%",
        ),
    ]

    items = [
        ParetoScenarioItem(scenario_id="A", scenario_name="A", objective_values={"revenue": 100, "conversion": 90}, is_pareto_optimal=False),
        ParetoScenarioItem(scenario_id="B", scenario_name="B", objective_values={"revenue": 80, "conversion": 70}, is_pareto_optimal=False),
        ParetoScenarioItem(scenario_id="C", scenario_name="C", objective_values={"revenue": 90, "conversion": 95}, is_pareto_optimal=False),
    ]

    frontier, dominated = optimizer.compute_pareto_dominance(items, objs)

    frontier_ids = {item.scenario_id for item in frontier}
    dominated_ids = {item.scenario_id for item in dominated}

    assert frontier_ids == {"A", "C"}
    assert dominated_ids == {"B"}
    assert "A" in items[1].dominated_by


def test_two_objective_maximize_minimize_dominance() -> None:
    """
    Test 3: Maximize Revenue vs. Minimize Fees.
    A: Rev=100, Fee=10
    B: Rev=90,  Fee=20  (A dominates B: higher rev, lower fee)
    C: Rev=110, Fee=15  (Trade-off with A: higher rev but higher fee)
    Frontier: {A, C}
    """
    optimizer = ParetoOptimizer()
    objs = [
        ObjectiveDefinition(
            objective_type=ObjectiveType.MAX_NET_REVENUE,
            metric_name="revenue",
            direction=ObjectiveDirection.MAXIMIZE,
            unit="INR",
        ),
        ObjectiveDefinition(
            objective_type=ObjectiveType.MIN_PROCESSING_FEES,
            metric_name="fees",
            direction=ObjectiveDirection.MINIMIZE,
            unit="INR",
        ),
    ]

    items = [
        ParetoScenarioItem(scenario_id="A", scenario_name="A", objective_values={"revenue": 100, "fees": 10}, is_pareto_optimal=False),
        ParetoScenarioItem(scenario_id="B", scenario_name="B", objective_values={"revenue": 90, "fees": 20}, is_pareto_optimal=False),
        ParetoScenarioItem(scenario_id="C", scenario_name="C", objective_values={"revenue": 110, "fees": 15}, is_pareto_optimal=False),
    ]

    frontier, dominated = optimizer.compute_pareto_dominance(items, objs)
    frontier_ids = {item.scenario_id for item in frontier}
    assert frontier_ids == {"A", "C"}


def test_mixed_objective_direction_handling() -> None:
    """
    Test 4: Mixed directions (Maximize Net Revenue, Maximize Conversion, Minimize Failure Rate, Minimize Average Attempts).
    """
    optimizer = ParetoOptimizer()
    objs = [
        ObjectiveDefinition(objective_type=ObjectiveType.MAX_NET_REVENUE, metric_name="revenue", direction=ObjectiveDirection.MAXIMIZE, unit="INR"),
        ObjectiveDefinition(objective_type=ObjectiveType.MAX_CONVERSION_RATE, metric_name="conversion", direction=ObjectiveDirection.MAXIMIZE, unit="%"),
        ObjectiveDefinition(objective_type=ObjectiveType.MIN_FAILURE_RATE, metric_name="failure", direction=ObjectiveDirection.MINIMIZE, unit="%"),
        ObjectiveDefinition(objective_type=ObjectiveType.MIN_AVG_ATTEMPTS, metric_name="attempts", direction=ObjectiveDirection.MINIMIZE, unit="scalar"),
    ]

    items = [
        ParetoScenarioItem(scenario_id="A", scenario_name="A", objective_values={"revenue": 100, "conversion": 90, "failure": 5, "attempts": 1.1}, is_pareto_optimal=False),
        ParetoScenarioItem(scenario_id="B", scenario_name="B", objective_values={"revenue": 90, "conversion": 85, "failure": 10, "attempts": 1.4}, is_pareto_optimal=False), # Dominated by A on all 4
        ParetoScenarioItem(scenario_id="C", scenario_name="C", objective_values={"revenue": 110, "conversion": 88, "failure": 6, "attempts": 1.2}, is_pareto_optimal=False), # Trade-off with A
    ]

    frontier, dominated = optimizer.compute_pareto_dominance(items, objs)
    assert {i.scenario_id for i in frontier} == {"A", "C"}
    assert {i.scenario_id for i in dominated} == {"B"}


def test_equal_scenarios_non_dominance() -> None:
    """
    Test 5: Identical scenarios must NOT dominate each other.
    """
    optimizer = ParetoOptimizer()
    objs = [
        ObjectiveDefinition(
            objective_type=ObjectiveType.MAX_NET_REVENUE,
            metric_name="revenue",
            direction=ObjectiveDirection.MAXIMIZE,
            unit="INR",
        )
    ]

    items = [
        ParetoScenarioItem(scenario_id="A", scenario_name="A", objective_values={"revenue": 100}, is_pareto_optimal=False),
        ParetoScenarioItem(scenario_id="B", scenario_name="B", objective_values={"revenue": 100}, is_pareto_optimal=False),
    ]

    frontier, dominated = optimizer.compute_pareto_dominance(items, objs)
    assert len(frontier) == 2
    assert len(dominated) == 0


def test_normalization_does_not_change_pareto_dominance() -> None:
    """
    Test 6: Verifies that min-max normalization or scaling does not alter dominance relationships.
    """
    optimizer = ParetoOptimizer()
    objs = [
        ObjectiveDefinition(objective_type=ObjectiveType.MAX_NET_REVENUE, metric_name="revenue", direction=ObjectiveDirection.MAXIMIZE, unit="INR"),
        ObjectiveDefinition(objective_type=ObjectiveType.MIN_PROCESSING_FEES, metric_name="fees", direction=ObjectiveDirection.MINIMIZE, unit="INR"),
    ]

    # Raw Items
    raw_items = [
        ParetoScenarioItem(scenario_id="A", scenario_name="A", objective_values={"revenue": 100000.0, "fees": 2000.0}, is_pareto_optimal=False),
        ParetoScenarioItem(scenario_id="B", scenario_name="B", objective_values={"revenue": 80000.0, "fees": 3000.0}, is_pareto_optimal=False),
        ParetoScenarioItem(scenario_id="C", scenario_name="C", objective_values={"revenue": 120000.0, "fees": 2500.0}, is_pareto_optimal=False),
    ]
    raw_frontier, _ = optimizer.compute_pareto_dominance(raw_items, objs)

    # Normalized Items (Min-Max scaled to [0, 1])
    norm_items = [
        ParetoScenarioItem(scenario_id="A", scenario_name="A", objective_values={"revenue": 0.5, "fees": 0.0}, is_pareto_optimal=False),
        ParetoScenarioItem(scenario_id="B", scenario_name="B", objective_values={"revenue": 0.0, "fees": 1.0}, is_pareto_optimal=False),
        ParetoScenarioItem(scenario_id="C", scenario_name="C", objective_values={"revenue": 1.0, "fees": 0.5}, is_pareto_optimal=False),
    ]
    norm_frontier, _ = optimizer.compute_pareto_dominance(norm_items, objs)

    assert {i.scenario_id for i in raw_frontier} == {i.scenario_id for i in norm_frontier} == {"A", "C"}


def test_objective_registry_availability() -> None:
    """
    Test 7: All 6 standard optimization objectives are registered and available.
    """
    assert len(OBJECTIVE_REGISTRY) == 6
    for obj_type, defn in OBJECTIVE_REGISTRY.items():
        assert defn.is_available is True
        assert defn.metric_name is not None
        assert defn.direction in (ObjectiveDirection.MAXIMIZE, ObjectiveDirection.MINIMIZE)


# ==============================================================================
# Constraint Feasibility Tests
# ==============================================================================


def test_constraint_feasibility_filtering() -> None:
    """
    Test 8, 9, 10: Validates hard operational constraint filtering and violation tracking.
    """
    optimizer = ParetoOptimizer()
    from app.models.simulation import SimulationKPIs

    constraints = [
        MerchantConstraint(constraint_type=ConstraintType.MIN_CONVERSION_RATE, threshold_value=85.0),
        MerchantConstraint(constraint_type=ConstraintType.MAX_PROCESSING_FEES, threshold_value=30000.0),
        MerchantConstraint(constraint_type=ConstraintType.MAX_FAILURE_RATE, threshold_value=10.0),
        MerchantConstraint(constraint_type=ConstraintType.MIN_NET_REVENUE, threshold_value=50000.0),
    ]

    # 1. Feasible KPIs
    kpis_ok = SimulationKPIs(
        total_agents=100,
        successful_transactions=88,
        failed_transactions=8,
        abandoned_transactions=4,
        total_payment_attempts=110,
        conversion_rate_percent=88.0,
        failure_rate_percent=8.0,
        abandonment_rate_percent=4.0,
        gross_attempted_volume_inr=100000.0,
        captured_volume_inr=88000.0,
        lost_volume_inr=12000.0,
        total_processing_fees_inr=20000.0,
        total_taxes_inr=3600.0,
        net_merchant_revenue_inr=64400.0,
        average_ticket_size_inr=1000.0,
        average_attempts_per_success=1.1,
    )
    is_f, viols = optimizer.evaluate_feasibility(kpis_ok, constraints)
    assert is_f is True
    assert len(viols) == 0

    # 2. Infeasible KPIs (violates multiple constraints)
    kpis_bad = kpis_ok.model_copy(
        update={
            "conversion_rate_percent": 80.0,
            "total_processing_fees_inr": 35000.0,
            "failure_rate_percent": 15.0,
            "net_merchant_revenue_inr": 40000.0,
        }
    )
    is_f_bad, viols_bad = optimizer.evaluate_feasibility(kpis_bad, constraints)
    assert is_f_bad is False
    assert len(viols_bad) == 4


def test_impossible_constraints_yield_empty_frontier(calibrated_dna: BehavioralDNAProfile) -> None:
    """
    Test 9: Impossible constraint yields 0 feasible candidates and 0 frontier items.
    """
    optimizer = ParetoOptimizer()

    req = OptimizationRequest(
        optimization_name="Impossible Constraint",
        objectives=[ObjectiveType.MAX_CONVERSION_RATE],
        constraints=[
            MerchantConstraint(constraint_type=ConstraintType.MIN_CONVERSION_RATE, threshold_value=99.9)
        ],
        parameter_ranges={"upi_success_rate": [0.85, 0.90]},
        population_size=100,
        random_seed=42,
    )

    res = optimizer.optimize(dna=calibrated_dna, request=req)
    assert res.status == "completed"
    assert res.feasible_candidates_count == 0
    assert res.infeasible_candidates_count == 2
    assert res.frontier_size == 0
    assert len(res.infeasible_scenarios) == 2


# ==============================================================================
# End-to-End Pareto Optimization, CRN, & Provenance Tests
# ==============================================================================


def test_candidate_generation_and_limit_enforcement() -> None:
    """
    Test 11 & 12: Cartesian candidate expansion bounds validation.
    """
    optimizer = ParetoOptimizer()

    # Valid grid
    ranges_ok = {
        "upi_success_rate": [0.85, 0.90],
        "card_mdr_percent": [1.5, 2.0],
    }
    cand_ok, p_maps = optimizer.generate_candidate_scenarios(ranges_ok, population_size=100, random_seed=42)
    assert len(cand_ok) == 4
    assert len(p_maps) == 4

    # Empty parameter dictionary raises ValueError
    with pytest.raises(ValueError, match="cannot be empty"):
        optimizer.generate_candidate_scenarios({}, population_size=100, random_seed=42)

    # Empty parameter value list raises ValueError
    with pytest.raises(ValueError, match="at least one candidate value"):
        optimizer.generate_candidate_scenarios({"upi_success_rate": []}, population_size=100, random_seed=42)

    # Grid exceeding limit of 150
    ranges_huge = {
        "p1": [1, 2, 3, 4, 5],
        "p2": [1, 2, 3, 4, 5],
        "p3": [1, 2, 3, 4, 5, 6, 7],  # 5 x 5 x 7 = 175 > 150
    }
    with pytest.raises(ValueError, match="exceeding the maximum allowed limit"):
        optimizer.generate_candidate_scenarios(ranges_huge, population_size=100, random_seed=42)


def test_end_to_end_pareto_optimization_and_uncertainty(calibrated_dna: BehavioralDNAProfile) -> None:
    """
    Test 13, 19: Executes full Pareto optimization on calibrated DNA with CRN and verifies uncertainty.
    """
    optimizer = ParetoOptimizer()

    req = OptimizationRequest(
        optimization_name="Test Funnel Optimization",
        objectives=[
            ObjectiveType.MAX_NET_REVENUE,
            ObjectiveType.MAX_CONVERSION_RATE,
            ObjectiveType.MIN_PROCESSING_FEES,
        ],
        constraints=[
            MerchantConstraint(constraint_type=ConstraintType.MIN_CONVERSION_RATE, threshold_value=75.0)
        ],
        parameter_ranges={
            "upi_success_rate": [0.85, 0.95],
            "card_mdr_percent": [1.60, 2.10],
            "max_retries": [1, 2],
        },  # 2 x 2 x 2 = 8 candidates
        population_size=150,
        random_seed=42,
    )

    res = optimizer.optimize(dna=calibrated_dna, request=req)

    assert res.status == "completed"
    assert res.total_candidates_evaluated == 8
    assert res.feasible_candidates_count >= 1
    assert res.frontier_size >= 1
    assert len(res.frontier_scenarios) == res.frontier_size
    assert res.dna_provenance_type == "OBSERVED_RAZORPAY_DATA"

    # Trade-off ranges established
    assert len(res.tradeoff_summary.conversion_rate_range_percent) == 2
    assert len(res.tradeoff_summary.net_revenue_range_inr) == 2

    # Uncertainty bounds verified
    for item in res.frontier_scenarios:
        assert "conversion_rate_percent" in item.uncertainty_bounds
        assert "net_merchant_revenue_inr" in item.uncertainty_bounds
        conv_u = item.uncertainty_bounds["conversion_rate_percent"]
        assert len(conv_u["ci_95"]) == 2
        assert conv_u["ci_95"][0] <= conv_u["mean"] <= conv_u["ci_95"][1]
        assert conv_u["sample_size"] == 150


def test_baseline_reuse_and_crn_shared_population(calibrated_dna: BehavioralDNAProfile) -> None:
    """
    Test 15 & 16: Verifies baseline simulation is calculated ONCE and population is reused for all candidates.
    """
    optimizer = ParetoOptimizer()

    req = OptimizationRequest(
        optimization_name="Baseline Reuse Test",
        objectives=[ObjectiveType.MAX_NET_REVENUE],
        parameter_ranges={"upi_success_rate": [0.85, 0.90, 0.95]},  # 3 candidates
        population_size=100,
        random_seed=42,
    )

    # Spy on simulate_agent
    original_simulate = optimizer.twin_engine.simulate_agent
    call_count = 0

    def counting_simulate(*args: Any, **kwargs: Any) -> Any:
        nonlocal call_count
        call_count += 1
        return original_simulate(*args, **kwargs)

    optimizer.twin_engine.simulate_agent = counting_simulate

    try:
        res = optimizer.optimize(dna=calibrated_dna, request=req)
        assert res.status == "completed"
        # Total calls = (1 baseline + 3 candidates) * 100 population = 400 calls
        assert call_count == 400
    finally:
        optimizer.twin_engine.simulate_agent = original_simulate


def test_deterministic_optimization_same_seed(calibrated_dna: BehavioralDNAProfile) -> None:
    """
    Test 13 & 14: Same seed yields identical frontier; different seed produces valid exploration.
    """
    optimizer = ParetoOptimizer()

    req_a = OptimizationRequest(
        optimization_name="Run A",
        objectives=[ObjectiveType.MAX_NET_REVENUE, ObjectiveType.MAX_CONVERSION_RATE],
        parameter_ranges={"upi_success_rate": [0.85, 0.95], "card_mdr_percent": [1.60, 2.10]},
        population_size=100,
        random_seed=42,
    )
    req_b = OptimizationRequest(
        optimization_name="Run B",
        objectives=[ObjectiveType.MAX_NET_REVENUE, ObjectiveType.MAX_CONVERSION_RATE],
        parameter_ranges={"upi_success_rate": [0.85, 0.95], "card_mdr_percent": [1.60, 2.10]},
        population_size=100,
        random_seed=42,
    )
    req_c = OptimizationRequest(
        optimization_name="Run C",
        objectives=[ObjectiveType.MAX_NET_REVENUE, ObjectiveType.MAX_CONVERSION_RATE],
        parameter_ranges={"upi_success_rate": [0.85, 0.95], "card_mdr_percent": [1.60, 2.10]},
        population_size=100,
        random_seed=99,
    )

    res_a = optimizer.optimize(dna=calibrated_dna, request=req_a)
    res_b = optimizer.optimize(dna=calibrated_dna, request=req_b)
    res_c = optimizer.optimize(dna=calibrated_dna, request=req_c)

    # Determinism: A == B
    assert res_a.frontier_size == res_b.frontier_size
    assert [s.scenario_id for s in res_a.frontier_scenarios] == [s.scenario_id for s in res_b.frontier_scenarios]
    assert res_a.frontier_scenarios[0].objective_values == res_b.frontier_scenarios[0].objective_values

    # Different seed: C is also valid
    assert res_c.frontier_size >= 1


def test_provenance_propagation(calibrated_dna: BehavioralDNAProfile) -> None:
    """
    Test 20: Provenance metadata is correctly propagated into response.
    """
    optimizer = ParetoOptimizer()

    # Observed
    req = OptimizationRequest(
        parameter_ranges={"upi_success_rate": [0.85, 0.95]},
        population_size=50,
        random_seed=42,
    )
    res_obs = optimizer.optimize(dna=calibrated_dna, request=req)
    assert res_obs.dna_provenance_type == "OBSERVED_RAZORPAY_DATA"
    assert res_obs.is_synthetic_benchmark is False

    # Synthetic Benchmark
    synth_dna = calibrated_dna.model_copy(deep=True)
    synth_dna.provenance.data_source_type = "SYNTHETIC_BENCHMARK_DATA"
    synth_dna.provenance.is_synthetic_benchmark = True

    res_synth = optimizer.optimize(dna=synth_dna, request=req)
    assert res_synth.dna_provenance_type == "SYNTHETIC_BENCHMARK_DATA"
    assert res_synth.is_synthetic_benchmark is True


def test_empty_dna_rejection(empty_dna: BehavioralDNAProfile) -> None:
    """
    Test 21: Rejects optimization when Behavioral DNA is empty.
    """
    optimizer = ParetoOptimizer()

    req = OptimizationRequest(
        optimization_name="Empty DNA Test",
        objectives=[ObjectiveType.MAX_NET_REVENUE],
        parameter_ranges={"upi_success_rate": [0.85, 0.95]},
        population_size=100,
        random_seed=42,
    )

    res = optimizer.optimize(dna=empty_dna, request=req)
    assert res.status == "unavailable"
    assert res.total_candidates_evaluated == 0
    assert res.frontier_size == 0


def test_api_optimization_endpoint(client: TestClient, calibrated_dna: BehavioralDNAProfile) -> None:
    """
    Test 24: POST /api/v1/optimization/pareto API endpoint integration.
    """
    from app.api.routes.optimization import get_dna_profiler

    class MockProfiler:
        def build_profile(self, **kwargs: Any) -> BehavioralDNAProfile:
            return calibrated_dna

    app.dependency_overrides[get_dna_profiler] = lambda: MockProfiler()

    try:
        payload = {
            "optimization_name": "API Pareto Test",
            "objectives": ["MAX_NET_REVENUE", "MAX_CONVERSION_RATE", "MIN_PROCESSING_FEES"],
            "constraints": [{"constraint_type": "MIN_CONVERSION_RATE", "threshold_value": 75.0}],
            "parameter_ranges": {
                "upi_success_rate": [0.85, 0.95],
                "card_mdr_percent": [1.60, 2.10],
            },
            "population_size": 100,
            "random_seed": 42,
        }
        res = client.post("/api/v1/optimization/pareto", json=payload)
        assert res.status_code == 200
        data = res.json()
        assert data["status"] == "completed"
        assert data["total_candidates_evaluated"] == 4
        assert data["frontier_size"] >= 1
        assert data["dna_provenance_type"] == "OBSERVED_RAZORPAY_DATA"
    finally:
        app.dependency_overrides.clear()


def test_api_optimization_empty_repository(client: TestClient) -> None:
    """
    Verify POST /api/v1/optimization/pareto returns unavailable on empty repository without mock.
    """
    payload = {
        "optimization_name": "Empty Test",
        "objectives": ["MAX_NET_REVENUE"],
        "parameter_ranges": {"upi_success_rate": [0.85, 0.95]},
        "population_size": 100,
        "random_seed": 42,
    }
    res = client.post("/api/v1/optimization/pareto", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "unavailable"
