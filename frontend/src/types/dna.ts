export interface DataProvenance {
  data_source_type: string;
  is_synthetic_benchmark: boolean;
  source_datasets: string[];
  extracted_at_iso: string;
  total_sample_size: number;
  timespan_days?: number | null;
}

export interface ReliabilityAssessment {
  confidence_grade: string;
  confidence_score: number;
  sample_size_adequate: boolean;
  subsegment_reliability: Record<string, string>;
  notes: string[];
}

export interface MethodPriors {
  probabilities: Record<string, number>;
  sub_instrument_priors: Record<string, Record<string, number>>;
  amount_conditioned_priors: Record<string, Record<string, number>>;
  sample_size: number;
}

export interface SuccessRateMetric {
  rate: number;
  ci_95?: [number, number] | null;
  sample_size: number;
}

export interface SuccessDynamics {
  overall_success_rate?: number | null;
  overall_confidence_interval_95?: [number, number] | null;
  by_method: Record<string, SuccessRateMetric>;
  by_bank: Record<string, SuccessRateMetric>;
  sample_size: number;
}

export interface FailureDiagnostics {
  failed_sample_size: number;
  error_source_distribution: Record<string, number>;
  error_step_distribution: Record<string, number>;
  top_error_reasons: Record<string, number>;
  top_error_codes: Record<string, number>;
}

export interface AmountSummary {
  mean: number;
  median: number;
  std_dev: number;
  iqr: number;
  skewness: number;
}

export interface ParametricFitResult {
  distribution_family: string;
  is_adequate_fit: boolean;
  parameters: Record<string, number>;
  ks_test_statistic?: number | null;
  ks_test_p_value?: number | null;
  note?: string | null;
}

export interface AmountDistribution {
  sample_size: number;
  summary?: AmountSummary | null;
  quantiles: Record<string, number>;
  parametric_fit?: ParametricFitResult | null;
  aov_by_method: Record<string, number>;
}

export interface TemporalDynamics {
  has_sufficient_timespan: boolean;
  timespan_days: number;
  hour_of_day_priors?: number[] | null;
  day_of_week_priors?: number[] | null;
  peak_hours_utc: number[];
  status_message: string;
}

export interface FeeEconomics {
  has_fee_data: boolean;
  sample_size_with_fees: number;
  effective_blended_mdr_percent?: number | null;
  mdr_by_method_percent: Record<string, number>;
  effective_tax_rate_percent?: number | null;
}

export interface EmpiricalTransitions {
  has_order_tracking: boolean;
  tracked_orders_count: number;
  multi_attempt_orders_count: number;
  overall_retry_probability_on_failure?: number | null;
  method_switch_on_retry_probability?: number | null;
  unobserved_dropouts_note: string;
}

export interface BehavioralDNAProfile {
  status: string;
  dna_version: string;
  provenance: DataProvenance;
  reliability: ReliabilityAssessment;
  method_priors: MethodPriors;
  success_dynamics: SuccessDynamics;
  failure_diagnostics: FailureDiagnostics;
  amount_distribution: AmountDistribution;
  temporal_dynamics: TemporalDynamics;
  fee_economics: FeeEconomics;
  empirical_transitions: EmpiricalTransitions;
}

export interface DNAStatusResponse {
  status: string;
  profiling_available: boolean;
  available_sample_count: number;
  confidence_grade: string;
  provenance_type: string;
  source_files_count: number;
  message: string;
}
