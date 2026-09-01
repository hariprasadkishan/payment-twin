export type DetectorType =
  | "PSI_CATEGORICAL"
  | "TWO_PROPORTION_ZTEST"
  | "FISHER_EXACT"
  | "TWO_SAMPLE_KS"
  | "CUSUM_SHIFT";

export type AlertSeverity = "INFO" | "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type AlertStatus = "OPEN" | "ACKNOWLEDGED" | "RESOLVED" | "RECOVERED";

export type GuardianWindowMode = "COUNT_BASED" | "TIME_BASED";

export interface GuardianConfig {
  window_mode?: GuardianWindowMode;
  window_size_count?: number;
  window_size_hours?: number;
  min_sample_threshold?: number;
  psi_threshold_moderate?: number;
  psi_threshold_significant?: number;
  alpha_fdr?: number;
  cusum_slack?: number;
  cusum_threshold?: number;
  min_effect_size_capture_rate?: number;
  min_effect_size_method_share?: number;
  min_effect_size_bank_failure?: number;
  min_effect_size_aov?: number;
  recovery_consecutive_windows?: number;
  dataset?: string | null;
}

export interface DetectorResult {
  detector_type: DetectorType;
  metric_name: string;
  target_entity?: string | null;
  test_statistic: number;
  p_value_raw?: number | null;
  p_value_adjusted_fdr?: number | null;
  baseline_value: number;
  observed_value: number;
  absolute_delta: number;
  relative_delta_percent?: number | null;
  is_statistically_significant: boolean;
  is_practically_significant: boolean;
  sample_size_baseline: number;
  sample_size_recent: number;
  details: Record<string, unknown>;
}

export interface DiagnosticAssociation {
  entity_type: string;
  entity_name: string;
  baseline_rate: number;
  observed_rate: number;
  excess_failures_attributed: number;
  relative_contribution_percent: number;
  association_statement: string;
}

export interface BusinessImpact {
  observed_failed_orders: number;
  observed_failed_volume_inr: number;
  expected_failed_orders: number;
  excess_failed_orders: number;
  estimated_revenue_at_risk_inr: number;
  is_estimated: boolean;
}

export interface GuardianAlert {
  alert_id: string;
  fingerprint: string;
  metric: string;
  detector: DetectorType;
  severity: AlertSeverity;
  status: AlertStatus;
  baseline_value: number;
  observed_value: number;
  absolute_delta: number;
  relative_delta_percent?: number | null;
  test_statistic: number;
  p_value_raw?: number | null;
  p_value_adjusted_fdr?: number | null;
  threshold: number;
  sample_size_recent: number;
  sample_size_baseline: number;
  window_description: string;
  consecutive_windows: number;
  first_detected_at_iso: string;
  last_evaluated_at_iso: string;
  recovered_at_iso?: string | null;
  diagnostic_associations: DiagnosticAssociation[];
  business_impact?: BusinessImpact | null;
  baseline_provenance_type: string;
}

export interface GuardianTwinHandoff {
  handoff_id: string;
  source_alert_id: string;
  anomaly_type: string;
  target_entity: string;
  baseline_rate: number;
  observed_rate: number;
  delta: number;
  affected_order_count: number;
  estimated_revenue_at_risk_inr: number;
  suggested_scenario_interventions: Record<string, unknown>[];
}

export interface GuardianAnalysisResult {
  status: string;
  message: string;
  analysis_id: string;
  evaluated_at_iso: string;
  recent_window_size: number;
  recent_sample_count: number;
  baseline_sample_count: number;
  dna_version: string;
  dna_reliability_grade: string;
  reliability_warning?: string | null;
  active_alerts_count: number;
  active_alerts: GuardianAlert[];
  all_detector_results: DetectorResult[];
  twin_handoffs: GuardianTwinHandoff[];
  baseline_provenance_type: string;
  recent_provenance_type: string;
  is_synthetic_benchmark: boolean;
  provenance_disclaimer: string;
}

export interface GuardianStatusResponse {
  guardian_available: boolean;
  status: string;
  message: string;
  dna_available: boolean;
  dna_reliability_grade: string;
  baseline_sample_size: number;
  active_alerts_count: number;
  open_alerts: GuardianAlert[];
  last_analysis_timestamp?: string | null;
}
