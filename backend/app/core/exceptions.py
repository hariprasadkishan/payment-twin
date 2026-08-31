"""
Custom exception hierarchy and error handling primitives for Payment Twin.
"""

from typing import Any, Dict, Optional


class PaymentTwinException(Exception):
    """
    Base exception class for all domain and operational errors within Payment Twin.
    """

    def __init__(
        self,
        message: str,
        code: str = "INTERNAL_SERVER_ERROR",
        status_code: int = 500,
        details: Optional[Dict[str, Any]] = None,
    ) -> None:
        super().__init__(message)
        self.message = message
        self.code = code
        self.status_code = status_code
        self.details = details or {}


class ResourceNotFoundError(PaymentTwinException):
    """Raised when an entity (scenario, run, dataset) is not found."""

    def __init__(self, resource_type: str, resource_id: str) -> None:
        super().__init__(
            message=f"{resource_type} with ID '{resource_id}' was not found.",
            code="RESOURCE_NOT_FOUND",
            status_code=404,
            details={"resource_type": resource_type, "resource_id": resource_id},
        )


class InvalidPayloadError(PaymentTwinException):
    """Raised when an input configuration fails validation."""

    def __init__(self, message: str, details: Optional[Dict[str, Any]] = None) -> None:
        super().__init__(
            message=message,
            code="INVALID_PAYLOAD",
            status_code=422,
            details=details or {},
        )
