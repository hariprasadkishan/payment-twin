export interface TwinScenarioHandoff {
  handoff_id: string;
  source_simulation_id: string;
  top_bottleneck: string;
  bottleneck_count: number;
  bottleneck_percent: number;
  lowest_performing_method?: string | null;
  lowest_method_rate?: number | null;
  baseline_conversion_rate: number;
  baseline_failure_rate: number;
  baseline_abandonment_rate: number;
  baseline_net_revenue: number;
  population_size: number;
  random_seed: number;
  provenance_type: string;
}

export interface ScenarioParetoHandoff {
  handoff_id: string;
  scenario_id: string;
  scenario_name: string;
  target_intervention: string;
  conversion_lift_percent: number;
  revenue_lift_inr: number;
  baseline_conversion_rate: number;
  projected_conversion_rate: number;
  population_size: number;
  random_seed: number;
}
