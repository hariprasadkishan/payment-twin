"""
Pareto Frontier Multi-Objective Optimization domain schemas, objective contracts,
merchant constraints, candidate configurations, and trade-off results.
"""

from enum import Enum
import math
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field, field_validator

from app.models.scenario import ScenarioConfig, ScenarioIntervention


class ObjectiveType(str, Enum):
    """
    Supported optimization objective types for Payment Twin.
    """

    MAX_NET_REVENUE = "MAX_NET_REVENUE"
    MAX_CONVERSION_RATE = "MAX_CONVERSION_RATE"
    MIN_PROCESSING_FEES = "MIN_PROCESSING_FEES"
    MIN_FAILURE_RATE = "MIN_FAILURE_RATE"
    MIN_ABANDONMENT_RATE = "MIN_ABANDONMENT_RATE"
    MIN_AVG_ATTEMPTS = "MIN_AVG_ATTEMPTS"


class ObjectiveDirection(str, Enum):
    """
    Direction of optimization: MAXIMIZE (+1) or MINIMIZE (-1).
    """

    MAXIMIZE = "MAXIMIZE"
    MINIMIZE = "MINIMIZE"


class ObjectiveDefinition(BaseModel):
    """
    Metadata specification for a single optimization objective.
    """

    objective_type: ObjectiveType = Field(..., description="Objective enum")
    metric_name: str = Field(..., description="Underlying KPI attribute name")
    direction: ObjectiveDirection = Field(..., description="MAXIMIZE or MINIMIZE")
    unit: str = Field(..., description="Unit of measurement (INR, %, scalar)")
    is_available: bool = Field(default=True, description="True if underlying DNA/simulation supports this metric")


class ConstraintType(str, Enum):
    """
    Merchant operational constraint types.
    """

    MIN_CONVERSION_RATE = "MIN_CONVERSION_RATE"
    MAX_PROCESSING_FEES = "MAX_PROCESSING_FEES"
    MAX_FAILURE_RATE = "MAX_FAILURE_RATE"
    MIN_NET_REVENUE = "MIN_NET_REVENUE"


class MerchantConstraint(BaseModel):
    """
    Hard operational boundary that candidate scenarios must satisfy to be deemed feasible.
    """

    constraint_type: ConstraintType = Field(..., description="Constraint category")
    threshold_value: float = Field(..., description="Threshold bound for constraint")
    description: Optional[str] = Field(default=None, description="Human-readable constraint explanation")


class ParetoScenarioItem(BaseModel):
    """
    Evaluated candidate scenario with objective values, dominance status, and uncertainty.
    """

    scenario_id: str = Field(..., description="Scenario identifier")
    scenario_name: str = Field(..., description="Scenario title")
    parameter_values: Dict[str, float] = Field(default_factory=dict, description="Parameter settings tested")
    objective_values: Dict[str, float] = Field(default_factory=dict, description="Raw evaluated KPI metrics")
    is_pareto_optimal: bool = Field(..., description="True if scenario belongs to the non-dominated Pareto frontier")
    dominated_by: List[str] = Field(
        default_factory=list, description="IDs of scenarios that strictly dominate this scenario"
    )
    dominates_count: int = Field(default=0, ge=0, description="Count of candidate scenarios this scenario dominates")
    uncertainty_bounds: Dict[str, Dict[str, Any]] = Field(
        default_factory=dict, description="Analytical 95% confidence intervals and quantiles for objectives"
    )
    tradeoff_notes: Optional[str] = Field(default=None, description="Brief explanation of objective trade-off profile")


class InfeasibleScenarioItem(BaseModel):
    """
    Candidate scenario that violated one or more hard merchant constraints.
    """

    scenario_id: str = Field(..., description="Scenario identifier")
    scenario_name: str = Field(..., description="Scenario title")
    parameter_values: Dict[str, float] = Field(default_factory=dict, description="Parameter settings tested")
    violated_constraints: List[str] = Field(..., description="List of violated constraint descriptions")
    metric_values: Dict[str, float] = Field(default_factory=dict, description="Observed metric values at failure")


class TradeoffSummary(BaseModel):
    """
    Summary of the objective value ranges across the non-dominated Pareto frontier.
    """

    conversion_rate_range_percent: List[float] = Field(
        default_factory=list, description="[min, max] conversion rate on the frontier"
    )
    net_revenue_range_inr: List[float] = Field(
        default_factory=list, description="[min, max] net revenue in INR on the frontier"
    )
    processing_fees_range_inr: List[float] = Field(
        default_factory=list, description="[min, max] processing fees in INR on the frontier"
    )


class OptimizationRequest(BaseModel):
    """
    Request model for POST /api/v1/optimization/pareto.
    """

    optimization_name: str = Field(default="Funnel Pareto Optimization", description="Optimization run title")
    objectives: List[ObjectiveType] = Field(
        default=[
            ObjectiveType.MAX_NET_REVENUE,
            ObjectiveType.MAX_CONVERSION_RATE,
            ObjectiveType.MIN_PROCESSING_FEES,
        ],
        min_length=1,
        description="Set of optimization objectives to evaluate",
    )
    constraints: List[MerchantConstraint] = Field(
        default_factory=list, description="List of hard operational constraints"
    )
    parameter_ranges: Dict[str, List[float]] = Field(
        ...,
        description="Grid mapping parameter keys (e.g. 'upi_success_rate', 'card_mdr_percent') to search candidate values",
    )
    population_size: int = Field(default=1000, ge=1, le=10000, description="Common Random Number agent population size")
    random_seed: int = Field(default=42, ge=0, description="Master deterministic optimization seed")
    max_candidates: int = Field(default=150, ge=2, le=150, description="Maximum candidate scenarios allowed (max 150)")
    dataset: Optional[str] = Field(default=None, description="Optional specific dataset to profile")


class ParetoFrontierResult(BaseModel):
    """
    Complete response model for Pareto multi-objective optimization.
    """

    status: str = Field(default="completed", description="Status: 'completed', 'unavailable', or 'error'")
    message: str = Field(..., description="Optimization result message or unavailability reason")
    optimization_id: str = Field(..., description="Unique optimization run identifier")
    total_candidates_evaluated: int = Field(default=0, ge=0, description="Total candidate scenarios tested")
    feasible_candidates_count: int = Field(default=0, ge=0, description="Count of scenarios satisfying all constraints")
    infeasible_candidates_count: int = Field(default=0, ge=0, description="Count of constraint-violating scenarios")
    frontier_size: int = Field(default=0, ge=0, description="Count of non-dominated Pareto-optimal scenarios")
    objectives: List[ObjectiveDefinition] = Field(
        default_factory=list, description="Objective definitions and directions evaluated"
    )
    constraints: List[MerchantConstraint] = Field(
        default_factory=list, description="Constraints applied during feasibility filtering"
    )
    frontier_scenarios: List[ParetoScenarioItem] = Field(
        default_factory=list, description="Pareto-optimal (non-dominated) scenarios mapping the trade-off curve"
    )
    dominated_scenarios: List[ParetoScenarioItem] = Field(
        default_factory=list, description="Feasible but dominated scenarios"
    )
    infeasible_scenarios: List[InfeasibleScenarioItem] = Field(
        default_factory=list, description="Infeasible scenarios with explicit constraint violation evidence"
    )
    tradeoff_summary: TradeoffSummary = Field(
        default_factory=TradeoffSummary, description="Objective boundaries spanned by the frontier"
    )
    baseline_summary: Dict[str, float] = Field(
        default_factory=dict, description="Baseline KPI summary for reference"
    )
    dna_provenance_type: str = Field(
        default="OBSERVED_RAZORPAY_DATA", description="Inherited provenance category"
    )
    is_synthetic_benchmark: bool = Field(default=False, description="True if benchmark DNA")
    provenance_disclaimer: str = Field(
        default=(
            "Pareto optimization results are counterfactual simulations generated using synthetic Customer Agents "
            "and do not constitute guaranteed financial outcomes."
        ),
        description="Mandatory disclaimer",
    )
