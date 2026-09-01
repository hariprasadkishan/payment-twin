import { AgentArchetype, FunnelState } from "./agent";

export interface ModelledLatencyAssumptions {
  upi_auth_latency_sec?: [number, number];
  card_auth_latency_sec?: [number, number];
  netbanking_auth_latency_sec?: [number, number];
  wallet_auth_latency_sec?: [number, number];
  gateway_proc_latency_sec?: [number, number];
}

export interface SimulationConfig {
  simulation_id?: string | null;
  population_size?: number;
  random_seed?: number;
  max_retries_override?: number | null;
  timeout_seconds_override?: number | null;
  enable_event_traces?: boolean;
  preview_agent_count?: number;
  dataset?: string | null;
  latency_assumptions?: ModelledLatencyAssumptions | null;
}

export interface SimulationEvent {
  event_id: string;
  simulation_id: string;
  agent_id: string;
  timestamp_ms: number;
  state_from: FunnelState;
  state_to: FunnelState;
  action: string;
  method?: string | null;
  amount_inr: number;
  attempt_number: number;
  details: Record<string, unknown>;
}

export interface AgentSimulationResult {
  agent_id: string;
  archetype: AgentArchetype;
  is_successful: boolean;
  is_abandoned: boolean;
  final_state: FunnelState;
  total_attempts: number;
  final_method: string;
  method_switched: boolean;
  amount_inr: number;
  fee_inr: number;
  tax_inr: number;
  terminal_reason?: string | null;
  total_duration_ms: number;
  event_trace: SimulationEvent[];
}

export interface MethodSimulationKPI {
  attempted_count: number;
  captured_count: number;
  failed_count: number;
  success_rate_percent: number;
  attempted_volume_inr: number;
  captured_volume_inr: number;
  processing_fees_inr: number;
}

export interface SimulationKPIs {
  total_agents: number;
  successful_transactions: number;
  failed_transactions: number;
  abandoned_transactions: number;
  total_payment_attempts: number;
  retry_attempts_count: number;
  method_switches_count: number;
  conversion_rate_percent: number;
  failure_rate_percent: number;
  abandonment_rate_percent: number;
  gross_attempted_volume_inr: number;
  captured_volume_inr: number;
  lost_volume_inr: number;
  total_processing_fees_inr: number;
  total_taxes_inr: number;
  net_merchant_revenue_inr: number;
  average_ticket_size_inr: number;
  average_attempts_per_success: number;
  execution_duration_ms: number;
}

export interface SimulationResult {
  status: string;
  message: string;
  simulation_id: string;
  population_size: number;
  random_seed: number;
  dna_provenance_type: string;
  is_synthetic_benchmark: boolean;
  provenance_disclaimer: string;
  kpis?: SimulationKPIs | null;
  method_breakdown: Record<string, MethodSimulationKPI>;
  funnel_dropoffs: Record<string, number>;
  preview_agent_traces: AgentSimulationResult[];
}

export interface MonteCarloMetricDistribution {
  mean: number;
  std_dev: number;
  ci_95: [number, number];
  p5: number;
  p50: number;
  p95: number;
}

export interface MonteCarloSimulationResult {
  status: string;
  message: string;
  simulation_id: string;
  total_runs: number;
  population_per_run: number;
  master_random_seed: number;
  dna_provenance_type: string;
  is_synthetic_benchmark: boolean;
  provenance_disclaimer: string;
  summary_metrics: Record<string, MonteCarloMetricDistribution>;
  execution_duration_ms: number;
}

export interface MonteCarloRequest {
  population_size?: number;
  monte_carlo_runs?: number;
  random_seed?: number;
  dataset?: string | null;
}
