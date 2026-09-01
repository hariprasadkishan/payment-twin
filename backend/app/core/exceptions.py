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


class RazorpayConfigurationError(PaymentTwinException):
    """Raised when Razorpay credentials or required settings are missing."""

    def __init__(self, message: str = "Razorpay API credentials (KEY_ID / KEY_SECRET) are not configured.") -> None:
        super().__init__(
            message=message,
            code="RAZORPAY_CONFIG_ERROR",
            status_code=503,
            details={"configured": False},
        )


class RazorpayAuthError(PaymentTwinException):
    """Raised when authentication with Razorpay API fails."""

    def __init__(self, message: str = "Authentication with Razorpay API failed (HTTP 401 Unauthorized).") -> None:
        super().__init__(
            message=message,
            code="RAZORPAY_AUTH_ERROR",
            status_code=401,
            details={},
        )


class RazorpayAPIError(PaymentTwinException):
    """Raised when Razorpay API returns an error status code (4xx/5xx)."""

    def __init__(
        self,
        message: str,
        status_code: int = 502,
        razorpay_error_code: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None,
    ) -> None:
        super().__init__(
            message=message,
            code=razorpay_error_code or "RAZORPAY_API_ERROR",
            status_code=status_code,
            details=details or {},
        )


class RazorpayConnectionError(PaymentTwinException):
    """Raised when a network timeout or connection error occurs with Razorpay."""

    def __init__(self, message: str = "Failed to connect to Razorpay API (network timeout or connection error).") -> None:
        super().__init__(
            message=message,
            code="RAZORPAY_CONNECTION_ERROR",
            status_code=504,
            details={},
        )


class DataIngestionError(PaymentTwinException):
    """Raised when an error occurs during data normalization or saving."""

    def __init__(self, message: str, details: Optional[Dict[str, Any]] = None) -> None:
        super().__init__(
            message=message,
            code="INGESTION_ERROR",
            status_code=500,
            details=details or {},
        )

