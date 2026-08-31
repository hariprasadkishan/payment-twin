# Payment Twin - Backend Service

FastAPI backend service powering the **Payment Twin** simulation engine, Behavioral DNA profiling, and Payment Guardian monitoring sentinel.

---

## 1. Directory Structure

```
backend/
├── app/
│   ├── __init__.py          # Package marker & version info
│   ├── main.py              # FastAPI application factory, middleware, exception handlers
│   ├── core/
│   │   ├── __init__.py      # Core module exports
│   │   ├── config.py        # Pydantic Settings & environment variable configuration
│   │   ├── exceptions.py    # Standardized domain exception classes
│   │   └── logging.py       # Centralized structured logging setup
│   ├── api/
│   │   ├── __init__.py      # API package exports
│   │   └── routes/
│   │       ├── __init__.py  # Aggregated API router
│   │       └── health.py    # Health check route (GET /health)
│   ├── models/
│   │   └── __init__.py      # Data contracts and domain schemas (Phase 1+)
│   └── services/
│       └── __init__.py      # Business logic & simulation services (Phase 2+)
├── tests/
│   ├── __init__.py          # Test package marker
│   └── test_health.py       # Health check and OpenAPI validation tests
├── requirements.txt         # Core backend dependencies
└── README.md                # Backend service documentation (this file)
```

---

## 2. Setup & Installation

### 2.1 Prerequisites
- Python 3.11+ (Python 3.14 compatible)
- `pip` package manager

### 2.2 Virtual Environment Setup

From the `backend/` directory:

```bash
# Create virtual environment
python3 -m venv .venv

# Activate virtual environment
# On macOS / Linux:
source .venv/bin/activate

# On Windows:
# .venv\Scripts\activate

# Install dependencies
pip install --upgrade pip
pip install -r requirements.txt
```

---

## 3. Running the Development Server

Start the FastAPI application using Uvicorn with auto-reload enabled:

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Alternatively, run directly from the root of `backend/`:

```bash
python -m app.main
```

The API will be live at `http://localhost:8000`.

---

## 4. Endpoints & API Documentation

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/health` | Service liveness probe returning `{"status": "ok"}` |
| `GET` | `/api/v1/health` | Versioned health check endpoint |
| `GET` | `/docs` | Interactive Swagger UI documentation |
| `GET` | `/redoc` | ReDoc API documentation |
| `GET` | `/openapi.json` | OpenAPI 3.1 specification schema |

---

## 5. Running Automated Tests

Run the test suite using `pytest`:

```bash
# Run all tests
pytest

# Run with verbose output
pytest -v
```
