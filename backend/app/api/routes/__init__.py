"""
Aggregated API routes module.
"""

from fastapi import APIRouter
from app.api.routes import agents, data, dna, health, scenarios, simulation

api_router = APIRouter()

# Include sub-routers under /api/v1
api_router.include_router(health.router)
api_router.include_router(data.router)
api_router.include_router(dna.router)
api_router.include_router(agents.router)
api_router.include_router(simulation.router)
api_router.include_router(scenarios.router)
