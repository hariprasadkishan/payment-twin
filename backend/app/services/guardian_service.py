"""
Payment Guardian Sentinel Service.
Performs statistical surveillance on recent payment telemetry against Behavioral DNA,
applies FDR multiple testing control, manages stateful alert lifecycles,
computes diagnostic associations, and prepares Payment Twin counterfactual handoffs.
"""

from datetime import datetime, timezone
import math
import time
from typing import Any, Dict, List, Optional, Set, Tuple
import numpy as np

from app.core.logging import logger
from app.models.dna import BehavioralDNAProfile
from app.models.guardian import (
    AlertSeverity,
    AlertStatus,
    BusinessImpact,
    DetectorResult,
    DetectorType,
    DiagnosticAssociation,
    GuardianAlert,
    GuardianAnalysisResult,
    GuardianConfig,
    GuardianStatusResponse,
    GuardianTwinHandoff,
    GuardianWindowMode,
)
from app.models.payment import NormalizedPaymentRecord
from app.services.drift_detectors import (
    benjamini_hochberg_fdr,
    calculate_psi,
    fisher_exact_test,
    tabular_cusum,
    two_proportion_ztest,
    two_sample_ks_test,
)


class GuardianSentinelService:
    """
    Stateful surveillance service monitoring payment stream health and detecting statistical drift.
    """

    def __init__(self) -> None:
        # In-memory persistent alert store keyed by fingerprint
        self._alerts_by_fingerprint: Dict[str, GuardianAlert] = {}
        self._alerts_by_id: Dict[str, GuardianAlert] = {}
        self._last_analysis_timestamp: Optional[str] = None

    def get_status(self, dna: BehavioralDNAProfile) -> GuardianStatusResponse:
        """
        Returns Guardian system readiness, DNA baseline health, and active open alert counts.
        """
        is_dna_available = (
            dna.status == "ok"
            and dna.reliability.confidence_grade != "UNAVAILABLE"
            and dna.provenance.data_source_type != "NO_DATA_AVAILABLE"
            and dna.provenance.total_sample_size > 0
        )

        open_alerts = [a for a in self._alerts_by_id.values() if a.status == AlertStatus.OPEN]

        if not is_dna_available:
            return GuardianStatusResponse(
                guardian_available=False,
                status="unavailable",
                message="Payment Guardian is unavailable: Behavioral DNA baseline is empty or unavailable.",
                dna_available=False,
                dna_reliability_grade="UNAVAILABLE",
                baseline_sample_size=0,
                active_alerts_count=0,
                open_alerts=[],
                last_analysis_timestamp=self._last_analysis_timestamp,
            )

        grade = dna.reliability.confidence_grade
        sys_status = "degraded" if grade in ("GRADE_C", "INSUFFICIENT_DATA") else "healthy"
        msg = (
            "Payment Guardian is operational with reduced sensitivity warning on low-sample DNA."
            if sys_status == "degraded"
            else "Payment Guardian is fully operational and actively monitoring telemetry."
        )

        return GuardianStatusResponse(
            guardian_available=True,
            status=sys_status,
            message=msg,
            dna_available=True,
            dna_reliability_grade=grade,
            baseline_sample_size=dna.provenance.total_sample_size,
            active_alerts_count=len(open_alerts),
            open_alerts=open_alerts,
            last_analysis_timestamp=self._last_analysis_timestamp,
        )

    def analyze_records(
        self,
        dna: BehavioralDNAProfile,
        recent_records: List[NormalizedPaymentRecord],
        config: Optional[GuardianConfig] = None,
    ) -> GuardianAnalysisResult:
        """
        Executes the statistical drift detector battery against recent payment records.
        """
        cfg = config or GuardianConfig()
        now_iso = datetime.now(timezone.utc).isoformat()
        self._last_analysis_timestamp = now_iso

        # 1. Baseline DNA Availability Check
        is_dna_available = (
            dna.status == "ok"
            and dna.reliability.confidence_grade != "UNAVAILABLE"
            and dna.provenance.data_source_type != "NO_DATA_AVAILABLE"
            and dna.provenance.total_sample_size > 0
        )
        if not is_dna_available:
            return GuardianAnalysisResult(
                status="unavailable",
                message="Payment Guardian cannot execute: Behavioral DNA baseline is empty or unavailable.",
                analysis_id=f"analysis_unavailable_{int(time.time())}",
                evaluated_at_iso=now_iso,
                recent_window_size=cfg.window_size_count,
                recent_sample_count=len(recent_records),
                baseline_sample_count=0,
                dna_version=dna.dna_version,
                dna_reliability_grade="UNAVAILABLE",
                active_alerts_count=0,
                active_alerts=[],
                all_detector_results=[],
                twin_handoffs=[],
                baseline_provenance_type="NO_DATA_AVAILABLE",
                recent_provenance_type="NO_DATA_AVAILABLE",
            )

        # 2. Extract Sliding Window from Recent Records
        windowed_records = self._extract_observation_window(recent_records, cfg)
        n_recent = len(windowed_records)

        if n_recent < cfg.min_sample_threshold:
            return GuardianAnalysisResult(
                status="unavailable",
                message=(
                    f"Payment Guardian cannot execute: Recent observation window contains {n_recent} "
                    f"transactions, which is below the minimum required sample threshold of {cfg.min_sample_threshold}."
                ),
                analysis_id=f"analysis_insufficient_{int(time.time())}",
                evaluated_at_iso=now_iso,
                recent_window_size=cfg.window_size_count,
                recent_sample_count=n_recent,
                baseline_sample_count=dna.provenance.total_sample_size,
                dna_version=dna.dna_version,
                dna_reliability_grade=dna.reliability.confidence_grade,
                active_alerts_count=0,
                active_alerts=[],
                all_detector_results=[],
                twin_handoffs=[],
                baseline_provenance_type=dna.provenance.data_source_type,
                recent_provenance_type=dna.provenance.data_source_type,
            )

        reliability_warning = None
        if dna.reliability.confidence_grade in ("GRADE_C", "INSUFFICIENT_DATA"):
            reliability_warning = "Baseline established on low-sample DNA"

        # 3. Execute Statistical Detector Battery
        raw_detector_results = self._run_detector_battery(dna, windowed_records, cfg)

        # 4. Apply Benjamini-Hochberg FDR Multiple Testing Correction
        corrected_results = self._apply_fdr_correction(raw_detector_results, cfg.alpha_fdr)

        # 5. Evaluate Dual Significance Gate & Alert Lifecycle
        active_alerts, twin_handoffs = self._process_alerts_and_handoffs(
            dna=dna,
            detector_results=corrected_results,
            windowed_records=windowed_records,
            cfg=cfg,
            evaluated_at_iso=now_iso,
        )

        return GuardianAnalysisResult(
            status="completed",
            message=(
                f"Guardian surveillance completed over {n_recent} recent transactions. "
                f"Flagged {len(active_alerts)} active anomaly alert(s)."
            ),
            analysis_id=f"analysis_{dna.dna_version}_{int(time.time())}",
            evaluated_at_iso=now_iso,
            recent_window_size=cfg.window_size_count,
            recent_sample_count=n_recent,
            baseline_sample_count=dna.provenance.total_sample_size,
            dna_version=dna.dna_version,
            dna_reliability_grade=dna.reliability.confidence_grade,
            reliability_warning=reliability_warning,
            active_alerts_count=len(active_alerts),
            active_alerts=active_alerts,
            all_detector_results=corrected_results,
            twin_handoffs=twin_handoffs,
            baseline_provenance_type=dna.provenance.data_source_type,
            recent_provenance_type=dna.provenance.data_source_type,
            is_synthetic_benchmark=dna.provenance.is_synthetic_benchmark,
        )

    def acknowledge_alert(self, alert_id: str) -> Optional[GuardianAlert]:
        """
        Transitions an OPEN alert to ACKNOWLEDGED.
        """
        if alert_id in self._alerts_by_id:
            alert = self._alerts_by_id[alert_id]
            if alert.status == AlertStatus.OPEN:
                alert.status = AlertStatus.ACKNOWLEDGED
            return alert
        return None

    def resolve_alert(self, alert_id: str) -> Optional[GuardianAlert]:
        """
        Transitions an alert to RESOLVED manually.
        """
        if alert_id in self._alerts_by_id:
            alert = self._alerts_by_id[alert_id]
            alert.status = AlertStatus.RESOLVED
            return alert
        return None

    def get_all_alerts(self, status_filter: Optional[AlertStatus] = None) -> List[GuardianAlert]:
        """
        Returns all tracked alerts, optionally filtered by status.
        """
        alerts = list(self._alerts_by_id.values())
        if status_filter:
            alerts = [a for a in alerts if a.status == status_filter]
        return sorted(alerts, key=lambda a: a.last_evaluated_at_iso, reverse=True)

    def _extract_observation_window(
        self, records: List[NormalizedPaymentRecord], cfg: GuardianConfig
    ) -> List[NormalizedPaymentRecord]:
        """
        Extracts recent observation records based on COUNT_BASED or TIME_BASED sliding window.
        """
        if not records:
            return []

        if cfg.window_mode == GuardianWindowMode.COUNT_BASED:
            return records[-cfg.window_size_count :]

        # TIME_BASED mode
        timestamps = [r.created_at_unix for r in records if r.created_at_unix is not None]
        if not timestamps:
            return records[-cfg.window_size_count :]

        max_ts = max(timestamps)
        window_sec = cfg.window_size_hours * 3600.0
        min_ts = max_ts - window_sec

        return [r for r in records if r.created_at_unix is not None and r.created_at_unix >= min_ts]

    def _run_detector_battery(
        self,
        dna: BehavioralDNAProfile,
        recent: List[NormalizedPaymentRecord],
        cfg: GuardianConfig,
    ) -> List[DetectorResult]:
        """
        Executes domain-mapped drift detectors across method mix, success rates, bank declines, amounts, and CUSUM.
        """
        results: List[DetectorResult] = []
        n_recent = len(recent)
        n_base = dna.provenance.total_sample_size

        # -------------------------------------------------------------
        # 1. Payment Method Mix Drift (PSI)
        # -------------------------------------------------------------
        base_method_probs = dna.method_priors.probabilities
        rec_method_counts: Dict[str, int] = {}
        for r in recent:
            m = r.method.lower() if r.method else "other"
            rec_method_counts[m] = rec_method_counts.get(m, 0) + 1

        rec_method_probs = {m: count / n_recent for m, count in rec_method_counts.items()}
        psi_method, psi_method_class = calculate_psi(base_method_probs, rec_method_probs)
        is_stat_psi = psi_method >= cfg.psi_threshold_moderate
        # Practical check: at least 5% shift in primary method
        max_shift = max(
            [abs(rec_method_probs.get(k, 0.0) - base_method_probs.get(k, 0.0)) for k in base_method_probs.keys()]
            or [0.0]
        )
        is_pract_psi = max_shift >= cfg.min_effect_size_method_share

        results.append(
            DetectorResult(
                detector_type=DetectorType.PSI_CATEGORICAL,
                metric_name="payment_method_distribution",
                target_entity="all_methods",
                test_statistic=psi_method,
                p_value_raw=None,  # PSI has no p-value
                p_value_adjusted_fdr=None,
                baseline_value=0.0,
                observed_value=psi_method,
                absolute_delta=psi_method,
                relative_delta_percent=None,
                is_statistically_significant=is_stat_psi,
                is_practically_significant=is_pract_psi,
                sample_size_baseline=n_base,
                sample_size_recent=n_recent,
                details={"classification": psi_method_class, "max_share_shift": round(max_shift, 4)},
            )
        )

        # -------------------------------------------------------------
        # 2. Overall Capture Rate Drift (Two-Proportion Z-Test)
        # -------------------------------------------------------------
        base_success_rate = dna.success_dynamics.overall_success_rate or 0.85
        rec_success_count = sum(1 for r in recent if r.status == "captured")
        rec_success_rate = rec_success_count / n_recent
        delta_success = rec_success_rate - base_success_rate

        x_base = int(round(base_success_rate * n_base))
        z_stat, p_val_overall = two_proportion_ztest(x_base, n_base, rec_success_count, n_recent)
        is_pract_succ = abs(delta_success) >= cfg.min_effect_size_capture_rate

        results.append(
            DetectorResult(
                detector_type=DetectorType.TWO_PROPORTION_ZTEST,
                metric_name="overall_success_rate",
                target_entity="overall",
                test_statistic=z_stat,
                p_value_raw=p_val_overall,
                p_value_adjusted_fdr=None,  # Populated by BH step
                baseline_value=round(base_success_rate, 4),
                observed_value=round(rec_success_rate, 4),
                absolute_delta=round(delta_success, 4),
                relative_delta_percent=round((delta_success / base_success_rate) * 100.0, 2) if base_success_rate > 0 else None,
                is_statistically_significant=False,  # Evaluated after FDR
                is_practically_significant=is_pract_succ,
                sample_size_baseline=n_base,
                sample_size_recent=n_recent,
                details={},
            )
        )

        # -------------------------------------------------------------
        # 3. Method-Specific Capture Rate Drift (Two-Proportion Z-Test)
        # -------------------------------------------------------------
        for m, m_metric in dna.success_dynamics.by_method.items():
            m_records = [r for r in recent if r.method and r.method.lower() == m.lower()]
            n_rec_m = len(m_records)
            if n_rec_m >= 10:  # Minimum method sample in window
                rec_m_succ = sum(1 for r in m_records if r.status == "captured")
                rec_m_rate = rec_m_succ / n_rec_m
                base_m_rate = m_metric.rate
                base_m_n = m_metric.sample_size or n_base
                x_base_m = int(round(base_m_rate * base_m_n))

                z_m, p_val_m = two_proportion_ztest(x_base_m, base_m_n, rec_m_succ, n_rec_m)
                delta_m = rec_m_rate - base_m_rate
                is_pract_m = abs(delta_m) >= cfg.min_effect_size_capture_rate

                results.append(
                    DetectorResult(
                        detector_type=DetectorType.TWO_PROPORTION_ZTEST,
                        metric_name=f"{m.lower()}_success_rate",
                        target_entity=m.lower(),
                        test_statistic=z_m,
                        p_value_raw=p_val_m,
                        p_value_adjusted_fdr=None,
                        baseline_value=round(base_m_rate, 4),
                        observed_value=round(rec_m_rate, 4),
                        absolute_delta=round(delta_m, 4),
                        relative_delta_percent=round((delta_m / base_m_rate) * 100.0, 2) if base_m_rate > 0 else None,
                        is_statistically_significant=False,
                        is_practically_significant=is_pract_m,
                        sample_size_baseline=base_m_n,
                        sample_size_recent=n_rec_m,
                        details={},
                    )
                )

        # -------------------------------------------------------------
        # 4. Bank Capture Rate Drift (Two-Proportion Z-Test or Fisher Exact)
        # -------------------------------------------------------------
        for b_name, b_metric in dna.success_dynamics.by_bank.items():
            b_records = [r for r in recent if r.bank and r.bank.upper() == b_name.upper()]
            n_rec_b = len(b_records)
            if n_rec_b >= 15:  # Minimum bank sample requirement from design
                rec_b_succ = sum(1 for r in b_records if r.status == "captured")
                rec_b_rate = rec_b_succ / n_rec_b
                base_b_rate = b_metric.rate
                base_b_n = b_metric.sample_size or n_base
                x_base_b = int(round(base_b_rate * base_b_n))

                if n_rec_b < 30:
                    stat_b, p_val_b = fisher_exact_test(x_base_b, base_b_n, rec_b_succ, n_rec_b)
                    det_type = DetectorType.FISHER_EXACT
                else:
                    stat_b, p_val_b = two_proportion_ztest(x_base_b, base_b_n, rec_b_succ, n_rec_b)
                    det_type = DetectorType.TWO_PROPORTION_ZTEST

                delta_b = rec_b_rate - base_b_rate
                is_pract_b = abs(delta_b) >= cfg.min_effect_size_bank_failure

                results.append(
                    DetectorResult(
                        detector_type=det_type,
                        metric_name=f"bank_{b_name.lower()}_success_rate",
                        target_entity=b_name.upper(),
                        test_statistic=stat_b,
                        p_value_raw=p_val_b,
                        p_value_adjusted_fdr=None,
                        baseline_value=round(base_b_rate, 4),
                        observed_value=round(rec_b_rate, 4),
                        absolute_delta=round(delta_b, 4),
                        relative_delta_percent=round((delta_b / base_b_rate) * 100.0, 2) if base_b_rate > 0 else None,
                        is_statistically_significant=False,
                        is_practically_significant=is_pract_b,
                        sample_size_baseline=base_b_n,
                        sample_size_recent=n_rec_b,
                        details={},
                    )
                )

        # -------------------------------------------------------------
        # 5. Transaction Amount Distribution Drift (Two-Sample KS Test)
        # -------------------------------------------------------------
        if n_recent >= 40 and dna.amount_distribution.sample_size >= 40:
            rec_amounts = [r.amount_inr for r in recent if r.amount_inr is not None and r.amount_inr > 0]
            # Synthesize representative sample from baseline quantiles for non-parametric KS comparison
            base_q = dna.amount_distribution.quantiles
            if rec_amounts and base_q:
                # Construct stratified sample from empirical baseline quantiles
                base_sample = [
                    base_q.get("p10", 250.0),
                    base_q.get("p25", 500.0),
                    base_q.get("p50", 1000.0),
                    base_q.get("p75", 2000.0),
                    base_q.get("p90", 3500.0),
                    base_q.get("p95", 5000.0),
                    base_q.get("p99", 8000.0),
                ] * (n_recent // 7 + 1)
                ks_stat, ks_pval = two_sample_ks_test(base_sample[:n_recent], rec_amounts)
                base_med = dna.amount_distribution.summary.median if dna.amount_distribution.summary else 1000.0
                rec_med = float(np.median(rec_amounts))
                rel_med_delta = abs(rec_med - base_med) / base_med if base_med > 0 else 0.0
                is_pract_ks = rel_med_delta >= cfg.min_effect_size_aov

                results.append(
                    DetectorResult(
                        detector_type=DetectorType.TWO_SAMPLE_KS,
                        metric_name="transaction_amount_distribution",
                        target_entity="amount_inr",
                        test_statistic=ks_stat,
                        p_value_raw=ks_pval,
                        p_value_adjusted_fdr=None,
                        baseline_value=round(base_med, 2),
                        observed_value=round(rec_med, 2),
                        absolute_delta=round(rec_med - base_med, 2),
                        relative_delta_percent=round(((rec_med - base_med) / base_med) * 100.0, 2) if base_med > 0 else None,
                        is_statistically_significant=False,
                        is_practically_significant=is_pract_ks,
                        sample_size_baseline=dna.amount_distribution.sample_size,
                        sample_size_recent=len(rec_amounts),
                        details={"baseline_median": base_med, "recent_median": rec_med},
                    )
                )

        # -------------------------------------------------------------
        # 6. Sequential Failure Shift (Tabular CUSUM)
        # -------------------------------------------------------------
        base_fail_rate = 1.0 - (dna.success_dynamics.overall_success_rate or 0.85)
        # Partition recent into sub-chunks of 25 records to form a mini-series of failure rates
        chunk_size = max(10, n_recent // 5)
        fail_series: List[float] = []
        for i in range(0, n_recent, chunk_size):
            chunk = recent[i : i + chunk_size]
            if chunk:
                f_rate = sum(1 for r in chunk if r.status == "failed") / len(chunk)
                fail_series.append(f_rate)

        if len(fail_series) >= 3:
            s_final, is_alarm_cusum, s_hist = tabular_cusum(
                historical_mean=base_fail_rate,
                series=fail_series,
                slack=cfg.cusum_slack,
                threshold=cfg.cusum_threshold,
            )
            is_pract_cusum = s_final >= cfg.cusum_threshold

            results.append(
                DetectorResult(
                    detector_type=DetectorType.CUSUM_SHIFT,
                    metric_name="sequential_failure_rate_shift",
                    target_entity="overall_failures",
                    test_statistic=s_final,
                    p_value_raw=None,  # CUSUM has no p-value
                    p_value_adjusted_fdr=None,
                    baseline_value=round(base_fail_rate, 4),
                    observed_value=round(float(np.mean(fail_series)), 4),
                    absolute_delta=round(s_final, 4),
                    relative_delta_percent=None,
                    is_statistically_significant=is_alarm_cusum,
                    is_practically_significant=is_pract_cusum,
                    sample_size_baseline=n_base,
                    sample_size_recent=n_recent,
                    details={"evaluated_sub_windows": len(fail_series), "cusum_history": s_hist},
                )
            )

        return results

    def _apply_fdr_correction(
        self, detector_results: List[DetectorResult], alpha: float
    ) -> List[DetectorResult]:
        """
        Applies Benjamini-Hochberg FDR correction exclusively to p-value producing tests.
        Non-p-value detectors (PSI, CUSUM) retain their raw statistical flags.
        """
        raw_p_values = [r.p_value_raw for r in detector_results]
        fdr_results = benjamini_hochberg_fdr(raw_p_values, alpha=alpha)

        for idx, (res, (p_adj, is_rejected)) in enumerate(zip(detector_results, fdr_results)):
            if res.p_value_raw is not None:
                res.p_value_adjusted_fdr = p_adj
                res.is_statistically_significant = is_rejected
            else:
                # PSI and CUSUM statistical significance was already set by their threshold checks
                res.p_value_adjusted_fdr = None

        return detector_results

    def _process_alerts_and_handoffs(
        self,
        dna: BehavioralDNAProfile,
        detector_results: List[DetectorResult],
        windowed_records: List[NormalizedPaymentRecord],
        cfg: GuardianConfig,
        evaluated_at_iso: str,
    ) -> Tuple[List[GuardianAlert], List[GuardianTwinHandoff]]:
        """
        Evaluates dual significance, manages alert state transitions (OPEN, RECOVERED),
        computes diagnostic associations, and produces Twin handoffs.
        """
        active_alerts: List[GuardianAlert] = []
        twin_handoffs: List[GuardianTwinHandoff] = []
        n_recent = len(windowed_records)
        base_aov = (
            dna.amount_distribution.summary.mean
            if dna.amount_distribution.summary
            else 1000.0
        )

        seen_fingerprints: Set[str] = set()

        for res in detector_results:
            fingerprint = f"fp_{res.metric_name}_{res.target_entity or 'all'}"
            seen_fingerprints.add(fingerprint)

            # Dual Significance Gate: Statistical AND Practical
            is_breached = res.is_statistically_significant and res.is_practically_significant

            if is_breached:
                severity = self._calculate_severity(res)
                window_desc = f"Last {n_recent} transactions"

                # Diagnostic Associations & Business Impact
                diag_assoc = self._compute_diagnostic_associations(dna, res, windowed_records)
                biz_impact = self._compute_business_impact(dna, res, windowed_records, base_aov)

                # State / Deduplication Management
                if fingerprint in self._alerts_by_fingerprint:
                    existing_alert = self._alerts_by_fingerprint[fingerprint]
                    existing_alert.status = AlertStatus.OPEN
                    existing_alert.consecutive_windows += 1
                    existing_alert.observed_value = res.observed_value
                    existing_alert.absolute_delta = res.absolute_delta
                    existing_alert.relative_delta_percent = res.relative_delta_percent
                    existing_alert.test_statistic = res.test_statistic
                    existing_alert.p_value_raw = res.p_value_raw
                    existing_alert.p_value_adjusted_fdr = res.p_value_adjusted_fdr
                    existing_alert.last_evaluated_at_iso = evaluated_at_iso
                    existing_alert.severity = severity
                    existing_alert.diagnostic_associations = diag_assoc
                    existing_alert.business_impact = biz_impact
                    active_alerts.append(existing_alert)
                    alert_for_handoff = existing_alert
                else:
                    alert_id = f"alt_{res.metric_name}_{int(time.time())}"
                    new_alert = GuardianAlert(
                        alert_id=alert_id,
                        fingerprint=fingerprint,
                        metric=res.metric_name,
                        detector=res.detector_type,
                        severity=severity,
                        status=AlertStatus.OPEN,
                        baseline_value=res.baseline_value,
                        observed_value=res.observed_value,
                        absolute_delta=res.absolute_delta,
                        relative_delta_percent=res.relative_delta_percent,
                        test_statistic=res.test_statistic,
                        p_value_raw=res.p_value_raw,
                        p_value_adjusted_fdr=res.p_value_adjusted_fdr,
                        threshold=cfg.alpha_fdr if res.p_value_raw is not None else cfg.psi_threshold_moderate,
                        sample_size_recent=res.sample_size_recent,
                        sample_size_baseline=res.sample_size_baseline,
                        window_description=window_desc,
                        consecutive_windows=1,
                        first_detected_at_iso=evaluated_at_iso,
                        last_evaluated_at_iso=evaluated_at_iso,
                        diagnostic_associations=diag_assoc,
                        business_impact=biz_impact,
                        baseline_provenance_type=dna.provenance.data_source_type,
                    )
                    self._alerts_by_fingerprint[fingerprint] = new_alert
                    self._alerts_by_id[alert_id] = new_alert
                    active_alerts.append(new_alert)
                    alert_for_handoff = new_alert

                # Generate Twin Handoff Payload
                handoff = self._create_twin_handoff(alert_for_handoff, res)
                twin_handoffs.append(handoff)

            else:
                # Check for Auto-Recovery if an alert previously existed
                if fingerprint in self._alerts_by_fingerprint:
                    existing_alert = self._alerts_by_fingerprint[fingerprint]
                    if existing_alert.status == AlertStatus.OPEN:
                        existing_alert.status = AlertStatus.RECOVERED
                        existing_alert.recovered_at_iso = evaluated_at_iso
                        existing_alert.last_evaluated_at_iso = evaluated_at_iso

        return active_alerts, twin_handoffs

    def _calculate_severity(self, res: DetectorResult) -> AlertSeverity:
        """
        Calculates alert severity based on effect magnitude, target rail, and detector evidence.
        """
        abs_delta = abs(res.absolute_delta)

        # 1. Method/Overall Success Drop
        if "success_rate" in res.metric_name:
            if "overall" in res.metric_name or "upi" in res.metric_name:
                if abs_delta >= 0.15:
                    return AlertSeverity.CRITICAL
                elif abs_delta >= 0.08:
                    return AlertSeverity.HIGH
                else:
                    return AlertSeverity.MEDIUM
            else:
                # Secondary rails (card, netbanking)
                if abs_delta >= 0.15:
                    return AlertSeverity.HIGH
                elif abs_delta >= 0.06:
                    return AlertSeverity.MEDIUM
                else:
                    return AlertSeverity.LOW

        # 2. Bank Failure Surge
        if "bank" in res.metric_name:
            if abs_delta >= 0.20:
                return AlertSeverity.HIGH
            else:
                return AlertSeverity.MEDIUM

        # 3. CUSUM Shift
        if res.detector_type == DetectorType.CUSUM_SHIFT:
            if res.test_statistic >= 0.15:
                return AlertSeverity.CRITICAL
            else:
                return AlertSeverity.HIGH

        # 4. PSI Categorical Shift
        if res.detector_type == DetectorType.PSI_CATEGORICAL:
            if res.test_statistic >= 0.25:
                return AlertSeverity.MEDIUM
            else:
                return AlertSeverity.INFO

        # 5. KS AOV Drift
        if res.detector_type == DetectorType.TWO_SAMPLE_KS:
            return AlertSeverity.LOW

        return AlertSeverity.INFO

    def _compute_diagnostic_associations(
        self,
        dna: BehavioralDNAProfile,
        res: DetectorResult,
        windowed_records: List[NormalizedPaymentRecord],
    ) -> List[DiagnosticAssociation]:
        """
        Computes evidence-based cross-tabulation (e.g. UPI decline driven by specific bank decline).
        """
        associations: List[DiagnosticAssociation] = []

        # If UPI or overall capture rate drops, check bank failure contributions
        if "upi_success" in res.metric_name or "overall_success" in res.metric_name:
            target_method = "upi" if "upi_success" in res.metric_name else None
            scoped_records = (
                [r for r in windowed_records if r.method and r.method.lower() == "upi"]
                if target_method
                else windowed_records
            )

            total_failures = sum(1 for r in scoped_records if r.status == "failed")
            if total_failures == 0:
                return []

            # Group failures by bank
            bank_failures: Dict[str, int] = {}
            bank_totals: Dict[str, int] = {}
            for r in scoped_records:
                if r.bank:
                    b = r.bank.upper()
                    bank_totals[b] = bank_totals.get(b, 0) + 1
                    if r.status == "failed":
                        bank_failures[b] = bank_failures.get(b, 0) + 1

            for b, f_count in bank_failures.items():
                tot_b = bank_totals[b]
                obs_f_rate = f_count / tot_b
                # Baseline bank capture rate
                b_metric = dna.success_dynamics.by_bank.get(b)
                base_b_succ = b_metric.rate if b_metric else (dna.success_dynamics.overall_success_rate or 0.85)
                base_b_fail = 1.0 - base_b_succ

                excess_f = max(0, f_count - int(round(tot_b * base_b_fail)))
                contrib_pct = (excess_f / total_failures) * 100.0 if total_failures > 0 else 0.0

                if contrib_pct >= 25.0:  # Major contributor
                    associations.append(
                        DiagnosticAssociation(
                            entity_type="ISSUING_BANK",
                            entity_name=b,
                            baseline_rate=round(base_b_succ, 4),
                            observed_rate=round(1.0 - obs_f_rate, 4),
                            excess_failures_attributed=excess_f,
                            relative_contribution_percent=round(contrib_pct, 1),
                            association_statement=(
                                f"{b}-linked transactions were associated with {contrib_pct:.1f}% of excess declines."
                            ),
                        )
                    )

        return associations

    def _compute_business_impact(
        self,
        dna: BehavioralDNAProfile,
        res: DetectorResult,
        windowed_records: List[NormalizedPaymentRecord],
        base_aov: float,
    ) -> BusinessImpact:
        """
        Computes observed vs. counterfactual estimated business and volume impact.
        """
        n_recent = len(windowed_records)
        obs_failed = sum(1 for r in windowed_records if r.status == "failed")
        obs_failed_vol = sum(r.amount_inr for r in windowed_records if r.status == "failed")

        base_succ = dna.success_dynamics.overall_success_rate or 0.85
        expected_fail = int(round(n_recent * (1.0 - base_succ)))
        excess_fail = max(0, obs_failed - expected_fail)
        rev_at_risk = round(excess_fail * base_aov, 2)

        return BusinessImpact(
            observed_failed_orders=obs_failed,
            observed_failed_volume_inr=round(obs_failed_vol, 2),
            expected_failed_orders=expected_fail,
            excess_failed_orders=excess_fail,
            estimated_revenue_at_risk_inr=rev_at_risk,
            is_estimated=True,
        )

    def _create_twin_handoff(
        self, alert: GuardianAlert, res: DetectorResult
    ) -> GuardianTwinHandoff:
        """
        Constructs structured data-only handoff contract for Payment Twin What-If counterfactual exploration.
        """
        rev_risk = alert.business_impact.estimated_revenue_at_risk_inr if alert.business_impact else 0.0
        affected_count = alert.business_impact.excess_failed_orders if alert.business_impact else 0

        # Suggested exploration scenarios based on anomaly target
        suggested: List[Dict[str, Any]] = []
        if "upi" in res.metric_name:
            suggested.append(
                {
                    "intervention_type": "METHOD_ROUTING_PREFERENCE",
                    "target": "card",
                    "shift_percentage": 20.0,
                    "rationale": "Test shifting traffic away from degraded UPI to Cards",
                }
            )
            suggested.append(
                {
                    "intervention_type": "METHOD_SWITCH_POLICY",
                    "switch_propensity_override": 0.85,
                    "preferred_fallback_method": "card",
                    "rationale": "Test smart fallback recommendations on UPI declines",
                }
            )
        elif "card" in res.metric_name:
            suggested.append(
                {
                    "intervention_type": "METHOD_ROUTING_PREFERENCE",
                    "target": "upi",
                    "shift_percentage": 25.0,
                    "rationale": "Test shifting traffic from degraded Cards to UPI",
                }
            )

        return GuardianTwinHandoff(
            handoff_id=f"hnd_{alert.alert_id}",
            source_alert_id=alert.alert_id,
            anomaly_type="METHOD_SUCCESS_RATE_DEGRADATION" if "success" in res.metric_name else "DISTRIBUTION_DRIFT",
            target_entity=res.target_entity or "overall",
            baseline_rate=res.baseline_value,
            observed_rate=res.observed_value,
            delta=res.absolute_delta,
            affected_order_count=affected_count,
            estimated_revenue_at_risk_inr=rev_risk,
            suggested_scenario_interventions=suggested,
        )
