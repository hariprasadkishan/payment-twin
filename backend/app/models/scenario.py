"""
What-If Scenario domain schemas, intervention models, comparison metrics, and matrix contracts.
Represents counterfactual experiments and policy simulations on the Payment Twin.
"""

from enum import Enum
import math
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field, field_validator

from app.models.simulation import (
    ModelledLatencyAssumptions,
    SimulationConfig,
    SimulationKPIs,
    SimulationResult,
    VirtualPaymentEnvironment,
)


class InterventionType(str, Enum):
    """
    Categorical enumeration of supported What-If intervention types.
    """

    METHOD_SUCCESS_RATE = "METHOD_SUCCESS_RATE"
    METHOD_ROUTING_PREFERENCE = "METHOD_ROUTING_PREFERENCE"
    RETRY_POLICY = "RETRY_POLICY"
    METHOD_SWITCH_POLICY = "METHOD_SWITCH_POLICY"
    LATENCY_FRICTION = "LATENCY_FRICTION"
    FEE_MDR_RATE = "FEE_MDR_RATE"
    BANK_HEALTH_MODIFIER = "BANK_HEALTH_MODIFIER"


class InterventionMode(str, Enum):
    """
    Mode of parameter modification: ABSOLUTE replacement or DELTA shift.
    """

    ABSOLUTE = "ABSOLUTE"
    DELTA = "DELTA"


class ScenarioIntervention(BaseModel):
    """
    Declarative specification of a single What-If intervention or policy change.
    """

    intervention_type: InterventionType = Field(..., description="Target intervention category")
    target: Optional[str] = Field(
        default=None, description="Target payment method (upi, card, netbanking) or issuing bank (HDFC, SBIN)"
    )
    mode: Optional[InterventionMode] = Field(
        default=InterventionMode.ABSOLUTE, description="ABSOLUTE replacement or DELTA additive shift"
    )
    value: Optional[float] = Field(
        default=None, description="Numerical parameter value (e.g. success rate, delta rate, or multiplier)"
    )
    shift_percentage: Optional[float] = Field(
        default=None, ge=-100.0, le=100.0, description="Routing shift percentage for METHOD_ROUTING_PREFERENCE"
    )
    max_retries_override: Optional[int] = Field(
        default=None, ge=0, le=5, description="Override for max retry limit in RETRY_POLICY"
    )
    retry_propensity_multiplier: Optional[float] = Field(
        default=None, ge=0.0, le=3.0, description="Multiplier for retry propensity in RETRY_POLICY"
    )
    switch_propensity_override: Optional[float] = Field(
        default=None, ge=0.0, le=1.0, description="Override for method switch propensity in METHOD_SWITCH_POLICY"
    )
    preferred_fallback_method: Optional[str] = Field(
        default=None, description="Target fallback instrument in METHOD_SWITCH_POLICY"
    )
    auth_latency_multiplier: Optional[float] = Field(
        default=None, ge=0.1, le=5.0, description="Latency multiplier for 2FA/Auth in LATENCY_FRICTION"
    )
    gateway_proc_latency_multiplier: Optional[float] = Field(
        default=None, ge=0.1, le=5.0, description="Latency multiplier for gateway processing in LATENCY_FRICTION"
    )
    health_multiplier: Optional[float] = Field(
        default=None, ge=0.0, le=1.0, description="Health multiplier for BANK_HEALTH_MODIFIER (0.0 = complete outage)"
    )
    description: Optional[str] = Field(
        default=None, description="Human-readable description of intervention"
    )

    @field_validator("target")
    @classmethod
    def validate_target(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            return v.strip().lower()
        return v


class ScenarioConfig(BaseModel):
    """
    Configuration specification for a single counterfactual What-If scenario.
    """

    scenario_id: str = Field(..., description="Unique scenario identifier (e.g. scen_upi_boost_5pct)")
    scenario_name: str = Field(..., description="Human-readable scenario title")
    description: Optional[str] = Field(default=None, description="Detailed explanation of the policy change")
    interventions: List[ScenarioIntervention] = Field(
        ..., min_length=1, description="List of declarative interventions to apply"
    )
    population_size: int = Field(default=1000, ge=1, le=10000, description="Customer population size to simulate")
    random_seed: int = Field(default=42, ge=0, description="Master deterministic simulation seed")
    preview_agent_count: int = Field(default=10, ge=0, le=100, description="Preview traces to capture")
    dataset: Optional[str] = Field(default=None, description="Optional specific JSONL dataset to profile")


class MetricComparison(BaseModel):
    """
    Comparative delta between baseline and scenario for a specific metric.
    """

    metric_name: str = Field(..., description="Name of the metric evaluated")
    baseline_value: float = Field(..., description="Value under unmutated baseline simulation")
    scenario_value: float = Field(..., description="Value under counterfactual scenario simulation")
    absolute_delta: float = Field(..., description="scenario_value - baseline_value")
    percentage_delta: Optional[float] = Field(
        default=None, description="Percentage change: ((scenario - baseline) / |baseline|) * 100"
    )


class AttributionStep(BaseModel):
    """
    Single step in a transparent deterministic causal attribution chain.
    """

    step_order: int = Field(..., ge=1, description="Sequential order in the attribution chain")
    category: str = Field(
        ..., description="Attribution tier: DIRECT_LEVER, FUNNEL_REACTION, CONVERSION_IMPACT, or FINANCIAL_BOTTOM_LINE"
    )
    description: str = Field(..., description="Explanation of mechanism and observed change")
    quantitative_impact: Dict[str, Any] = Field(
        default_factory=dict, description="Numerical metric values and deltas associated with this step"
    )


class ScenarioComparison(BaseModel):
    """
    Paired comparison result evaluating a scenario against baseline conditions.
    """

    comparison_id: str = Field(..., description="Unique comparison identifier")
    scenario_id: str = Field(..., description="Scenario identifier")
    scenario_name: str = Field(..., description="Scenario title")
    dna_provenance_type: str = Field(
        default="OBSERVED_RAZORPAY_DATA", description="Inherited provenance category"
    )
    is_synthetic_benchmark: bool = Field(default=False, description="True if benchmark DNA")
    provenance_disclaimer: str = Field(
        default=(
            "What-If scenario comparisons are counterfactual simulations generated using synthetic Customer Agents "
            "and do not constitute guaranteed financial outcomes."
        ),
        description="Mandatory disclaimer",
    )
    metric_comparisons: Dict[str, MetricComparison] = Field(
        default_factory=dict, description="Comparative deltas for all key KPIs"
    )
    method_deltas: Dict[str, Dict[str, float]] = Field(
        default_factory=dict, description="Deltas segmented per payment method"
    )
    attribution_trail: List[AttributionStep] = Field(
        default_factory=list, description="Step-by-step causal attribution explaining why metrics changed"
    )
    baseline_kpis: Optional[SimulationKPIs] = Field(default=None, description="Baseline executive KPIs")
    scenario_kpis: Optional[SimulationKPIs] = Field(default=None, description="Scenario executive KPIs")


class ScenarioRunRequest(BaseModel):
    """
    Request model for POST /api/v1/scenarios/run.
    """

    scenario: ScenarioConfig = Field(..., description="Scenario configuration to execute")


class ScenarioCompareRequest(BaseModel):
    """
    Request model for POST /api/v1/scenarios/compare.
    """

    scenarios: List[ScenarioConfig] = Field(
        ..., min_length=1, max_length=25, description="List of scenarios to evaluate against baseline (max 25)"
    )
    population_size: int = Field(default=1000, ge=1, le=10000, description="Common population size")
    random_seed: int = Field(default=42, ge=0, description="Common Random Number master seed")
    dataset: Optional[str] = Field(default=None, description="Optional specific dataset to profile")


class ScenarioCompareResponse(BaseModel):
    """
    Response model for POST /api/v1/scenarios/compare.
    """

    status: str = Field(default="completed", description="Status: 'completed', 'unavailable', or 'error'")
    message: str = Field(..., description="Execution summary or unavailability notice")
    baseline_simulation_id: Optional[str] = None
    baseline_kpis: Optional[SimulationKPIs] = None
    comparisons: List[ScenarioComparison] = Field(
        default_factory=list, description="List of paired comparisons against baseline"
    )


class ScenarioMatrixRequest(BaseModel):
    """
    Request model for POST /api/v1/scenarios/matrix.
    Executes a Cartesian product grid sweep over multiple intervention parameters.
    """

    matrix_name: str = Field(default="Optimization Grid Sweep", description="Title for matrix sweep")
    interventions_grid: Dict[str, List[float]] = Field(
        ...,
        description="Grid mapping parameter keys (e.g. 'upi_success_rate', 'card_mdr') to candidate values (max 25 combinations)",
    )
    population_size: int = Field(default=1000, ge=1, le=10000, description="Population size per scenario")
    random_seed: int = Field(default=42, ge=0, description="Common Random Number master seed")
    ranking_criterion: str = Field(
        default="net_merchant_revenue_inr",
        description="Ranking metric: net_merchant_revenue_inr, conversion_rate_percent, or processing_fees_inr",
    )
    dataset: Optional[str] = Field(default=None, description="Optional specific dataset to profile")


class MatrixScenarioRankItem(BaseModel):
    """
    Single scenario entry in the ranked matrix sweep table.
    """

    rank: int = Field(..., ge=1, description="Rank according to ranking_criterion")
    scenario_id: str = Field(..., description="Identifier for this grid configuration")
    parameter_values: Dict[str, float] = Field(
        default_factory=dict, description="Parameter values tested in this scenario"
    )
    conversion_rate_percent: float = Field(..., description="Simulated conversion rate percentage")
    captured_volume_inr: float = Field(..., description="Captured volume in INR")
    net_merchant_revenue_inr: float = Field(..., description="Net merchant revenue in INR")
    processing_fees_inr: float = Field(..., description="Total processing fees in INR")
    revenue_delta_percent: Optional[float] = Field(
        default=None, description="Percentage change in net revenue compared to baseline"
    )
    conversion_delta_percent: Optional[float] = Field(
        default=None, description="Percentage change in conversion rate compared to baseline"
    )


class ScenarioMatrixResponse(BaseModel):
    """
    Response model for POST /api/v1/scenarios/matrix.
    """

    status: str = Field(default="completed", description="Status: 'completed', 'unavailable', or 'error'")
    message: str = Field(..., description="Result message or explanation")
    matrix_name: str = Field(..., description="Title of matrix sweep")
    total_scenarios_evaluated: int = Field(default=0, ge=0, description="Total Cartesian product scenarios evaluated")
    ranking_criterion: str = Field(..., description="Criterion used to rank scenarios")
    baseline_summary: Dict[str, float] = Field(
        default_factory=dict, description="Baseline KPI summary values for reference"
    )
    ranked_scenarios: List[MatrixScenarioRankItem] = Field(
        default_factory=list, description="Ranked scenarios table"
    )
