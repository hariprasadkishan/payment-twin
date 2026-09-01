export type ProvenanceType =
  | "OBSERVED_RAZORPAY_DATA"
  | "SYNTHETIC_BENCHMARK_DATA"
  | "MIXED_DERIVED"
  | "UNAVAILABLE";

export type ConfidenceGrade =
  | "GRADE_A"
  | "GRADE_B"
  | "GRADE_C"
  | "INSUFFICIENT_DATA"
  | "UNAVAILABLE";

export type SystemHealthStatus = "healthy" | "degraded" | "unavailable";
