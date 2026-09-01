export type ObjectiveType =
  | "MAX_NET_REVENUE"
  | "MAX_CONVERSION_RATE"
  | "MIN_PROCESSING_FEES"
  | "MIN_FAILURE_RATE"
  | "MIN_ABANDONMENT_RATE"
  | "MIN_AVG_ATTEMPTS";

export type ObjectiveDirection = "MAXIMIZE" | "MINIMIZE";

export interface ObjectiveDefinition {
  objective_type: ObjectiveType;
  metric_name: string;
  direction: ObjectiveDirection;
  unit: string;
  is_available: boolean;
}

export type ConstraintType =
  | "MIN_CONVERSION_RATE"
  | "MAX_PROCESSING_FEES"
  | "MAX_FAILURE_RATE"
  | "MIN_NET_REVENUE";

export interface MerchantConstraint {
  constraint_type: ConstraintType;
  threshold_value: number;
  description?: string | null;
}

export interface ParetoScenarioItem {
  scenario_id: string;
  scenario_name: string;
  parameter_values: Record<string, number>;
  objective_values: Record<string, number>;
  is_pareto_optimal: boolean;
  dominated_by: string[];
  dominates_count: number;
  uncertainty_bounds: Record<string, Record<string, unknown>>;
  tradeoff_notes?: string | null;
}

export interface InfeasibleScenarioItem {
  scenario_id: string;
  scenario_name: string;
  parameter_values: Record<string, number>;
  violated_constraints: string[];
  metric_values: Record<string, number>;
}

export interface TradeoffSummary {
  conversion_rate_range_percent: number[];
  net_revenue_range_inr: number[];
  processing_fees_range_inr: number[];
}

export interface OptimizationRequest {
  optimization_name?: string;
  objectives?: ObjectiveType[];
  constraints?: MerchantConstraint[];
  parameter_ranges: Record<string, number[]>;
  population_size?: number;
  random_seed?: number;
  max_candidates?: number;
  dataset?: string | null;
}

export interface ParetoFrontierResult {
  status: string;
  message: string;
  optimization_id: string;
  total_candidates_evaluated: number;
  feasible_candidates_count: number;
  infeasible_candidates_count: number;
  frontier_size: number;
  objectives: ObjectiveDefinition[];
  constraints: MerchantConstraint[];
  frontier_scenarios: ParetoScenarioItem[];
  dominated_scenarios: ParetoScenarioItem[];
  infeasible_scenarios: InfeasibleScenarioItem[];
  tradeoff_summary: TradeoffSummary;
  baseline_summary: Record<string, number>;
  dna_provenance_type: string;
  is_synthetic_benchmark: boolean;
  provenance_disclaimer: string;
}
