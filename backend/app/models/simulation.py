"""
Simulation data models, configuration schemas, virtual environment contracts, and KPI definitions.
Represents the state, environment, and outcomes of the Payment Twin simulation.
"""

from enum import Enum
import math
from typing import Any, Dict, List, Optional, Tuple
from pydantic import BaseModel, Field

from app.models.agent import AgentArchetype, CustomerAgent, FunnelState
from app.models.dna import BehavioralDNAProfile


class ModelledLatencyAssumptions(BaseModel):
    """
    Explicit, configurable latency parameters representing modelled assumptions.
    Stored as (mean_seconds, std_dev_seconds) for Normal sampling.
    """

    upi_auth_latency_sec: Tuple[float, float] = Field(
        default=(4.5, 1.2), description="Mean and std dev in seconds for UPI 2FA/App approval latency"
    )
    card_auth_latency_sec: Tuple[float, float] = Field(
        default=(8.5, 2.5), description="Mean and std dev in seconds for Card 3DS OTP verification latency"
    )
    netbanking_auth_latency_sec: Tuple[float, float] = Field(
        default=(12.0, 3.5), description="Mean and std dev in seconds for Netbanking bank portal redirect latency"
    )
    wallet_auth_latency_sec: Tuple[float, float] = Field(
        default=(3.5, 1.0), description="Mean and std dev in seconds for Wallet 1-click/OTP latency"
    )
    gateway_proc_latency_sec: Tuple[float, float] = Field(
        default=(1.5, 0.4), description="Mean and std dev in seconds for Acquirer/Gateway network processing latency"
    )


class VirtualPaymentEnvironment(BaseModel):
    """
    Virtual payment checkout and gateway environment that consumes Behavioral DNA
    and models gateway rail execution, bank effects, latency, and MDR fees.
    """

    # DNA-Derived Attributes
    method_success_rates: Dict[str, float] = Field(
        default_factory=dict, description="P(success | method) from DNA success dynamics"
    )
    bank_success_rates: Dict[str, float] = Field(
        default_factory=dict, description="P(success | bank) from DNA success dynamics"
    )
    auth_failure_rate: float = Field(
        default=0.08, ge=0.0, le=1.0, description="P(failure at authentication stage) derived from failure diagnostics"
    )
    top_error_reasons: Dict[str, float] = Field(
        default_factory=dict, description="Distribution of error reasons from DNA"
    )
    mdr_rates_percent: Dict[str, float] = Field(
        default_factory=dict, description="Merchant Discount Rate percentage per method from DNA fee economics"
    )
    tax_rate_percent: float = Field(
        default=18.0, ge=0.0, le=100.0, description="Tax rate percentage on gateway processing fees (e.g. 18% GST)"
    )

    # Modelled Assumptions (Explicit & Configurable)
    latency_assumptions: ModelledLatencyAssumptions = Field(
        default_factory=ModelledLatencyAssumptions,
        description="Explicit latency assumptions for auth and processing stages",
    )
    network_outage_multiplier: float = Field(
        default=1.0, ge=0.0, le=10.0, description="1.0 = normal baseline; values < 1.0 degrade network success rates"
    )

    @classmethod
    def from_dna(
        cls, dna: BehavioralDNAProfile, latency_config: Optional[ModelledLatencyAssumptions] = None
    ) -> "VirtualPaymentEnvironment":
        """
        Constructs a VirtualPaymentEnvironment strictly grounded in the supplied Behavioral DNA.
        """
        # 1. Method Success Rates
        method_rates: Dict[str, float] = {}
        for m, metric in dna.success_dynamics.by_method.items():
            method_rates[m] = metric.rate

        # If overall rate exists but specific methods missing, fill from overall
        if not method_rates and dna.success_dynamics.overall_success_rate is not None:
            method_rates["upi"] = dna.success_dynamics.overall_success_rate
            method_rates["card"] = dna.success_dynamics.overall_success_rate
            method_rates["netbanking"] = dna.success_dynamics.overall_success_rate

        # 2. Bank Success Rates
        bank_rates: Dict[str, float] = {}
        for b, metric in dna.success_dynamics.by_bank.items():
            bank_rates[b] = metric.rate

        # 3. Auth Failure Share from Failure Diagnostics
        auth_step_share = dna.failure_diagnostics.error_step_distribution.get("payment_authentication", 0.60)
        overall_fail_rate = (1.0 - (dna.success_dynamics.overall_success_rate or 0.85))
        auth_failure_rate = round(overall_fail_rate * auth_step_share, 4)

        # 4. Error reasons
        error_reasons = dna.failure_diagnostics.top_error_reasons

        # 5. MDR & Tax Rates
        mdr_map = dna.fee_economics.mdr_by_method_percent
        tax_rate = dna.fee_economics.effective_tax_rate_percent or 18.0

        return cls(
            method_success_rates=method_rates,
            bank_success_rates=bank_rates,
            auth_failure_rate=max(0.01, min(0.50, auth_failure_rate)),
            top_error_reasons=error_reasons,
            mdr_rates_percent=mdr_map,
            tax_rate_percent=tax_rate,
            latency_assumptions=latency_config or ModelledLatencyAssumptions(),
            network_outage_multiplier=1.0,
        )

    def get_success_probability(self, method: str, bank: Optional[str] = None) -> float:
        """
        Computes the effective capture probability for a given instrument and bank without double-applying.
        """
        base_rate = self.method_success_rates.get(method, 0.85)

        # Incorporate bank-level empirical modifier if available
        if bank and bank in self.bank_success_rates:
            bank_rate = self.bank_success_rates[bank]
            # Blend 70% method + 30% bank to avoid extreme divergence
            effective = 0.70 * base_rate + 0.30 * bank_rate
        else:
            effective = base_rate

        # Apply network multiplier
        effective = effective * self.network_outage_multiplier
        return max(0.01, min(0.99, effective))

    def get_fees_and_taxes(self, method: str, amount_inr: float) -> Tuple[float, float]:
        """
        Calculates gateway processing fees and taxes in INR for a transaction.
        """
        mdr_pct = self.mdr_rates_percent.get(method, 0.0)
        fee_inr = round(amount_inr * (mdr_pct / 100.0), 2)
        tax_inr = round(fee_inr * (self.tax_rate_percent / 100.0), 2)
        return fee_inr, tax_inr


class SimulationConfig(BaseModel):
    """
    Input configuration for a Payment Twin simulation run.
    """

    simulation_id: Optional[str] = Field(default=None, description="Deterministic or custom simulation run identifier")
    population_size: int = Field(default=1000, ge=1, le=10000, description="Customer agent population size")
    random_seed: int = Field(default=42, ge=0, description="Master deterministic simulation seed")
    max_retries_override: Optional[int] = Field(default=None, ge=0, le=5, description="Optional override for agent retry limit")
    timeout_seconds_override: Optional[float] = Field(default=None, ge=5.0, le=300.0, description="Optional session timeout override")
    enable_event_traces: bool = Field(default=True, description="Whether to capture per-agent event logs")
    preview_agent_count: int = Field(default=10, ge=0, le=100, description="Number of agent execution traces to return in preview")
    dataset: Optional[str] = Field(default=None, description="Optional specific JSONL dataset filename to profile")
    latency_assumptions: Optional[ModelledLatencyAssumptions] = Field(
        default=None, description="Optional custom latency parameters"
    )


class SimulationEvent(BaseModel):
    """
    Structured timestamped event emitted during an agent's traversal of the payment funnel.
    """

    event_id: str = Field(..., description="Unique event identifier")
    simulation_id: str = Field(..., description="Simulation run identifier")
    agent_id: str = Field(..., description="Agent emitting the event")
    timestamp_ms: int = Field(..., ge=0, description="Monotonically increasing elapsed time in milliseconds")
    state_from: FunnelState = Field(..., description="State before transition")
    state_to: FunnelState = Field(..., description="State after transition")
    action: str = Field(..., description="Semantic action (e.g. SESSION_START, SELECT_METHOD, OTP_VERIFIED, RETRY_ATTEMPT)")
    method: Optional[str] = Field(default=None, description="Active payment instrument during event")
    amount_inr: float = Field(..., ge=0.0, description="Transaction amount in INR")
    attempt_number: int = Field(default=1, ge=1, description="Current payment attempt number")
    details: Dict[str, Any] = Field(default_factory=dict, description="Structured contextual event payload")


class AgentSimulationResult(BaseModel):
    """
    Complete lifecycle outcome and trace for a single simulated CustomerAgent.
    """

    agent_id: str = Field(..., description="Unique agent identifier")
    archetype: AgentArchetype = Field(..., description="Agent archetype")
    is_successful: bool = Field(..., description="True if payment was successfully captured")
    is_abandoned: bool = Field(..., description="True if session was abandoned without capture")
    final_state: FunnelState = Field(..., description="Final terminal state")
    total_attempts: int = Field(..., ge=0, description="Total payment attempts executed by agent")
    final_method: str = Field(..., description="Payment method used for final attempt")
    method_switched: bool = Field(default=False, description="True if agent switched payment method during execution")
    amount_inr: float = Field(..., ge=0.0, description="Order transaction amount in INR (preserved across retries)")
    fee_inr: float = Field(default=0.0, ge=0.0, description="Gateway processing fees incurred in INR")
    tax_inr: float = Field(default=0.0, ge=0.0, description="Taxes on gateway fees in INR")
    terminal_reason: Optional[str] = Field(default=None, description="Termination cause: CAPTURED, MAX_RETRIES_EXCEEDED, TIMEOUT")
    total_duration_ms: int = Field(default=0, ge=0, description="Total session duration in milliseconds")
    event_trace: List[SimulationEvent] = Field(default_factory=list, description="Chronological event log")


class MethodSimulationKPI(BaseModel):
    """
    Performance metrics segmented by individual payment instrument.
    """

    attempted_count: int = Field(default=0, ge=0, description="Total attempts initiated on this method")
    captured_count: int = Field(default=0, ge=0, description="Captured transactions on this method")
    failed_count: int = Field(default=0, ge=0, description="Failed attempts on this method")
    success_rate_percent: float = Field(default=0.0, ge=0.0, le=100.0, description="Conversion percentage (0-100%)")
    attempted_volume_inr: float = Field(default=0.0, ge=0.0, description="Total volume attempted in INR")
    captured_volume_inr: float = Field(default=0.0, ge=0.0, description="Captured volume in INR")
    processing_fees_inr: float = Field(default=0.0, ge=0.0, description="Total processing fees incurred in INR")


class SimulationKPIs(BaseModel):
    """
    Executive summary Key Performance Indicators for a simulation run.
    """

    total_agents: int = Field(..., ge=1, description="Total customer agents in population")
    successful_transactions: int = Field(..., ge=0, description="Orders successfully captured")
    failed_transactions: int = Field(..., ge=0, description="Orders that ended in terminal failure")
    abandoned_transactions: int = Field(..., ge=0, description="Orders abandoned due to timeout/friction")
    total_payment_attempts: int = Field(..., ge=0, description="Total payment attempts across all orders")
    retry_attempts_count: int = Field(default=0, ge=0, description="Total retry attempts executed (> 1st attempt)")
    method_switches_count: int = Field(default=0, ge=0, description="Total method switches executed on retry")
    conversion_rate_percent: float = Field(..., ge=0.0, le=100.0, description="Capture conversion rate (successful / total)")
    failure_rate_percent: float = Field(..., ge=0.0, le=100.0, description="Terminal failure rate percentage")
    abandonment_rate_percent: float = Field(..., ge=0.0, le=100.0, description="Session abandonment rate percentage")
    gross_attempted_volume_inr: float = Field(..., ge=0.0, description="Gross Merchandise Value (GMV) of all unique orders")
    captured_volume_inr: float = Field(..., ge=0.0, description="Total volume captured in INR")
    lost_volume_inr: float = Field(..., ge=0.0, description="Total volume lost due to decline/abandonment in INR")
    total_processing_fees_inr: float = Field(default=0.0, ge=0.0, description="Total gateway MDR fees in INR")
    total_taxes_inr: float = Field(default=0.0, ge=0.0, description="Total taxes on processing fees in INR")
    net_merchant_revenue_inr: float = Field(..., description="Net revenue (captured_volume - fees - taxes) in INR")
    average_ticket_size_inr: float = Field(..., ge=0.0, description="Average order value in INR")
    average_attempts_per_success: float = Field(default=1.0, ge=0.0, description="Average attempts required per captured order")
    execution_duration_ms: float = Field(default=0.0, ge=0.0, description="Engine execution time in milliseconds")


class SimulationResult(BaseModel):
    """
    Complete response model for a single-run Payment Twin simulation.
    """

    status: str = Field(default="completed", description="Simulation status: 'completed', 'unavailable', or 'error'")
    message: str = Field(..., description="Result message or unavailability explanation")
    simulation_id: str = Field(..., description="Simulation run identifier")
    population_size: int = Field(default=0, ge=0, description="Population size simulated")
    random_seed: int = Field(default=42, ge=0, description="Simulation master random seed")
    dna_provenance_type: str = Field(
        default="OBSERVED_RAZORPAY_DATA", description="Inherited provenance category"
    )
    is_synthetic_benchmark: bool = Field(default=False, description="True if derived from synthetic benchmark DNA")
    provenance_disclaimer: str = Field(
        default=(
            "Payment Twin simulation results are forward projections generated by synthetic Customer Agents "
            "in a virtual payment environment and do not constitute financial guarantees."
        ),
        description="Mandatory disclaimer",
    )
    kpis: Optional[SimulationKPIs] = Field(default=None, description="Executive KPIs")
    method_breakdown: Dict[str, MethodSimulationKPI] = Field(
        default_factory=dict, description="Performance segmented per payment method"
    )
    funnel_dropoffs: Dict[str, int] = Field(
        default_factory=dict, description="Drop counts per funnel stage (browsing, auth_timeout, gateway_decline, max_retries)"
    )
    preview_agent_traces: List[AgentSimulationResult] = Field(
        default_factory=list, description="Detailed event traces for preview agents"
    )


class MonteCarloMetricDistribution(BaseModel):
    """
    Statistical distribution across multiple stochastic Monte Carlo simulation runs.
    """

    mean: float = Field(..., description="Arithmetic mean across runs")
    std_dev: float = Field(..., description="Sample standard deviation across runs")
    ci_95: List[float] = Field(..., description="95% Confidence Interval [lower, upper] for the mean")
    p5: float = Field(..., description="5th percentile outcome")
    p50: float = Field(..., description="Median (50th percentile) outcome")
    p95: float = Field(..., description="95th percentile outcome")


class MonteCarloSimulationResult(BaseModel):
    """
    Aggregate response model for multi-run Monte Carlo uncertainty analysis.
    """

    status: str = Field(default="completed", description="Status: 'completed', 'unavailable', or 'error'")
    message: str = Field(..., description="Result message or explanation")
    simulation_id: str = Field(..., description="Monte Carlo sweep identifier")
    total_runs: int = Field(default=0, ge=0, description="Number of Monte Carlo simulation runs executed")
    population_per_run: int = Field(default=0, ge=0, description="Population size per run")
    master_random_seed: int = Field(default=42, ge=0, description="Master seed for reproducible runs")
    dna_provenance_type: str = Field(default="OBSERVED_RAZORPAY_DATA", description="Inherited DNA provenance")
    is_synthetic_benchmark: bool = Field(default=False, description="True if benchmark DNA")
    provenance_disclaimer: str = Field(
        default=(
            "Payment Twin simulation results are forward projections generated by synthetic Customer Agents "
            "in a virtual payment environment and do not constitute financial guarantees."
        ),
        description="Mandatory disclaimer",
    )
    summary_metrics: Dict[str, MonteCarloMetricDistribution] = Field(
        default_factory=dict, description="Distributions for key KPIs (conversion_rate, captured_volume, net_revenue, etc.)"
    )
    execution_duration_ms: float = Field(default=0.0, ge=0.0, description="Total execution duration in milliseconds")


class MonteCarloRequest(BaseModel):
    """
    Request model for POST /api/v1/simulation/monte-carlo.
    """

    population_size: int = Field(default=1000, ge=1, le=10000, description="Population size per run")
    monte_carlo_runs: int = Field(default=20, ge=2, le=100, description="Number of stochastic runs to execute")
    random_seed: int = Field(default=42, ge=0, description="Master random seed")
    dataset: Optional[str] = Field(default=None, description="Optional specific JSONL dataset filename to profile")
