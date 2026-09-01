export interface DatasetValidationError {
  line_number: number;
  error_type: string;
  message: string;
  field_name?: string | null;
}

export interface DatasetFileInfo {
  filename: string;
  file_path: string;
  file_size_bytes: number;
  total_lines: number;
  valid_records: number;
  invalid_records: number;
  is_valid: boolean;
  created_at_iso?: string | null;
  modified_at_iso?: string | null;
  validation_errors: DatasetValidationError[];
}

export interface DatasetListResponse {
  status: string;
  message: string;
  total_datasets: number;
  datasets: DatasetFileInfo[];
}

export interface FinancialSummary {
  total_amount_inr: number;
  average_amount_inr: number;
  median_amount_inr: number;
  min_amount_inr: number;
  max_amount_inr: number;
  total_fee_inr: number;
  total_tax_inr: number;
}

export interface StatusSummary {
  captured_count: number;
  failed_count: number;
  other_count: number;
  success_rate_percent: number;
  failure_rate_percent: number;
  status_counts: Record<string, number>;
}

export interface TimeRangeSummary {
  earliest_unix?: number | null;
  latest_unix?: number | null;
  earliest_iso?: string | null;
  latest_iso?: string | null;
  timespan_seconds?: number | null;
}

export interface DatasetSummaryResponse {
  status: string;
  message: string;
  dataset_source?: string | null;
  total_records: number;
  financial_metrics?: FinancialSummary | null;
  status_metrics?: StatusSummary | null;
  method_distribution: Record<string, number>;
  bank_distribution?: Record<string, number>;
  time_range?: TimeRangeSummary | null;
  datasets_analyzed?: string[];
}

export interface PaymentIngestionRequest {
  count?: number;
  skip?: number;
  from_timestamp?: number | null;
  to_timestamp?: number | null;
  max_pages?: number;
  save_to_disk?: boolean;
}

export interface PaymentIngestionResponse {
  status: string;
  batch_id: string;
  records_fetched: number;
  records_saved: number;
  file_path?: string | null;
  timestamp_range?: { min?: number | null; max?: number | null } | null;
  methods_breakdown: Record<string, number>;
  status_breakdown: Record<string, number>;
}

export interface RazorpayConnectionTestResponse {
  connected: boolean;
  status: string;
  message: string;
  sample_count?: number | null;
}
