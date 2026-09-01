import { SimulationKPIs } from "./simulation";

export type InterventionType =
  | "METHOD_SUCCESS_RATE"
  | "METHOD_ROUTING_PREFERENCE"
  | "RETRY_POLICY"
  | "METHOD_SWITCH_POLICY"
  | "LATENCY_FRICTION"
  | "FEE_MDR_RATE"
  | "BANK_HEALTH_MODIFIER";

export type InterventionMode = "ABSOLUTE" | "DELTA";

export interface ScenarioIntervention {
  intervention_type: InterventionType;
  target?: string | null;
  mode?: InterventionMode;
  value?: number | null;
  shift_percentage?: number | null;
  max_retries_override?: number | null;
  retry_propensity_multiplier?: number | null;
  switch_propensity_override?: number | null;
  preferred_fallback_method?: string | null;
  auth_latency_multiplier?: number | null;
  gateway_proc_latency_multiplier?: number | null;
  health_multiplier?: number | null;
  description?: string | null;
}

export interface ScenarioConfig {
  scenario_id: string;
  scenario_name: string;
  description?: string | null;
  interventions: ScenarioIntervention[];
  population_size?: number;
  random_seed?: number;
  preview_agent_count?: number;
  dataset?: string | null;
}

export interface MetricComparison {
  metric_name: string;
  baseline_value: number;
  scenario_value: number;
  absolute_delta: number;
  percentage_delta?: number | null;
}

export interface AttributionStep {
  step_order: number;
  category: "DIRECT_LEVER" | "FUNNEL_REACTION" | "CONVERSION_IMPACT" | "FINANCIAL_BOTTOM_LINE" | string;
  description: string;
  quantitative_impact: Record<string, unknown>;
}

export interface ScenarioComparison {
  comparison_id: string;
  scenario_id: string;
  scenario_name: string;
  dna_provenance_type: string;
  is_synthetic_benchmark: boolean;
  provenance_disclaimer: string;
  metric_comparisons: Record<string, MetricComparison>;
  method_deltas: Record<string, Record<string, number>>;
  attribution_trail: AttributionStep[];
  baseline_kpis?: SimulationKPIs | null;
  scenario_kpis?: SimulationKPIs | null;
}

export interface ScenarioRunRequest {
  scenario: ScenarioConfig;
}

export interface ScenarioCompareRequest {
  scenarios: ScenarioConfig[];
  population_size?: number;
  random_seed?: number;
  dataset?: string | null;
}

export interface ScenarioCompareResponse {
  status: string;
  message: string;
  baseline_simulation_id?: string | null;
  baseline_kpis?: SimulationKPIs | null;
  comparisons: ScenarioComparison[];
}

export interface ScenarioMatrixRequest {
  matrix_name?: string;
  interventions_grid: Record<string, number[]>;
  population_size?: number;
  random_seed?: number;
  ranking_criterion?: string;
  dataset?: string | null;
}

export interface MatrixScenarioRankItem {
  rank: number;
  scenario_id: string;
  parameter_values: Record<string, number>;
  conversion_rate_percent: number;
  captured_volume_inr: number;
  net_merchant_revenue_inr: number;
  processing_fees_inr: number;
  revenue_delta_percent?: number | null;
  conversion_delta_percent?: number | null;
}

export interface ScenarioMatrixResponse {
  status: string;
  message: string;
  matrix_name: string;
  total_scenarios_evaluated: number;
  ranking_criterion: string;
  baseline_summary: Record<string, number>;
  ranked_scenarios: MatrixScenarioRankItem[];
}
