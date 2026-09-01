"""
Behavioral DNA Profiler Service.
Extracts empirical statistical distributions, conditional priors, and reliability metrics
from normalized payment records without fabricating unobserved data.
"""

from datetime import datetime, timezone
import math
from typing import Any, Dict, List, Optional, Tuple, Union
import numpy as np
import pandas as pd
from scipy import stats

from app.core.logging import logger
from app.models.dna import (
    AmountDistribution,
    AmountSummary,
    BehavioralDNAProfile,
    DataProvenance,
    DNAStatusResponse,
    EmpiricalTransitions,
    FeeEconomics,
    FailureDiagnostics,
    MethodPriors,
    ParametricFitResult,
    ReliabilityAssessment,
    SuccessDynamics,
    SuccessRateMetric,
    TemporalDynamics,
)
from app.models.payment import NormalizedPaymentRecord
from app.services.dataset_reader import DatasetLoaderService


def compute_wilson_confidence_interval(
    successes: int, total: int, confidence: float = 0.95
) -> Optional[List[float]]:
    """
    Computes Wilson score interval for a binomial proportion.
    Only calculated when total >= 5 to avoid misleading bounds on tiny samples.
    """
    if total < 5:
        return None

    z = 1.95996  # 95% two-sided normal quantile
    p_hat = successes / total
    denominator = 1.0 + (z * z) / total
    center = (p_hat + (z * z) / (2.0 * total)) / denominator
    half_width = (z * math.sqrt((p_hat * (1.0 - p_hat) / total) + (z * z) / (4.0 * total * total))) / denominator

    lower = max(0.0, round(center - half_width, 4))
    upper = min(1.0, round(center + half_width, 4))
    return [lower, upper]


def normalize_frequencies(counts: Dict[str, int]) -> Dict[str, float]:
    """
    Converts category counts into empirical probabilities summing to 1.0 with stable key ordering.
    """
    total = sum(counts.values())
    if total == 0:
        return {}

    sorted_keys = sorted(counts.keys())
    raw_probs: Dict[str, float] = {k: round(counts[k] / total, 4) for k in sorted_keys}

    # Correct slight rounding residuals on the largest category so sum is exactly 1.0
    prob_sum = round(sum(raw_probs.values()), 4)
    residual = round(1.0 - prob_sum, 4)
    if abs(residual) > 0 and sorted_keys:
        largest_key = max(sorted_keys, key=lambda k: raw_probs[k])
        raw_probs[largest_key] = round(raw_probs[largest_key] + residual, 4)

    return raw_probs


class BehavioralDNAProfiler:
    """
    Service responsible for calculating and assembling the Behavioral DNA Profile
    from normalized payment datasets.
    """

    def __init__(self, loader: Optional[DatasetLoaderService] = None) -> None:
        self.loader = loader or DatasetLoaderService()

    def get_status(self) -> DNAStatusResponse:
        """
        Returns high-level readiness status and sample size grading for Behavioral DNA profiling.
        """
        files = self.loader.list_dataset_files()
        total_samples = sum(f.valid_records for f in files)

        if total_samples == 0:
            return DNAStatusResponse(
                status="empty",
                profiling_available=False,
                available_sample_count=0,
                confidence_grade="UNAVAILABLE",
                provenance_type="NO_DATA_AVAILABLE",
                source_files_count=len(files),
                message="No payment records are available in data/raw/ to construct Behavioral DNA.",
            )

        grade, score, adequate = self._assess_sample_size(total_samples)

        is_synth = any("benchmark" in f.filename.lower() or "synthetic" in f.filename.lower() for f in files)
        provenance_type = "SYNTHETIC_BENCHMARK_DATA" if is_synth else "OBSERVED_RAZORPAY_DATA"

        status_label = "ready" if adequate else "insufficient_data"
        msg = (
            f"Behavioral DNA profiling ready with {total_samples} records ({grade}) [{'SYNTHETIC BENCHMARK' if is_synth else 'OBSERVED DATA'}]."
            if adequate
            else f"Preliminary DNA profiling possible ({total_samples} records, {grade}). Sample size is limited."
        )

        return DNAStatusResponse(
            status=status_label,
            profiling_available=True,
            available_sample_count=total_samples,
            confidence_grade=grade,
            provenance_type=provenance_type,
            source_files_count=len(files),
            message=msg,
        )

    def _assess_sample_size(self, n: int) -> Tuple[str, float, bool]:
        """
        Applies the approved sample size grading policy.
        """
        if n == 0:
            return "UNAVAILABLE", 0.0, False
        if n < 10:
            return "INSUFFICIENT_DATA", round(n / 50.0, 2), False
        if n < 50:
            return "GRADE_C", 0.40, False
        if n < 250:
            return "GRADE_B", 0.75, True
        return "GRADE_A", 0.95, True

    def build_profile(
        self,
        records: Optional[List[NormalizedPaymentRecord]] = None,
        source_label: Optional[str] = None,
        is_synthetic: bool = False,
    ) -> BehavioralDNAProfile:
        """
        Constructs the complete, deterministic Behavioral DNA Profile.
        """
        source_files: List[str] = []
        if records is None:
            records, _ = self.loader.load_all_records()
            source_files = [f.filename for f in self.loader.list_dataset_files()]
        elif source_label:
            source_files = [source_label]

        is_synth = is_synthetic or any("benchmark" in f.lower() or "synthetic" in f.lower() for f in source_files)

        now_iso = datetime.now(timezone.utc).isoformat()
        total_n = len(records)

        # 1. Zero-Data Empty Profile
        if total_n == 0:
            return self._build_empty_profile(now_iso, source_files, is_synth)

        # 2. Extract Timestamps and Timespan
        timestamps = [r.created_at_unix for r in records if r.created_at_unix > 0]
        min_ts = min(timestamps) if timestamps else 0
        max_ts = max(timestamps) if timestamps else 0
        timespan_days = round((max_ts - min_ts) / 86400.0, 2) if timestamps else 0.0

        # 3. Provenance & Reliability
        provenance_type = "SYNTHETIC_BENCHMARK_DATA" if is_synth else "OBSERVED_RAZORPAY_DATA"
        grade, score, adequate = self._assess_sample_size(total_n)

        # Subsegment Reliability Map
        method_counts: Dict[str, int] = {}
        for r in records:
            method_counts[r.method] = method_counts.get(r.method, 0) + 1

        subsegment_rel: Dict[str, str] = {}
        for m, count in sorted(method_counts.items()):
            if count >= 50:
                subsegment_rel[m] = "HIGH"
            elif count >= 20:
                subsegment_rel[m] = "MODERATE"
            elif count >= 5:
                subsegment_rel[m] = "LOW_SAMPLE"
            else:
                subsegment_rel[m] = "INSUFFICIENT_DATA"

        notes: List[str] = []
        if not adequate:
            notes.append(f"Sample size N={total_n} is below recommended threshold of 50 for stable inference.")

        provenance = DataProvenance(
            data_source_type=provenance_type,
            is_synthetic_benchmark=is_synth,
            source_datasets=sorted(source_files),
            extracted_at_iso=now_iso,
            total_sample_size=total_n,
            timespan_days=timespan_days,
        )

        reliability = ReliabilityAssessment(
            confidence_grade=grade,
            confidence_score=score,
            sample_size_adequate=adequate,
            subsegment_reliability=subsegment_rel,
            notes=notes,
        )

        # 4. Method Priors & Conditioned Priors
        method_priors = self._compute_method_priors(records, total_n)

        # 5. Success Dynamics
        success_dynamics = self._compute_success_dynamics(records, total_n)

        # 6. Failure Diagnostics
        failure_diagnostics = self._compute_failure_diagnostics(records)

        # 7. Amount Distribution & Parametric Fit
        amount_distribution = self._compute_amount_distribution(records)

        # 8. Temporal Dynamics
        temporal_dynamics = self._compute_temporal_dynamics(records, timespan_days, total_n)

        # 9. Fee Economics
        fee_economics = self._compute_fee_economics(records)

        # 10. Empirical Transitions (Retries)
        empirical_transitions = self._compute_empirical_transitions(records)

        return BehavioralDNAProfile(
            status="ok",
            dna_version="1.0.0",
            provenance=provenance,
            reliability=reliability,
            method_priors=method_priors,
            success_dynamics=success_dynamics,
            failure_diagnostics=failure_diagnostics,
            amount_distribution=amount_distribution,
            temporal_dynamics=temporal_dynamics,
            fee_economics=fee_economics,
            empirical_transitions=empirical_transitions,
        )

    def _build_empty_profile(
        self, now_iso: str, source_files: List[str], is_synthetic: bool
    ) -> BehavioralDNAProfile:
        """
        Constructs an explicit, mathematically honest empty profile when no records exist.
        """
        provenance_type = "SYNTHETIC_BENCHMARK_DATA" if is_synthetic else "NO_DATA_AVAILABLE"
        return BehavioralDNAProfile(
            status="empty",
            dna_version="1.0.0",
            provenance=DataProvenance(
                data_source_type=provenance_type,
                is_synthetic_benchmark=is_synthetic,
                source_datasets=source_files,
                extracted_at_iso=now_iso,
                total_sample_size=0,
                timespan_days=0.0,
            ),
            reliability=ReliabilityAssessment(
                confidence_grade="UNAVAILABLE",
                confidence_score=0.0,
                sample_size_adequate=False,
                subsegment_reliability={},
                notes=["No payment datasets are currently available for profiling."],
            ),
            method_priors=MethodPriors(
                probabilities={},
                sub_instrument_priors={},
                amount_conditioned_priors={},
                sample_size=0,
            ),
            success_dynamics=SuccessDynamics(
                overall_success_rate=None,
                overall_confidence_interval_95=None,
                by_method={},
                by_bank={},
                sample_size=0,
            ),
            failure_diagnostics=FailureDiagnostics(
                failed_sample_size=0,
                error_source_distribution={},
                error_step_distribution={},
                top_error_reasons={},
                top_error_codes={},
            ),
            amount_distribution=AmountDistribution(
                sample_size=0,
                summary=None,
                quantiles={},
                parametric_fit=None,
                aov_by_method={},
            ),
            temporal_dynamics=TemporalDynamics(
                has_sufficient_timespan=False,
                timespan_days=0.0,
                hour_of_day_priors=None,
                day_of_week_priors=None,
                peak_hours_utc=[],
                status_message="No transaction timestamps available.",
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

    def _compute_method_priors(
        self, records: List[NormalizedPaymentRecord], total_n: int
    ) -> MethodPriors:
        """
        Calculates marginal method priors and conditioned amount tiers.
        """
        method_counts: Dict[str, int] = {}
        sub_upi: Dict[str, int] = {}
        sub_banks: Dict[str, int] = {}

        # Tiers: low (<500), mid (500-2500), high (>2500)
        tier_low: Dict[str, int] = {}
        tier_mid: Dict[str, int] = {}
        tier_high: Dict[str, int] = {}

        for r in records:
            m = r.method
            method_counts[m] = method_counts.get(m, 0) + 1

            if m == "upi" and r.vpa_provider:
                sub_upi[r.vpa_provider] = sub_upi.get(r.vpa_provider, 0) + 1
            if r.bank:
                sub_banks[r.bank] = sub_banks.get(r.bank, 0) + 1

            # Amount Tiers
            if r.amount_inr < 500.0:
                tier_low[m] = tier_low.get(m, 0) + 1
            elif r.amount_inr <= 2500.0:
                tier_mid[m] = tier_mid.get(m, 0) + 1
            else:
                tier_high[m] = tier_high.get(m, 0) + 1

        probs = normalize_frequencies(method_counts)

        sub_instruments: Dict[str, Dict[str, float]] = {}
        if sub_upi:
            sub_instruments["upi_providers"] = normalize_frequencies(sub_upi)
        if sub_banks:
            sub_instruments["banks"] = normalize_frequencies(sub_banks)

        conditioned_priors: Dict[str, Dict[str, float]] = {}
        if tier_low:
            conditioned_priors["tier_low_under_500"] = normalize_frequencies(tier_low)
        if tier_mid:
            conditioned_priors["tier_mid_500_to_2500"] = normalize_frequencies(tier_mid)
        if tier_high:
            conditioned_priors["tier_high_above_2500"] = normalize_frequencies(tier_high)

        return MethodPriors(
            probabilities=probs,
            sub_instrument_priors=sub_instruments,
            amount_conditioned_priors=conditioned_priors,
            sample_size=total_n,
        )

    def _compute_success_dynamics(
        self, records: List[NormalizedPaymentRecord], total_n: int
    ) -> SuccessDynamics:
        """
        Calculates success rates with 95% Wilson Score Intervals.
        """
        captured_total = sum(1 for r in records if r.status in ("captured", "paid"))
        overall_rate = round(captured_total / total_n, 4)
        overall_ci = compute_wilson_confidence_interval(captured_total, total_n)

        # By Method
        by_method_counts: Dict[str, Tuple[int, int]] = {}  # method -> (success, total)
        # By Bank (only if bank is present)
        by_bank_counts: Dict[str, Tuple[int, int]] = {}  # bank -> (success, total)

        for r in records:
            is_success = 1 if r.status in ("captured", "paid") else 0
            m = r.method
            succ_m, tot_m = by_method_counts.get(m, (0, 0))
            by_method_counts[m] = (succ_m + is_success, tot_m + 1)

            if r.bank:
                succ_b, tot_b = by_bank_counts.get(r.bank, (0, 0))
                by_bank_counts[r.bank] = (succ_b + is_success, tot_b + 1)

        by_method_metrics: Dict[str, SuccessRateMetric] = {}
        for m in sorted(by_method_counts.keys()):
            succ, tot = by_method_counts[m]
            rate = round(succ / tot, 4)
            ci = compute_wilson_confidence_interval(succ, tot)
            by_method_metrics[m] = SuccessRateMetric(rate=rate, ci_95=ci, sample_size=tot)

        by_bank_metrics: Dict[str, SuccessRateMetric] = {}
        for b in sorted(by_bank_counts.keys()):
            succ, tot = by_bank_counts[b]
            # Only report bank-level success dynamics if support >= 3
            if tot >= 3:
                rate = round(succ / tot, 4)
                ci = compute_wilson_confidence_interval(succ, tot)
                by_bank_metrics[b] = SuccessRateMetric(rate=rate, ci_95=ci, sample_size=tot)

        return SuccessDynamics(
            overall_success_rate=overall_rate,
            overall_confidence_interval_95=overall_ci,
            by_method=by_method_metrics,
            by_bank=by_bank_metrics,
            sample_size=total_n,
        )

    def _compute_failure_diagnostics(
        self, records: List[NormalizedPaymentRecord]
    ) -> FailureDiagnostics:
        """
        Analyzes failure reasons and funnel stages strictly conditioned on failed payments.
        """
        failed_records = [r for r in records if r.status == "failed"]
        failed_n = len(failed_records)

        if failed_n == 0:
            return FailureDiagnostics(
                failed_sample_size=0,
                error_source_distribution={},
                error_step_distribution={},
                top_error_reasons={},
                top_error_codes={},
            )

        source_counts: Dict[str, int] = {}
        step_counts: Dict[str, int] = {}
        reason_counts: Dict[str, int] = {}
        code_counts: Dict[str, int] = {}

        for r in failed_records:
            src = r.error_source or "unknown"
            source_counts[src] = source_counts.get(src, 0) + 1

            stp = r.error_step or "unknown"
            step_counts[stp] = step_counts.get(stp, 0) + 1

            if r.error_reason:
                reason_counts[r.error_reason] = reason_counts.get(r.error_reason, 0) + 1

            if r.error_code:
                code_counts[r.error_code] = code_counts.get(r.error_code, 0) + 1

        return FailureDiagnostics(
            failed_sample_size=failed_n,
            error_source_distribution=normalize_frequencies(source_counts),
            error_step_distribution=normalize_frequencies(step_counts),
            top_error_reasons=normalize_frequencies(reason_counts),
            top_error_codes=normalize_frequencies(code_counts),
        )

    def _compute_amount_distribution(
        self, records: List[NormalizedPaymentRecord]
    ) -> AmountDistribution:
        """
        Computes descriptive statistics, empirical quantiles, and optional SciPy lognormal fit.
        """
        amounts = [r.amount_inr for r in records if r.amount_inr > 0]
        n_amounts = len(amounts)

        if n_amounts == 0:
            return AmountDistribution(
                sample_size=0,
                summary=None,
                quantiles={},
                parametric_fit=None,
                aov_by_method={},
            )

        arr = np.array(amounts, dtype=float)
        mean_val = round(float(np.mean(arr)), 2)
        median_val = round(float(np.median(arr)), 2)
        std_val = round(float(np.std(arr, ddof=1)), 2) if n_amounts > 1 else 0.0

        p25 = round(float(np.percentile(arr, 25)), 2)
        p75 = round(float(np.percentile(arr, 75)), 2)
        iqr_val = round(p75 - p25, 2)
        skew_val = round(float(stats.skew(arr)), 4) if n_amounts >= 3 else 0.0

        summary = AmountSummary(
            mean=mean_val,
            median=median_val,
            std_dev=std_val,
            iqr=iqr_val,
            skewness=skew_val,
        )

        quantiles = {
            "p10": round(float(np.percentile(arr, 10)), 2),
            "p25": p25,
            "p50": median_val,
            "p75": p75,
            "p90": round(float(np.percentile(arr, 90)), 2),
            "p95": round(float(np.percentile(arr, 95)), 2),
            "p99": round(float(np.percentile(arr, 99)), 2),
        }

        # AOV by Method
        aov_by_m: Dict[str, float] = {}
        method_group: Dict[str, List[float]] = {}
        for r in records:
            if r.amount_inr > 0:
                method_group.setdefault(r.method, []).append(r.amount_inr)

        for m in sorted(method_group.keys()):
            aov_by_m[m] = round(float(np.mean(method_group[m])), 2)

        # Parametric Fit with Goodness-of-fit validation
        parametric_fit = self._fit_lognormal_distribution(arr, n_amounts)

        return AmountDistribution(
            sample_size=n_amounts,
            summary=summary,
            quantiles=quantiles,
            parametric_fit=parametric_fit,
            aov_by_method=aov_by_m,
        )

    def _fit_lognormal_distribution(
        self, arr: np.ndarray, n: int
    ) -> Optional[ParametricFitResult]:
        """
        Attempts to fit a Log-Normal distribution via MLE and performs a Kolmogorov-Smirnov test.
        Does NOT force the distribution if the KS goodness-of-fit test fails.
        """
        if n < 30 or np.std(arr) == 0.0 or np.any(arr <= 0):
            return ParametricFitResult(
                distribution_family="lognormal",
                is_adequate_fit=False,
                parameters={},
                ks_test_statistic=None,
                ks_test_p_value=None,
                note=f"Sample size N={n} (< 30) is insufficient for reliable parametric distribution fitting.",
            )

        try:
            # Fit lognormal with location fixed at 0 for positive currency values
            s, loc, scale = stats.lognorm.fit(arr, floc=0)
            ks_res = stats.kstest(arr, "lognorm", args=(s, 0, scale))

            is_adequate = bool(ks_res.pvalue >= 0.05)
            note = (
                "Log-normal distribution hypothesis accepted (KS test p >= 0.05)."
                if is_adequate
                else "Kolmogorov-Smirnov test rejected log-normal hypothesis (p < 0.05). Fall back to empirical quantiles."
            )

            return ParametricFitResult(
                distribution_family="lognormal",
                is_adequate_fit=is_adequate,
                parameters={
                    "shape_sigma": round(float(s), 4),
                    "scale_median": round(float(scale), 2),
                    "loc": 0.0,
                },
                ks_test_statistic=round(float(ks_res.statistic), 4),
                ks_test_p_value=round(float(ks_res.pvalue), 4),
                note=note,
            )
        except Exception as exc:
            logger.warning("Log-normal fitting encountered exception: %s", str(exc))
            return ParametricFitResult(
                distribution_family="lognormal",
                is_adequate_fit=False,
                parameters={},
                note=f"Parametric estimation failed: {str(exc)}",
            )

    def _compute_temporal_dynamics(
        self, records: List[NormalizedPaymentRecord], timespan_days: float, total_n: int
    ) -> TemporalDynamics:
        """
        Calculates hourly and daily transaction seasonality only when timespan >= 7 days.
        """
        timestamps = [r.created_at_unix for r in records if r.created_at_unix > 0]
        if not timestamps:
            return TemporalDynamics(
                has_sufficient_timespan=False,
                timespan_days=0.0,
                hour_of_day_priors=None,
                day_of_week_priors=None,
                peak_hours_utc=[],
                status_message="No transaction timestamps present.",
            )

        # Condition for temporal validity: at least 7 days timespan and at least 50 samples
        if timespan_days < 7.0 or total_n < 50:
            return TemporalDynamics(
                has_sufficient_timespan=False,
                timespan_days=timespan_days,
                hour_of_day_priors=None,
                day_of_week_priors=None,
                peak_hours_utc=[],
                status_message=f"Insufficient temporal span ({timespan_days:.1f} days < 7.0 days or N={total_n} < 50) to infer representative seasonality.",
            )

        hour_counts = [0] * 24
        day_counts = [0] * 7  # 0=Monday to 6=Sunday

        for ts in timestamps:
            dt = datetime.fromtimestamp(ts, tz=timezone.utc)
            hour_counts[dt.hour] += 1
            day_counts[dt.weekday()] += 1

        total_ts = len(timestamps)
        hourly_priors = [round(c / total_ts, 4) for c in hour_counts]
        daily_priors = [round(c / total_ts, 4) for c in day_counts]

        # Top peak hours
        sorted_hours = sorted(range(24), key=lambda h: hour_counts[h], reverse=True)
        peak_hours = sorted_hours[:4]

        return TemporalDynamics(
            has_sufficient_timespan=True,
            timespan_days=timespan_days,
            hour_of_day_priors=hourly_priors,
            day_of_week_priors=daily_priors,
            peak_hours_utc=sorted(peak_hours),
            status_message="Representative temporal distributions established.",
        )

    def _compute_fee_economics(
        self, records: List[NormalizedPaymentRecord]
    ) -> FeeEconomics:
        """
        Calculates blended MDR and method-specific processing costs from empirical fee records.
        """
        fee_records = [r for r in records if r.fee_inr is not None and r.fee_inr >= 0 and r.amount_inr > 0]
        n_fees = len(fee_records)

        if n_fees == 0:
            return FeeEconomics(
                has_fee_data=False,
                sample_size_with_fees=0,
                effective_blended_mdr_percent=None,
                mdr_by_method_percent={},
                effective_tax_rate_percent=None,
            )

        total_vol = sum(r.amount_inr for r in fee_records)
        total_fees = sum(r.fee_inr for r in fee_records if r.fee_inr is not None)
        total_taxes = sum(r.tax_inr for r in fee_records if r.tax_inr is not None)

        blended_mdr = round((total_fees / total_vol) * 100.0, 3) if total_vol > 0 else 0.0
        tax_rate = round((total_taxes / total_fees) * 100.0, 2) if total_fees > 0 else None

        # MDR by method
        mdr_by_m: Dict[str, float] = {}
        method_fee_vol: Dict[str, Tuple[float, float]] = {}  # method -> (fees, volume)
        for r in fee_records:
            f, v = method_fee_vol.get(r.method, (0.0, 0.0))
            fee_val = r.fee_inr if r.fee_inr is not None else 0.0
            method_fee_vol[r.method] = (f + fee_val, v + r.amount_inr)

        for m in sorted(method_fee_vol.keys()):
            f_sum, v_sum = method_fee_vol[m]
            if v_sum > 0:
                mdr_by_m[m] = round((f_sum / v_sum) * 100.0, 3)

        return FeeEconomics(
            has_fee_data=True,
            sample_size_with_fees=n_fees,
            effective_blended_mdr_percent=blended_mdr,
            mdr_by_method_percent=mdr_by_m,
            effective_tax_rate_percent=tax_rate,
        )

    def _compute_empirical_transitions(
        self, records: List[NormalizedPaymentRecord]
    ) -> EmpiricalTransitions:
        """
        Identifies multi-attempt order chains to measure retry rate and method switching on failure.
        """
        orders_map: Dict[str, List[NormalizedPaymentRecord]] = {}
        for r in records:
            if r.order_id:
                orders_map.setdefault(r.order_id, []).append(r)

        tracked_orders_count = len(orders_map)
        if tracked_orders_count == 0:
            return EmpiricalTransitions(
                has_order_tracking=False,
                tracked_orders_count=0,
                multi_attempt_orders_count=0,
                overall_retry_probability_on_failure=None,
                method_switch_on_retry_probability=None,
            )

        multi_attempt_count = sum(1 for attempts in orders_map.values() if len(attempts) >= 2)

        # Retry rate: out of orders where 1st attempt failed, how many had >=2 attempts?
        first_attempt_failed_count = 0
        retried_after_fail_count = 0
        switched_method_count = 0

        for order_id, attempts in sorted(orders_map.items()):
            # Sort attempts by timestamp
            sorted_attempts = sorted(attempts, key=lambda a: a.created_at_unix)
            first_attempt = sorted_attempts[0]

            if first_attempt.status == "failed":
                first_attempt_failed_count += 1
                if len(sorted_attempts) >= 2:
                    retried_after_fail_count += 1
                    second_attempt = sorted_attempts[1]
                    if second_attempt.method != first_attempt.method:
                        switched_method_count += 1

        retry_prob: Optional[float] = None
        switch_prob: Optional[float] = None

        if first_attempt_failed_count > 0:
            retry_prob = round(retried_after_fail_count / first_attempt_failed_count, 4)

        if retried_after_fail_count > 0:
            switch_prob = round(switched_method_count / retried_after_fail_count, 4)

        return EmpiricalTransitions(
            has_order_tracking=True,
            tracked_orders_count=tracked_orders_count,
            multi_attempt_orders_count=multi_attempt_count,
            overall_retry_probability_on_failure=retry_prob,
            method_switch_on_retry_probability=switch_prob,
        )
