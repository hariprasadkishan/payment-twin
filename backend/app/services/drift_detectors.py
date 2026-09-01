"""
Pure Statistical Drift Detectors for Payment Guardian.
Implements PSI for categorical distributions, Two-Proportion Z-Tests, Fisher Exact Tests,
Two-Sample Kolmogorov-Smirnov Tests, Tabular CUSUM, and Benjamini-Hochberg FDR correction.
Zero external network or database dependencies.
"""

import math
from typing import Dict, List, Optional, Tuple
import numpy as np
import scipy.stats as stats


def calculate_psi(
    baseline_dist: Dict[str, float],
    recent_dist: Dict[str, float],
    epsilon: float = 1e-4,
) -> Tuple[float, str]:
    """
    Computes the Population Stability Index (PSI) between two categorical probability distributions.
    
    Formula:
      PSI = Σ (P_recent - P_baseline) * ln((P_recent + epsilon) / (P_baseline + epsilon))
      
    Classification:
      PSI < 0.10  => STABLE
      0.10 <= PSI < 0.25 => MODERATE_DRIFT
      PSI >= 0.25 => SIGNIFICANT_DRIFT
      
    Note: PSI is an information-theoretic distance metric and does NOT produce a p-value.
    """
    all_categories = sorted(set(baseline_dist.keys()).union(set(recent_dist.keys())))
    if not all_categories:
        return 0.0, "STABLE"

    # Normalize to proper probability mass functions
    base_sum = sum(baseline_dist.values())
    rec_sum = sum(recent_dist.values())

    p_base = {k: (baseline_dist.get(k, 0.0) / base_sum) if base_sum > 0 else 0.0 for k in all_categories}
    p_rec = {k: (recent_dist.get(k, 0.0) / rec_sum) if rec_sum > 0 else 0.0 for k in all_categories}

    psi_total = 0.0
    for cat in all_categories:
        b = p_base[cat]
        r = p_rec[cat]
        term = (r - b) * math.log((r + epsilon) / (b + epsilon))
        psi_total += term

    psi_val = max(0.0, round(float(psi_total), 4))

    if psi_val < 0.10:
        classification = "STABLE"
    elif psi_val < 0.25:
        classification = "MODERATE_DRIFT"
    else:
        classification = "SIGNIFICANT_DRIFT"

    return psi_val, classification


def two_proportion_ztest(
    x_base: int, n_base: int, x_recent: int, n_recent: int
) -> Tuple[float, float]:
    """
    Performs a two-sided two-proportion z-test comparing recent vs. baseline proportions.
    
    Assumptions:
      Independent samples with normal approximation: n_base * p >= 5 and n_recent * p >= 5.
    Returns:
      (z_statistic, raw_p_value)
    """
    if n_base <= 0 or n_recent <= 0:
        return 0.0, 1.0

    p_base = x_base / n_base
    p_recent = x_recent / n_recent

    p_pool = (x_base + x_recent) / (n_base + n_recent)
    se_pool = math.sqrt(p_pool * (1.0 - p_pool) * (1.0 / n_base + 1.0 / n_recent))

    if se_pool == 0.0 or math.isnan(se_pool):
        return 0.0, 1.0

    z = (p_recent - p_base) / se_pool
    p_val = 2.0 * (1.0 - stats.norm.cdf(abs(z)))

    return round(float(z), 4), float(max(0.0, min(1.0, p_val)))


def fisher_exact_test(
    x_base: int, n_base: int, x_recent: int, n_recent: int
) -> Tuple[float, float]:
    """
    Performs Fisher's exact test for small sample contingency tables (e.g. rare bank declines).
    
    Table:
      [[x_recent, n_recent - x_recent],
       [x_base,   n_base - x_base]]
    """
    if n_base <= 0 or n_recent <= 0:
        return 1.0, 1.0

    table = [
        [max(0, x_recent), max(0, n_recent - x_recent)],
        [max(0, x_base), max(0, n_base - x_base)],
    ]
    odds_ratio, p_value = stats.fisher_exact(table, alternative="two-sided")
    odds_val = round(float(odds_ratio), 4) if not math.isnan(odds_ratio) else 1.0
    return odds_val, float(max(0.0, min(1.0, p_value)))


def two_sample_ks_test(
    base_values: List[float], recent_values: List[float]
) -> Tuple[float, float]:
    """
    Performs a two-sample Kolmogorov-Smirnov (KS) test to detect continuous empirical CDF drift
    in transaction amounts or latencies.
    
    Requirements:
      len(recent_values) >= 40 and len(base_values) >= 40.
    """
    if len(base_values) < 2 or len(recent_values) < 2:
        return 0.0, 1.0

    res = stats.ks_2samp(base_values, recent_values)
    return round(float(res.statistic), 4), float(max(0.0, min(1.0, res.pvalue)))


def tabular_cusum(
    historical_mean: float,
    series: List[float],
    slack: float = 0.02,
    threshold: float = 0.08,
) -> Tuple[float, bool, List[float]]:
    """
    Computes a one-sided upper Tabular Cumulative Sum (CUSUM) to detect sequential,
    persistent upward shifts in failure rate across observation windows.
    
    Formula:
      S_0 = 0
      S_t = max(0, S_{t-1} + (x_t - historical_mean - slack))
      Alarm triggered when S_t >= threshold.
    """
    s_current = 0.0
    history: List[float] = []

    for val in series:
        s_current = max(0.0, s_current + (val - historical_mean - slack))
        history.append(round(s_current, 4))

    is_alarm = s_current >= threshold
    return round(s_current, 4), is_alarm, history


def benjamini_hochberg_fdr(
    p_values: List[Optional[float]], alpha: float = 0.05
) -> List[Tuple[Optional[float], bool]]:
    """
    Applies the Benjamini-Hochberg (BH) procedure to control False Discovery Rate (FDR)
    across multiple concurrent hypothesis tests.
    
    Crucial Rule:
      Only p-value-based tests participate in BH correction.
      Non-p-value detectors (PSI, CUSUM) must pass None and receive (None, False).
    """
    n = len(p_values)
    results: List[Tuple[Optional[float], bool]] = [(None, False)] * n

    # Extract valid numeric p-values with original indices
    indexed_p = [(idx, p) for idx, p in enumerate(p_values) if p is not None and not math.isnan(p)]
    m = len(indexed_p)

    if m == 0:
        return results

    # Sort by ascending p-value
    indexed_p.sort(key=lambda x: x[1])

    # Compute step-up adjusted p-values
    # p_adj(i) = min(1.0, min_{j >= i} (m / j * p_(j)))
    adj_p_sorted = [0.0] * m
    cum_min = 1.0

    for rank_idx in range(m - 1, -1, -1):
        orig_idx, p_val = indexed_p[rank_idx]
        rank = rank_idx + 1  # 1-based rank
        curr_adj = (m / rank) * p_val
        cum_min = min(cum_min, curr_adj)
        adj_p_sorted[rank_idx] = max(0.0, min(1.0, cum_min))

    for rank_idx, (orig_idx, _) in enumerate(indexed_p):
        p_adj = round(adj_p_sorted[rank_idx], 6)
        is_rejected = p_adj < alpha
        results[orig_idx] = (p_adj, is_rejected)

    return results
