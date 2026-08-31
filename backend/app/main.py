"""
Main FastAPI Application Entrypoint for Payment Twin Backend.
"""

from contextlib import asynccontextmanager
from typing import AsyncGenerator
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.routes import api_router, health
from app.core.config import Settings, get_settings
from app.core.exceptions import PaymentTwinException
from app.core.logging import logger, setup_logging


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """
    Lifespan context manager for application startup and shutdown lifecycle events.
    """
    settings: Settings = get_settings()
    setup_logging(log_level=settings.LOG_LEVEL)
    logger.info(
        "Starting %s v%s in [%s] mode...",
        settings.PROJECT_NAME,
        settings.VERSION,
        settings.ENVIRONMENT,
    )
    yield
    logger.info("Shutting down %s...", settings.PROJECT_NAME)


def create_application() -> FastAPI:
    """
    Application factory for initializing and configuring the FastAPI instance.
    """
    settings: Settings = get_settings()

    app = FastAPI(
        title=settings.PROJECT_NAME,
        version=settings.VERSION,
        description="Virtual model and behavioral simulation engine for merchant payment ecosystems.",
        docs_url="/docs",
        redoc_url="/redoc",
        openapi_url="/openapi.json",
        lifespan=lifespan,
    )

    # Configure Cross-Origin Resource Sharing (CORS)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Global Exception Handlers
    @app.exception_handler(PaymentTwinException)
    async def payment_twin_exception_handler(
        request: Request, exc: PaymentTwinException
    ) -> JSONResponse:
        logger.warning(
            "Domain Exception: [%s] %s | Details: %s",
            exc.code,
            exc.message,
            exc.details,
        )
        return JSONResponse(
            status_code=exc.status_code,
            content={
                "error": {
                    "code": exc.code,
                    "message": exc.message,
                    "details": exc.details,
                }
            },
        )

    @app.exception_handler(Exception)
    async def generic_exception_handler(request: Request, exc: Exception) -> JSONResponse:
        logger.exception("Unhandled Server Exception: %s", str(exc))
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={
                "error": {
                    "code": "INTERNAL_SERVER_ERROR",
                    "message": "An unexpected error occurred while processing your request.",
                    "details": {},
                }
            },
        )

    # Root-level health route for GET /health
    app.include_router(health.router)

    # Versioned API routes under /api/v1
    app.include_router(api_router, prefix=settings.API_V1_STR)

    return app


app: FastAPI = create_application()


if __name__ == "__main__":
    import uvicorn

    settings_instance = get_settings()
    uvicorn.run(
        "app.main:app",
        host=settings_instance.HOST,
        port=settings_instance.PORT,
        reload=True,
        log_level=settings_instance.LOG_LEVEL.lower(),
    )
