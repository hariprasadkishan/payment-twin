"""
Payment Guardian domain models, detector result contracts, alert lifecycle schemas,
and Twin handoff payloads.
"""

from enum import Enum
import math
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field, field_validator


class DetectorType(str, Enum):
    """
    Supported statistical drift detector algorithms.
    """

    PSI_CATEGORICAL = "PSI_CATEGORICAL"
    TWO_PROPORTION_ZTEST = "TWO_PROPORTION_ZTEST"
    FISHER_EXACT = "FISHER_EXACT"
    TWO_SAMPLE_KS = "TWO_SAMPLE_KS"
    CUSUM_SHIFT = "CUSUM_SHIFT"


class AlertSeverity(str, Enum):
    """
    Alert severity classification derived from effect magnitude, volume affected, and persistence.
    """

    INFO = "INFO"
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


class AlertStatus(str, Enum):
    """
    Stateful lifecycle of a Payment Guardian alert.
    """

    OPEN = "OPEN"
    ACKNOWLEDGED = "ACKNOWLEDGED"
    RESOLVED = "RESOLVED"
    RECOVERED = "RECOVERED"


class GuardianWindowMode(str, Enum):
    """
    Window mode for defining recent observation stream.
    """

    COUNT_BASED = "COUNT_BASED"
    TIME_BASED = "TIME_BASED"


class GuardianConfig(BaseModel):
    """
    Configuration parameters for statistical surveillance and drift thresholds.
    """

    window_mode: GuardianWindowMode = Field(
        default=GuardianWindowMode.COUNT_BASED, description="COUNT_BASED or TIME_BASED sliding window"
    )
    window_size_count: int = Field(
        default=200, ge=30, le=5000, description="Number of recent transactions to evaluate in COUNT_BASED mode"
    )
    window_size_hours: float = Field(
        default=4.0, ge=0.5, le=72.0, description="Timespan in hours to evaluate in TIME_BASED mode"
    )
    min_sample_threshold: int = Field(
        default=30, ge=10, le=500, description="Minimum sample size required in recent window before running tests"
    )
    psi_threshold_moderate: float = Field(
        default=0.10, ge=0.01, le=0.50, description="PSI threshold for moderate drift"
    )
    psi_threshold_significant: float = Field(
        default=0.25, ge=0.05, le=1.00, description="PSI threshold for significant drift"
    )
    alpha_fdr: float = Field(
        default=0.05, ge=0.001, le=0.20, description="Target False Discovery Rate (FDR) for Benjamini-Hochberg correction"
    )
    cusum_slack: float = Field(
        default=0.02, ge=0.001, le=0.20, description="CUSUM slack parameter k"
    )
    cusum_threshold: float = Field(
        default=0.08, ge=0.01, le=1.00, description="CUSUM decision threshold h for triggering alarm"
    )
    min_effect_size_capture_rate: float = Field(
        default=0.03, ge=0.005, le=0.50, description="Minimum practical drop in capture rate (3 percentage points)"
    )
    min_effect_size_method_share: float = Field(
        default=0.05, ge=0.01, le=0.50, description="Minimum practical shift in method share (5 percentage points)"
    )
    min_effect_size_bank_failure: float = Field(
        default=0.08, ge=0.01, le=0.50, description="Minimum practical surge in bank failure rate (8 percentage points)"
    )
    min_effect_size_aov: float = Field(
        default=0.15, ge=0.01, le=1.00, description="Minimum practical shift in median AOV (15%)"
    )
    recovery_consecutive_windows: int = Field(
        default=2, ge=1, le=10, description="Consecutive normalized evaluation windows required for auto-recovery"
    )
    dataset: Optional[str] = Field(default=None, description="Optional specific JSONL dataset to evaluate as recent telemetry")


class DetectorResult(BaseModel):
    """
    Statistical result emitted by a pure drift detector algorithm.
    """

    detector_type: DetectorType = Field(..., description="Detector algorithm used")
    metric_name: str = Field(..., description="Name of the monitored metric")
    target_entity: Optional[str] = Field(default=None, description="Entity under test (e.g. 'upi', 'HDFC', 'cards')")
    test_statistic: float = Field(..., description="Numerical test statistic (PSI, z-statistic, KS D, CUSUM S+)")
    p_value_raw: Optional[float] = Field(
        default=None, ge=0.0, le=1.0, description="Raw uncorrected p-value (None for PSI/CUSUM)"
    )
    p_value_adjusted_fdr: Optional[float] = Field(
        default=None, ge=0.0, le=1.0, description="Benjamini-Hochberg FDR-adjusted p-value"
    )
    baseline_value: float = Field(..., description="Baseline expectation from Behavioral DNA")
    observed_value: float = Field(..., description="Observed statistic in recent telemetry")
    absolute_delta: float = Field(..., description="observed_value - baseline_value")
    relative_delta_percent: Optional[float] = Field(
        default=None, description="Percentage relative change from baseline"
    )
    is_statistically_significant: bool = Field(
        ..., description="True if statistical threshold (p_adj < alpha or PSI >= moderate) is breached"
    )
    is_practically_significant: bool = Field(
        ..., description="True if absolute delta exceeds minimum practical business effect size"
    )
    sample_size_baseline: int = Field(..., ge=0, description="Sample count in baseline DNA")
    sample_size_recent: int = Field(..., ge=0, description="Sample count in recent observation window")
    details: Dict[str, Any] = Field(default_factory=dict, description="Additional contextual mathematical parameters")


class DiagnosticAssociation(BaseModel):
    """
    Evidence-based cross-tabulation linking a top-level anomaly to an underlying rail or bank.
    """

    entity_type: str = Field(..., description="Entity category (e.g. ISSUING_BANK, ERROR_REASON, SUB_INSTRUMENT)")
    entity_name: str = Field(..., description="Name of the entity (e.g. HDFC, incorrect_otp)")
    baseline_rate: float = Field(..., description="Historical baseline failure/decline rate")
    observed_rate: float = Field(..., description="Recent observed failure/decline rate")
    excess_failures_attributed: int = Field(..., ge=0, description="Estimated excess declines associated with this entity")
    relative_contribution_percent: float = Field(
        ..., ge=0.0, le=100.0, description="Share of total excess declines associated with this entity"
    )
    association_statement: str = Field(
        ..., description="Carefully worded empirical statement (e.g. 'HDFC-linked transactions accounted for 76% of excess UPI declines')"
    )


class BusinessImpact(BaseModel):
    """
    Quantified business and volume impact for an alert.
    """

    observed_failed_orders: int = Field(..., ge=0, description="Total observed failures in the window")
    observed_failed_volume_inr: float = Field(..., ge=0.0, description="Total volume of observed failed transactions")
    expected_failed_orders: int = Field(..., ge=0, description="Expected failures under baseline capture rate")
    excess_failed_orders: int = Field(..., ge=0, description="max(0, observed_failed - expected_failed)")
    estimated_revenue_at_risk_inr: float = Field(
        ..., ge=0.0, description="Estimated revenue at risk (excess_failed * baseline_AOV)"
    )
    is_estimated: bool = Field(
        default=True, description="Explicit flag indicating revenue at risk is a counterfactual projection, not realized loss"
    )


class GuardianAlert(BaseModel):
    """
    Structured, persistent, deduplicated alert issued by Payment Guardian.
    """

    alert_id: str = Field(..., description="Unique alert identifier")
    fingerprint: str = Field(..., description="Deduplication key: (metric_category, target_entity, direction)")
    metric: str = Field(..., description="Monitored metric key (e.g. upi_success_rate)")
    detector: DetectorType = Field(..., description="Detector algorithm that flagged the alert")
    severity: AlertSeverity = Field(..., description="Severity classification")
    status: AlertStatus = Field(default=AlertStatus.OPEN, description="Stateful alert status")
    baseline_value: float = Field(..., description="Baseline expectation from DNA")
    observed_value: float = Field(..., description="Observed value in recent window")
    absolute_delta: float = Field(..., description="observed_value - baseline_value")
    relative_delta_percent: Optional[float] = Field(default=None, description="Percentage change from baseline")
    test_statistic: float = Field(..., description="Numerical test statistic")
    p_value_raw: Optional[float] = Field(default=None, description="Raw p-value if applicable")
    p_value_adjusted_fdr: Optional[float] = Field(default=None, description="FDR-adjusted p-value if applicable")
    threshold: float = Field(..., description="Threshold breached")
    sample_size_recent: int = Field(..., ge=0, description="Sample count in observation window")
    sample_size_baseline: int = Field(..., ge=0, description="Sample count in baseline DNA")
    window_description: str = Field(..., description="Text description of the window evaluated")
    consecutive_windows: int = Field(default=1, ge=1, description="Number of consecutive evaluation windows this alert has persisted")
    first_detected_at_iso: str = Field(..., description="ISO timestamp when anomaly was first identified")
    last_evaluated_at_iso: str = Field(..., description="ISO timestamp of most recent evaluation")
    recovered_at_iso: Optional[str] = Field(default=None, description="ISO timestamp when metric normalized and transitioned to RECOVERED")
    diagnostic_associations: List[DiagnosticAssociation] = Field(
        default_factory=list, description="Associated contributors (e.g. specific bank outages)"
    )
    business_impact: Optional[BusinessImpact] = Field(
        default=None, description="Quantified volume and revenue-at-risk impact"
    )
    baseline_provenance_type: str = Field(
        default="OBSERVED_RAZORPAY_DATA", description="Inherited DNA provenance"
    )


class GuardianTwinHandoff(BaseModel):
    """
    Contract payload for handing an active anomaly to Payment Twin for What-If scenario exploration.
    """

    handoff_id: str = Field(..., description="Unique handoff identifier")
    source_alert_id: str = Field(..., description="Alert that generated this handoff")
    anomaly_type: str = Field(..., description="Type of anomaly (e.g. METHOD_SUCCESS_RATE_DEGRADATION)")
    target_entity: str = Field(..., description="Target instrument or bank (e.g. upi)")
    baseline_rate: float = Field(..., description="Historical baseline rate")
    observed_rate: float = Field(..., description="Observed degraded rate")
    delta: float = Field(..., description="observed_rate - baseline_rate")
    affected_order_count: int = Field(..., ge=0, description="Count of orders impacted")
    estimated_revenue_at_risk_inr: float = Field(..., ge=0.0, description="Estimated revenue at risk")
    suggested_scenario_interventions: List[Dict[str, Any]] = Field(
        default_factory=list, description="Candidate What-If scenario interventions to explore"
    )


class GuardianAnalysisResult(BaseModel):
    """
    Complete response model emitted by POST /api/v1/guardian/analyze.
    """

    status: str = Field(default="completed", description="Status: 'completed', 'unavailable', or 'error'")
    message: str = Field(..., description="Analysis summary or unavailability explanation")
    analysis_id: str = Field(..., description="Unique analysis run identifier")
    evaluated_at_iso: str = Field(..., description="Timestamp of analysis")
    recent_window_size: int = Field(default=0, ge=0, description="Configured window size evaluated")
    recent_sample_count: int = Field(default=0, ge=0, description="Actual transaction count found in recent window")
    baseline_sample_count: int = Field(default=0, ge=0, description="Transaction count in historical baseline")
    dna_version: str = Field(default="1.0.0", description="DNA version used as baseline")
    dna_reliability_grade: str = Field(default="UNAVAILABLE", description="DNA confidence assessment")
    reliability_warning: Optional[str] = Field(default=None, description="Warning if baseline DNA sample is small")
    active_alerts_count: int = Field(default=0, ge=0, description="Count of active OPEN alerts")
    active_alerts: List[GuardianAlert] = Field(default_factory=list, description="List of active OPEN alerts")
    all_detector_results: List[DetectorResult] = Field(
        default_factory=list, description="Full statistical battery results for auditing"
    )
    twin_handoffs: List[GuardianTwinHandoff] = Field(
        default_factory=list, description="Exploration payloads generated for Payment Twin"
    )
    baseline_provenance_type: str = Field(default="OBSERVED_RAZORPAY_DATA", description="Baseline provenance")
    recent_provenance_type: str = Field(default="OBSERVED_RAZORPAY_DATA", description="Recent data provenance")
    is_synthetic_benchmark: bool = Field(default=False, description="True if benchmark data")
    provenance_disclaimer: str = Field(
        default=(
            "Payment Guardian drift detection and impact estimations are statistical diagnostics "
            "and do not constitute financial guarantees."
        ),
        description="Mandatory disclaimer",
    )


class GuardianStatusResponse(BaseModel):
    """
    Response model for GET /api/v1/guardian/status.
    """

    guardian_available: bool = Field(..., description="True if Guardian can perform monitoring")
    status: str = Field(..., description="System status (healthy, unavailable, degraded)")
    message: str = Field(..., description="Status explanation")
    dna_available: bool = Field(..., description="True if usable Behavioral DNA exists")
    dna_reliability_grade: str = Field(..., description="DNA confidence grade")
    baseline_sample_size: int = Field(default=0, ge=0, description="Sample count in baseline DNA")
    active_alerts_count: int = Field(default=0, ge=0, description="Count of current OPEN alerts")
    open_alerts: List[GuardianAlert] = Field(default_factory=list, description="Current OPEN alerts")
    last_analysis_timestamp: Optional[str] = Field(default=None, description="Timestamp of most recent analysis")
