"""
Tests for Synthetic Benchmark Dataset generation and seeding.
"""

from pathlib import Path
from fastapi.testclient import TestClient

from app.main import app
from app.models.payment import NormalizedPaymentRecord
from app.services.benchmark_seeder import BenchmarkDatasetService, BENCHMARK_FILENAME
from app.services.dataset_reader import DatasetLoaderService
from app.services.dna_profiler import BehavioralDNAProfiler


def test_benchmark_generation_and_statistical_integrity(tmp_path: Path) -> None:
    loader = DatasetLoaderService(raw_data_dir=str(tmp_path))
    seeder = BenchmarkDatasetService(loader=loader)

    records = seeder.generate_benchmark_records(sample_size=200, seed=42)
    assert len(records) == 200
    assert all(isinstance(r, NormalizedPaymentRecord) for r in records)

    # Check method distribution
    methods = [r.method for r in records]
    assert "upi" in methods
    assert "card" in methods
    assert "netbanking" in methods
    assert "wallet" in methods

    # Check capture & failures exist
    statuses = [r.status for r in records]
    assert "captured" in statuses
    assert "failed" in statuses

    # Check realistic INR amounts
    amounts = [r.amount_inr for r in records]
    assert min(amounts) >= 100.0
    assert max(amounts) <= 20000.0


def test_benchmark_file_seeding_and_dna_profiling(tmp_path: Path) -> None:
    loader = DatasetLoaderService(raw_data_dir=str(tmp_path))
    seeder = BenchmarkDatasetService(loader=loader)

    # 1. Seed benchmark
    file_path = seeder.seed_benchmark_file()
    assert file_path.exists()

    # 2. Verify DNA Profiler identifies as SYNTHETIC_BENCHMARK_DATA
    profiler = BehavioralDNAProfiler(loader=loader)
    status_resp = profiler.get_status()
    assert status_resp.profiling_available is True
    assert status_resp.provenance_type == "SYNTHETIC_BENCHMARK_DATA"

    profile = profiler.build_profile()
    assert profile.status == "ok"
    assert profile.provenance.data_source_type == "SYNTHETIC_BENCHMARK_DATA"
    assert profile.provenance.is_synthetic_benchmark is True

    # 3. Clear benchmark
    cleared = seeder.clear_benchmark_file()
    assert cleared is True
    assert not file_path.exists()

    status_empty = profiler.get_status()
    assert status_empty.profiling_available is False
    assert status_empty.provenance_type == "NO_DATA_AVAILABLE"


def test_benchmark_api_routes() -> None:
    client = TestClient(app)

    try:
        # Load benchmark via API
        r_load = client.post("/api/v1/data/benchmark/load")
        assert r_load.status_code == 200
        assert r_load.json()["status"] == "ok"
        assert r_load.json()["total_datasets"] >= 1

        # Check DNA status
        r_dna = client.get("/api/v1/dna/status")
        assert r_dna.status_code == 200
        assert r_dna.json()["provenance_type"] == "SYNTHETIC_BENCHMARK_DATA"
    finally:
        # Clear benchmark via API
        client.delete("/api/v1/data/benchmark/clear")

