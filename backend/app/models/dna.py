"""
Behavioral DNA domain schemas and data contracts.
Represents the empirical statistical signature of a merchant's payment ecosystem.
"""

from typing import Dict, List, Optional
from pydantic import BaseModel, Field


class DataProvenance(BaseModel):
    """
    Data source and lineage metadata distinguishing real observations from synthetic benchmarks.
    """

    data_source_type: str = Field(
        default="OBSERVED_RAZORPAY_DATA",
        description="Source category: OBSERVED_RAZORPAY_DATA, SYNTHETIC_BENCHMARK_DATA, or NO_DATA_AVAILABLE",
    )
    is_synthetic_benchmark: bool = Field(
        default=False,
        description="True if derived from synthetic benchmark data; False for empirical Razorpay telemetry",
    )
    source_datasets: List[str] = Field(default_factory=list, description="Names of source JSONL files analyzed")
    extracted_at_iso: str = Field(..., description="Timestamp of profile calculation in ISO 8601 UTC")
    total_sample_size: int = Field(default=0, ge=0, description="Total payment records used in profile fitting")
    timespan_days: Optional[float] = Field(default=None, description="Time duration spanned by dataset in days")


class ReliabilityAssessment(BaseModel):
    """
    Statistical confidence and sample adequacy grading.
    """

    confidence_grade: str = Field(
        default="UNAVAILABLE",
        description="Confidence tier: GRADE_A (N>=250), GRADE_B (50<=N<250), GRADE_C (10<=N<50), INSUFFICIENT_DATA (1<=N<10), UNAVAILABLE (N=0)",
    )
    confidence_score: float = Field(default=0.0, ge=0.0, le=1.0, description="Normalized reliability score (0.0 to 1.0)")
    sample_size_adequate: bool = Field(default=False, description="True if sample size >= 50 for aggregate inferences")
    subsegment_reliability: Dict[str, str] = Field(
        default_factory=dict, description="Reliability grade per payment method / bank subsegment"
    )
    notes: List[str] = Field(default_factory=list, description="Methodological notes and sample limitations")


class MethodPriors(BaseModel):
    """
    Payment instrument selection probabilities and conditioned priors.
    """

    probabilities: Dict[str, float] = Field(
        default_factory=dict, description="Marginal selection probabilities P(method=m), summing to 1.0"
    )
    sub_instrument_priors: Dict[str, Dict[str, float]] = Field(
        default_factory=dict, description="Sub-method distributions (e.g. upi_providers, card_issuers, netbanking_banks)"
    )
    amount_conditioned_priors: Dict[str, Dict[str, float]] = Field(
        default_factory=dict,
        description="Method priors conditioned on amount tiers: tier_low_under_500, tier_mid_500_to_2500, tier_high_above_2500",
    )
    sample_size: int = Field(default=0, ge=0, description="Records used to compute method priors")


class SuccessRateMetric(BaseModel):
    """
    Empirical success rate accompanied by Wilson 95% confidence intervals.
    """

    rate: float = Field(..., ge=0.0, le=1.0, description="Empirical capture rate (0.0 to 1.0)")
    ci_95: Optional[List[float]] = Field(
        default=None, description="95% Wilson Score Interval [lower_bound, upper_bound] (None if sample too small)"
    )
    sample_size: int = Field(..., ge=0, description="Number of attempts analyzed for this metric")


class SuccessDynamics(BaseModel):
    """
    Success and capture probabilities segmented by method and bank.
    """

    overall_success_rate: Optional[float] = Field(default=None, ge=0.0, le=1.0, description="Overall capture rate")
    overall_confidence_interval_95: Optional[List[float]] = Field(
        default=None, description="Overall 95% Wilson confidence interval [lower, upper]"
    )
    by_method: Dict[str, SuccessRateMetric] = Field(
        default_factory=dict, description="Success rate per payment method"
    )
    by_bank: Dict[str, SuccessRateMetric] = Field(
        default_factory=dict, description="Success rate per issuing bank with sufficient sample size"
    )
    sample_size: int = Field(default=0, ge=0, description="Total attempts analyzed for success dynamics")


class FailureDiagnostics(BaseModel):
    """
    Failure reason and funnel stage distributions conditioned on failed payments.
    """

    failed_sample_size: int = Field(default=0, ge=0, description="Total number of failed payments analyzed")
    error_source_distribution: Dict[str, float] = Field(
        default_factory=dict, description="P(source | failed): customer, bank, gateway, business"
    )
    error_step_distribution: Dict[str, float] = Field(
        default_factory=dict, description="P(step | failed): payment_authentication, payment_authorization"
    )
    top_error_reasons: Dict[str, float] = Field(
        default_factory=dict, description="P(reason | failed): e.g. incorrect_otp, insufficient_funds"
    )
    top_error_codes: Dict[str, float] = Field(
        default_factory=dict, description="P(code | failed): e.g. BAD_REQUEST_ERROR, GATEWAY_ERROR"
    )


class AmountSummary(BaseModel):
    """
    Descriptive parametric and non-parametric summary of transaction ticket sizes.
    """

    mean: float = Field(..., description="Arithmetic mean transaction amount in INR")
    median: float = Field(..., description="Median transaction amount in INR")
    std_dev: float = Field(..., description="Standard deviation in INR")
    iqr: float = Field(..., description="Interquartile range (p75 - p25) in INR")
    skewness: float = Field(..., description="Sample skewness coefficient")


class ParametricFitResult(BaseModel):
    """
    Parametric distribution fit result with Kolmogorov-Smirnov goodness-of-fit validation.
    """

    distribution_family: str = Field(default="lognormal", description="Fitted distribution family")
    is_adequate_fit: bool = Field(..., description="True if goodness-of-fit hypothesis is not rejected (p >= 0.05)")
    parameters: Dict[str, float] = Field(
        default_factory=dict, description="Estimated distribution parameters (e.g. shape_sigma, scale_median, loc)"
    )
    ks_test_statistic: Optional[float] = Field(default=None, description="Kolmogorov-Smirnov test statistic")
    ks_test_p_value: Optional[float] = Field(default=None, description="p-value of goodness-of-fit test")
    note: Optional[str] = Field(default=None, description="Methodological note or reason for fit rejection")


class AmountDistribution(BaseModel):
    """
    Ticket size distributions, quantiles, and parametric fit.
    """

    sample_size: int = Field(default=0, ge=0, description="Records with valid amounts")
    summary: Optional[AmountSummary] = Field(default=None, description="Descriptive statistics")
    quantiles: Dict[str, float] = Field(
        default_factory=dict, description="Empirical percentiles: p10, p25, p50, p75, p90, p95, p99"
    )
    parametric_fit: Optional[ParametricFitResult] = Field(
        default=None, description="Lognormal MLE fit if sample adequate and hypothesis accepted"
    )
    aov_by_method: Dict[str, float] = Field(
        default_factory=dict, description="Mean Average Order Value (AOV) in INR segmented by payment method"
    )


class TemporalDynamics(BaseModel):
    """
    Hourly and daily transaction concentration distributions.
    """

    has_sufficient_timespan: bool = Field(
        default=False, description="True if dataset spans at least 7 days with adequate sample size"
    )
    timespan_days: float = Field(default=0.0, description="Timespan of dataset in days")
    hour_of_day_priors: Optional[List[float]] = Field(
        default=None, description="24 hourly selection weights (index 0 to 23), summing to 1.0"
    )
    day_of_week_priors: Optional[List[float]] = Field(
        default=None, description="7 day-of-week selection weights (0=Monday to 6=Sunday), summing to 1.0"
    )
    peak_hours_utc: List[int] = Field(default_factory=list, description="Top peak hours in UTC")
    status_message: str = Field(
        default="Insufficient data", description="Explanation of temporal representativeness"
    )


class FeeEconomics(BaseModel):
    """
    Observed merchant processing fee and taxation economics.
    """

    has_fee_data: bool = Field(default=False, description="True if fee telemetry is present in dataset")
    sample_size_with_fees: int = Field(default=0, ge=0, description="Records with non-null fee values")
    effective_blended_mdr_percent: Optional[float] = Field(
        default=None, description="Effective blended Merchant Discount Rate percentage (fees / volume)"
    )
    mdr_by_method_percent: Dict[str, float] = Field(
        default_factory=dict, description="Effective MDR percentage per payment method"
    )
    effective_tax_rate_percent: Optional[float] = Field(
        default=None, description="Effective tax percentage on gateway fees"
    )


class EmpiricalTransitions(BaseModel):
    """
    Observable multi-attempt retry patterns derived from orders with multiple payment attempts.
    """

    has_order_tracking: bool = Field(default=False, description="True if order_id tracking is present")
    tracked_orders_count: int = Field(default=0, ge=0, description="Unique orders evaluated")
    multi_attempt_orders_count: int = Field(default=0, ge=0, description="Orders with 2 or more payment attempts")
    overall_retry_probability_on_failure: Optional[float] = Field(
        default=None, description="P(retry | initial attempt failed) based on empirical order chains"
    )
    method_switch_on_retry_probability: Optional[float] = Field(
        default=None, description="P(method_2 != method_1 | retry) frequency of method switching upon retry"
    )
    unobserved_dropouts_note: str = Field(
        default="Pre-checkout cart abandonments are unobserved in Razorpay payment telemetry and are not inferred.",
        description="Explicit note on data boundaries",
    )


class BehavioralDNAProfile(BaseModel):
    """
    Complete Behavioral DNA Profile of a merchant's payment ecosystem.
    """

    status: str = Field(default="ok", description="Profile status: 'ok' or 'empty'")
    dna_version: str = Field(default="1.0.0", description="Schema specification version")
    provenance: DataProvenance
    reliability: ReliabilityAssessment
    method_priors: MethodPriors
    success_dynamics: SuccessDynamics
    failure_diagnostics: FailureDiagnostics
    amount_distribution: AmountDistribution
    temporal_dynamics: TemporalDynamics
    fee_economics: FeeEconomics
    empirical_transitions: EmpiricalTransitions


class DNAStatusResponse(BaseModel):
    """
    Summary response describing Behavioral DNA readiness and data availability.
    """

    status: str = Field(..., description="Status string: 'ready', 'insufficient_data', or 'empty'")
    profiling_available: bool = Field(..., description="True if DNA profile can be generated")
    available_sample_count: int = Field(..., ge=0, description="Count of valid payment records available")
    confidence_grade: str = Field(..., description="GRADE_A, GRADE_B, GRADE_C, INSUFFICIENT_DATA, or UNAVAILABLE")
    provenance_type: str = Field(..., description="OBSERVED_RAZORPAY_DATA, SYNTHETIC_BENCHMARK_DATA, or NO_DATA_AVAILABLE")
    source_files_count: int = Field(..., ge=0, description="Number of raw JSONL files present")
    message: str = Field(..., description="User-friendly status description")
