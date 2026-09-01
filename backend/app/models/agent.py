"""
Customer Agent domain schemas, state machine definitions, and population metadata.
Represents individual stateful synthetic actors calibrated to Behavioral DNA.
"""

from enum import Enum
import math
from typing import Any, Dict, List, Optional, Set
from pydantic import BaseModel, Field, field_validator


class FunnelState(str, Enum):
    """
    Explicit checkout funnel states for customer agent decision execution.
    """

    BROWSING = "BROWSING"
    CHECKOUT_OPENED = "CHECKOUT_OPENED"
    METHOD_SELECTED = "METHOD_SELECTED"
    AUTHENTICATING = "AUTHENTICATING"
    PROCESSING = "PROCESSING"
    SUCCESS = "SUCCESS"
    FAILED = "FAILED"
    RETRY_EVALUATION = "RETRY_EVALUATION"
    ABANDONED = "ABANDONED"
    TERMINATED_SUCCESS = "TERMINATED_SUCCESS"
    TERMINATED_ABANDONED = "TERMINATED_ABANDONED"


# Formal State Transition Graph: from_state -> {allowed_to_states}
VALID_STATE_TRANSITIONS: Dict[FunnelState, Set[FunnelState]] = {
    FunnelState.BROWSING: {
        FunnelState.CHECKOUT_OPENED,
        FunnelState.ABANDONED,
    },
    FunnelState.CHECKOUT_OPENED: {
        FunnelState.METHOD_SELECTED,
        FunnelState.ABANDONED,
    },
    FunnelState.METHOD_SELECTED: {
        FunnelState.AUTHENTICATING,
        FunnelState.ABANDONED,
    },
    FunnelState.AUTHENTICATING: {
        FunnelState.PROCESSING,
        FunnelState.FAILED,
        FunnelState.ABANDONED,
    },
    FunnelState.PROCESSING: {
        FunnelState.SUCCESS,
        FunnelState.FAILED,
        FunnelState.ABANDONED,
    },
    FunnelState.SUCCESS: {
        FunnelState.TERMINATED_SUCCESS,
    },
    FunnelState.FAILED: {
        FunnelState.RETRY_EVALUATION,
        FunnelState.ABANDONED,
    },
    FunnelState.RETRY_EVALUATION: {
        FunnelState.METHOD_SELECTED,  # Method switched or reselected
        FunnelState.AUTHENTICATING,   # Retrying authentication directly
        FunnelState.PROCESSING,       # Retrying gateway processing
        FunnelState.ABANDONED,        # Exhausted retries or gave up
    },
    FunnelState.ABANDONED: {
        FunnelState.TERMINATED_ABANDONED,
    },
    FunnelState.TERMINATED_SUCCESS: set(),  # Terminal state
    FunnelState.TERMINATED_ABANDONED: set(),  # Terminal state
}


def validate_state_transition(from_state: FunnelState, to_state: FunnelState) -> bool:
    """
    Validates whether a proposed state transition is legally allowed by the state machine.
    """
    allowed_targets = VALID_STATE_TRANSITIONS.get(from_state, set())
    return to_state in allowed_targets


class AgentArchetype(str, Enum):
    """
    Structural behavioral archetype categories providing bounded heterogeneity.
    """

    FAST_CHECKOUT = "FAST_CHECKOUT"
    PATIENT_RETRYER = "PATIENT_RETRYER"
    METHOD_SWITCHER = "METHOD_SWITCHER"
    HIGH_TICKET = "HIGH_TICKET"


class AgentEvent(BaseModel):
    """
    Timestamped transition or action event in an agent's lifecycle.
    """

    timestamp_relative_sec: float = Field(default=0.0, ge=0.0, description="Relative timestamp from session start")
    from_state: FunnelState = Field(..., description="Origin state")
    to_state: FunnelState = Field(..., description="Target state")
    action: str = Field(..., description="Semantic action label (e.g. SELECT_METHOD, RETRY_ATTEMPT)")
    details: Dict[str, Any] = Field(default_factory=dict, description="Arbitrary structured context payload")


class ObservedPreferences(BaseModel):
    """
    DNA-Grounded / Empirically Observed attributes.
    Sampled directly from empirical Behavioral DNA distributions.
    """

    primary_method: str = Field(..., description="Primary preferred payment instrument (upi, card, netbanking, etc.)")
    secondary_method: Optional[str] = Field(
        default=None, description="Backup payment instrument for fallback/retry switching"
    )
    sub_instrument: Optional[str] = Field(
        default=None, description="Sub-instrument identifier (e.g. okaxis for UPI, HDFC for Card/Netbanking)"
    )
    transaction_amount_inr: float = Field(..., gt=0.0, description="Transaction ticket size in INR")
    amount_tier: str = Field(
        ..., description="Amount bracket: tier_low_under_500, tier_mid_500_to_2500, or tier_high_above_2500"
    )


class LatentParameters(BaseModel):
    """
    Latent Synthetic Variables (Calibrated & Modelled).
    Calibrated against DNA aggregate priors where available, otherwise explicit modelled assumptions.
    """

    max_retries: int = Field(default=1, ge=0, le=5, description="Maximum number of failure retries permitted")
    retry_propensity: float = Field(
        ..., ge=0.0, le=1.0, description="Probability of initiating a retry following a failed attempt"
    )
    method_switch_propensity: float = Field(
        ..., ge=0.0, le=1.0, description="Probability of switching to secondary_method when executing a retry"
    )
    friction_sensitivity: float = Field(
        ..., ge=0.0, le=1.0, description="Sensitivity to 2FA delays and friction (higher = more likely to abandon)"
    )
    patience_timeout_seconds: float = Field(
        ..., ge=1.0, le=300.0, description="Maximum wait time in seconds before session abandonment"
    )
    is_retry_calibrated: bool = Field(
        default=False, description="True if retry_propensity is calibrated to empirical DNA; False if modelled assumption"
    )
    is_method_switch_calibrated: bool = Field(
        default=False, description="True if switch_propensity is calibrated to empirical DNA; False if modelled assumption"
    )


class RuntimeState(BaseModel):
    """
    Dynamic execution state tracking during simulation execution.
    """

    attempt_count: int = Field(default=0, ge=0, description="Number of payment attempts executed so far")
    active_method: Optional[str] = Field(default=None, description="Currently selected payment instrument")
    has_completed: bool = Field(default=False, description="True if agent reached a terminal state")
    is_successful: bool = Field(default=False, description="True if agent successfully captured payment")
    terminal_reason: Optional[str] = Field(default=None, description="Reason for termination (e.g. CAPTURED, MAX_RETRIES_EXCEEDED)")


class CustomerAgent(BaseModel):
    """
    Complete stateful Synthetic Customer Agent object.
    """

    agent_id: str = Field(..., description="Unique deterministic identifier for the agent")
    archetype: AgentArchetype = Field(..., description="Assigned behavioral archetype")
    random_seed: int = Field(..., description="Isolated random seed used for this agent's stochastic decisions")
    current_state: FunnelState = Field(default=FunnelState.BROWSING, description="Current checkout state")
    observed_preferences: ObservedPreferences = Field(..., description="DNA-grounded observed preferences")
    latent_parameters: LatentParameters = Field(..., description="Calibrated and modelled latent parameters")
    runtime_state: RuntimeState = Field(default_factory=RuntimeState, description="Execution state")
    event_history: List[AgentEvent] = Field(default_factory=list, description="Audit log of state transitions")

    def transition_to(self, new_state: FunnelState, action: str, details: Optional[Dict[str, Any]] = None) -> bool:
        """
        Executes a validated state transition and records an event in history.
        """
        if not validate_state_transition(self.current_state, new_state):
            return False

        event = AgentEvent(
            timestamp_relative_sec=0.0,
            from_state=self.current_state,
            to_state=new_state,
            action=action,
            details=details or {},
        )
        self.current_state = new_state
        self.event_history.append(event)

        if new_state == FunnelState.TERMINATED_SUCCESS:
            self.runtime_state.has_completed = True
            self.runtime_state.is_successful = True
            self.runtime_state.terminal_reason = "PAYMENT_CAPTURED"
        elif new_state == FunnelState.TERMINATED_ABANDONED:
            self.runtime_state.has_completed = True
            self.runtime_state.is_successful = False
            self.runtime_state.terminal_reason = self.runtime_state.terminal_reason or "ABANDONED"

        return True


class CalibrationDiagnostics(BaseModel):
    """
    Statistical validation metrics comparing generated population to input Behavioral DNA.
    """

    method_distribution_mae: Optional[float] = Field(
        default=None, description="Mean Absolute Error between population method share and DNA priors"
    )
    amount_mean_error_inr: Optional[float] = Field(
        default=None, description="Difference between population mean amount and DNA mean amount in INR"
    )
    retry_rate_drift: Optional[float] = Field(
        default=None, description="Difference between population mean retry propensity and DNA retry rate"
    )
    method_switch_drift: Optional[float] = Field(
        default=None, description="Difference between population mean switch propensity and DNA switch rate"
    )
    archetype_distribution: Dict[str, int] = Field(
        default_factory=dict, description="Counts of generated agents per archetype"
    )
    is_calibrated: bool = Field(default=True, description="True if population matches DNA within acceptable tolerances")
    warnings: List[str] = Field(default_factory=list, description="Methodological notes and calibration caveats")


class PopulationMetadata(BaseModel):
    """
    Lineage, provenance, and configuration metadata for a generated customer agent population.
    """

    population_id: str = Field(..., description="Unique identifier for the generated population")
    population_size: int = Field(..., ge=1, le=10000, description="Total number of agents generated")
    random_seed: int = Field(..., description="Master random seed used for deterministic generation")
    source_dna_version: str = Field(default="1.0.0", description="Schema version of source Behavioral DNA")
    dna_provenance_type: str = Field(
        ..., description="Inherited provenance: OBSERVED_RAZORPAY_DATA or SYNTHETIC_BENCHMARK_DATA"
    )
    is_synthetic_benchmark: bool = Field(
        default=False, description="Inherited from source DNA: True if benchmark; False if empirical Razorpay"
    )
    generated_at_iso: str = Field(..., description="Generation timestamp in ISO 8601 UTC")
    provenance_disclaimer: str = Field(
        default=(
            "Customer Agents are calibrated synthetic actors derived from aggregate Behavioral DNA distributions, "
            "not direct individual customer records."
        ),
        description="Mandatory provenance disclaimer",
    )


class AgentGenerationRequest(BaseModel):
    """
    Request model for POST /api/v1/agents/generate.
    """

    population_size: int = Field(default=1000, ge=1, le=10000, description="Number of agents to generate (1 to 10000)")
    random_seed: int = Field(default=42, ge=0, description="Master deterministic random seed")
    preview_count: int = Field(default=10, ge=0, le=100, description="Number of agents to return in API preview")
    dataset: Optional[str] = Field(default=None, description="Optional specific JSONL dataset filename to profile")


class AgentGenerationResponse(BaseModel):
    """
    Response model for POST /api/v1/agents/generate.
    """

    status: str = Field(..., description="Status: 'ok', 'unavailable', or 'error'")
    message: str = Field(..., description="Description of generation result")
    population_metadata: Optional[PopulationMetadata] = None
    calibration_diagnostics: Optional[CalibrationDiagnostics] = None
    total_generated_count: int = Field(default=0, ge=0, description="Total count of agents generated internally")
    preview_agents: List[CustomerAgent] = Field(
        default_factory=list, description="Preview slice of generated agents (capped by preview_count)"
    )
