"""
Isolated Razorpay API client handling authentication, pagination, and error translation.
"""

from typing import Any, Dict, List, Optional
import httpx

from app.core.config import Settings, get_settings
from app.core.exceptions import (
    RazorpayAPIError,
    RazorpayAuthError,
    RazorpayConfigurationError,
    RazorpayConnectionError,
)
from app.core.logging import logger
from app.models.payment import RazorpayPaymentCollection, RazorpayPaymentItem


class RazorpayClient:
    """
    Dedicated HTTP client for communicating with the Razorpay API.
    Enforces secure credential handling and isolated error translation.
    """

    def __init__(
        self,
        key_id: Optional[str] = None,
        key_secret: Optional[str] = None,
        base_url: Optional[str] = None,
        timeout: Optional[float] = None,
    ) -> None:
        settings: Settings = get_settings()
        self.key_id = key_id if key_id is not None else settings.RAZORPAY_KEY_ID
        self.key_secret = key_secret if key_secret is not None else settings.RAZORPAY_KEY_SECRET
        self.base_url = (base_url or settings.RAZORPAY_BASE_URL).rstrip("/")
        self.timeout = timeout or settings.RAZORPAY_TIMEOUT_SECONDS

    def _validate_credentials(self) -> None:
        """
        Validates that API key and secret are present before attempting network calls.
        """
        if not self.key_id or not self.key_secret:
            logger.error("Razorpay API request attempted without credentials configured.")
            raise RazorpayConfigurationError(
                "Razorpay API credentials (RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET) are missing or empty."
            )

    def _get_auth(self) -> httpx.BasicAuth:
        self._validate_credentials()
        return httpx.BasicAuth(username=self.key_id, password=self.key_secret)  # type: ignore

    async def fetch_payments_page(
        self,
        count: int = 100,
        skip: int = 0,
        from_timestamp: Optional[int] = None,
        to_timestamp: Optional[int] = None,
    ) -> RazorpayPaymentCollection:
        """
        Fetches a single page of payments from Razorpay GET /v1/payments.
        """
        self._validate_credentials()

        params: Dict[str, Any] = {
            "count": max(1, min(count, 100)),
            "skip": max(0, skip),
        }
        if from_timestamp is not None:
            params["from"] = from_timestamp
        if to_timestamp is not None:
            params["to"] = to_timestamp

        endpoint = f"{self.base_url}/payments"
        logger.info("Fetching Razorpay payments page: count=%d, skip=%d", params["count"], params["skip"])

        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.get(
                    endpoint,
                    auth=self._get_auth(),
                    params=params,
                    headers={"Accept": "application/json"},
                )
        except httpx.TimeoutException as exc:
            logger.error("Timeout while connecting to Razorpay payments API at %s", endpoint)
            raise RazorpayConnectionError("Connection timed out while querying Razorpay payments endpoint.") from exc
        except httpx.RequestError as exc:
            logger.error("Network error while connecting to Razorpay: %s", type(exc).__name__)
            raise RazorpayConnectionError(f"Network error communicating with Razorpay API: {type(exc).__name__}") from exc

        if response.status_code == 401:
            logger.error("Razorpay API authentication failed (401 Unauthorized).")
            raise RazorpayAuthError("Invalid Razorpay API credentials provided.")

        if response.status_code >= 400:
            error_details: Dict[str, Any] = {}
            error_msg = f"Razorpay API returned error status {response.status_code}"
            error_code = "RAZORPAY_API_ERROR"

            try:
                data = response.json()
                if "error" in data and isinstance(data["error"], dict):
                    err = data["error"]
                    error_msg = err.get("description") or error_msg
                    error_code = err.get("code") or error_code
                    error_details = {
                        "source": err.get("source"),
                        "step": err.get("step"),
                        "reason": err.get("reason"),
                    }
            except Exception:
                error_details = {"raw_body": response.text[:200]}

            logger.error("Razorpay API Error [%s]: %s (HTTP %d)", error_code, error_msg, response.status_code)
            raise RazorpayAPIError(
                message=error_msg,
                status_code=response.status_code,
                razorpay_error_code=error_code,
                details=error_details,
            )

        try:
            payload = response.json()
            return RazorpayPaymentCollection.model_validate(payload)
        except Exception as exc:
            logger.error("Failed to parse Razorpay API response payload: %s", str(exc))
            raise RazorpayAPIError(
                message="Received malformed or unexpected response format from Razorpay API.",
                status_code=502,
                razorpay_error_code="MALFORMED_API_RESPONSE",
                details={"parse_error": str(exc)},
            ) from exc

    async def fetch_payments(
        self,
        count: int = 100,
        skip: int = 0,
        from_timestamp: Optional[int] = None,
        to_timestamp: Optional[int] = None,
        max_pages: int = 1,
    ) -> List[RazorpayPaymentItem]:
        """
        Retrieves multiple pages of payments from Razorpay API handling pagination.
        """
        all_items: List[RazorpayPaymentItem] = []
        current_skip = skip
        page_size = max(1, min(count, 100))

        for page in range(max(1, max_pages)):
            collection = await self.fetch_payments_page(
                count=page_size,
                skip=current_skip,
                from_timestamp=from_timestamp,
                to_timestamp=to_timestamp,
            )

            all_items.extend(collection.items)
            logger.info("Page %d: Retrieved %d items (Total so far: %d)", page + 1, len(collection.items), len(all_items))

            # Stop if page has fewer items than requested, indicating last page
            if len(collection.items) < page_size:
                break

            current_skip += len(collection.items)

        return all_items

    async def test_connection(self) -> Dict[str, Any]:
        """
        Executes a read-only request (GET /v1/payments?count=1) to verify API credentials and connectivity.
        Never logs or exposes secret keys or authorization headers.
        """
        logger.info("Executing read-only Razorpay Test Mode connection test...")
        collection = await self.fetch_payments_page(count=1, skip=0)
        logger.info("Razorpay connection test successful. Retrieved collection with %d items.", len(collection.items))
        return {
            "connected": True,
            "status": "ok",
            "message": "Successfully authenticated with Razorpay Test Mode API.",
            "sample_count": len(collection.items),
        }
