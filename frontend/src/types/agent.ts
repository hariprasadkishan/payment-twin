export type FunnelState =
  | "BROWSING"
  | "CHECKOUT_OPENED"
  | "METHOD_SELECTED"
  | "AUTHENTICATING"
  | "PROCESSING"
  | "SUCCESS"
  | "FAILED"
  | "RETRY_EVALUATION"
  | "ABANDONED"
  | "TERMINATED_SUCCESS"
  | "TERMINATED_ABANDONED";

export type AgentArchetype =
  | "FAST_CHECKOUT"
  | "PATIENT_RETRYER"
  | "METHOD_SWITCHER"
  | "HIGH_TICKET";

export interface AgentEvent {
  timestamp_relative_sec: number;
  from_state: FunnelState;
  to_state: FunnelState;
  action: string;
  details: Record<string, unknown>;
}

export interface ObservedPreferences {
  primary_method: string;
  secondary_method?: string | null;
  sub_instrument?: string | null;
  transaction_amount_inr: number;
  amount_tier: string;
}

export interface LatentParameters {
  max_retries: number;
  retry_propensity: number;
  method_switch_propensity: number;
  friction_sensitivity: number;
  patience_timeout_seconds: number;
  is_retry_calibrated: boolean;
  is_method_switch_calibrated: boolean;
}

export interface RuntimeState {
  attempt_count: number;
  active_method?: string | null;
  has_completed: boolean;
  is_successful: boolean;
  terminal_reason?: string | null;
}

export interface CustomerAgent {
  agent_id: string;
  archetype: AgentArchetype;
  random_seed: number;
  current_state: FunnelState;
  observed_preferences: ObservedPreferences;
  latent_parameters: LatentParameters;
  runtime_state: RuntimeState;
  event_history: AgentEvent[];
}

export interface CalibrationDiagnostics {
  method_distribution_mae?: number | null;
  amount_mean_error_inr?: number | null;
  retry_rate_drift?: number | null;
  method_switch_drift?: number | null;
  archetype_distribution: Record<string, number>;
  is_calibrated: boolean;
  warnings: string[];
}

export interface PopulationMetadata {
  population_id: string;
  population_size: number;
  random_seed: number;
  source_dna_version: string;
  dna_provenance_type: string;
  is_synthetic_benchmark: boolean;
  generated_at_iso: string;
  provenance_disclaimer: string;
}

export interface AgentGenerationRequest {
  population_size?: number;
  random_seed?: number;
  preview_count?: number;
  dataset?: string | null;
}

export interface AgentGenerationResponse {
  status: string;
  message: string;
  population_metadata?: PopulationMetadata | null;
  calibration_diagnostics?: CalibrationDiagnostics | null;
  total_generated_count: number;
  preview_agents: CustomerAgent[];
}
