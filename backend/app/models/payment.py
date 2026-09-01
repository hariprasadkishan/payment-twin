"""
Payment data contracts and schemas verified against the official Razorpay API specifications.
"""

from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field, ConfigDict


class RazorpayPaymentItem(BaseModel):
    """
    Direct representation of a payment object returned by the Razorpay GET /v1/payments endpoint.
    Only includes fields officially returned in Razorpay payment collection entities.
    """

    model_config = ConfigDict(extra="ignore")

    id: str = Field(..., description="Unique payment identifier (e.g., pay_xxxxxxxxxxxxxx)")
    entity: str = Field(default="payment", description="Entity type, usually 'payment'")
    amount: int = Field(..., ge=0, description="Payment amount in currency subunits (paise for INR)")
    currency: str = Field(default="INR", description="3-letter ISO currency code")
    status: str = Field(..., description="Payment status: created, authorized, captured, refunded, failed")
    order_id: Optional[str] = Field(default=None, description="Associated Razorpay order ID")
    invoice_id: Optional[str] = Field(default=None, description="Associated Razorpay invoice ID")
    international: bool = Field(default=False, description="Whether this is an international payment")
    method: str = Field(..., description="Payment instrument method: card, netbanking, wallet, emi, upi, etc.")
    amount_refunded: int = Field(default=0, ge=0, description="Total amount refunded in currency subunits")
    refund_status: Optional[str] = Field(default=None, description="null, partial, or full")
    captured: bool = Field(default=False, description="Whether the payment has been captured")
    description: Optional[str] = Field(default=None, description="Payment description")
    card_id: Optional[str] = Field(default=None, description="Card ID if paid via card")
    bank: Optional[str] = Field(default=None, description="Bank code for netbanking/card payments (e.g. HDFC, SBIN)")
    wallet: Optional[str] = Field(default=None, description="Wallet code if paid via wallet (e.g. paytm, mobikwik)")
    vpa: Optional[str] = Field(default=None, description="Virtual Payment Address for UPI")
    email: Optional[str] = Field(default=None, description="Customer email (PII to be redacted in normalization)")
    contact: Optional[str] = Field(default=None, description="Customer contact (PII to be redacted in normalization)")
    fee: Optional[int] = Field(default=None, description="Gateway transaction fee charged in currency subunits")
    tax: Optional[int] = Field(default=None, description="Tax charged on transaction fee in currency subunits")
    error_code: Optional[str] = Field(default=None, description="Error code on failure (e.g. BAD_REQUEST_ERROR)")
    error_description: Optional[str] = Field(default=None, description="Human readable failure description")
    error_source: Optional[str] = Field(default=None, description="Source of error: customer, gateway, bank, etc.")
    error_step: Optional[str] = Field(default=None, description="Payment flow step where failure occurred")
    error_reason: Optional[str] = Field(default=None, description="Machine-readable failure reason")
    acquirer_data: Optional[Dict[str, Any]] = Field(default=None, description="Acquirer response data (RRN, auth code)")
    created_at: int = Field(..., description="UNIX timestamp when payment was created")


class RazorpayPaymentCollection(BaseModel):
    """
    Collection entity returned by Razorpay pagination endpoints.
    """

    entity: str = Field(default="collection")
    count: int = Field(..., ge=0)
    items: List[RazorpayPaymentItem] = Field(default_factory=list)


class NormalizedPaymentRecord(BaseModel):
    """
    Standardized, sanitized, and type-safe payment record for downstream Behavioral DNA analysis.
    All PII (customer email, contact, full VPA) is strictly redacted or extracted to provider handle only.
    """

    payment_id: str
    order_id: Optional[str] = None
    amount_paise: int
    amount_inr: float
    currency: str
    status: str
    method: str
    bank: Optional[str] = None
    wallet: Optional[str] = None
    vpa_provider: Optional[str] = None
    international: bool = False
    captured: bool = False
    fee_paise: Optional[int] = None
    tax_paise: Optional[int] = None
    fee_inr: Optional[float] = None
    tax_inr: Optional[float] = None
    error_code: Optional[str] = None
    error_description: Optional[str] = None
    error_source: Optional[str] = None
    error_step: Optional[str] = None
    error_reason: Optional[str] = None
    acquirer_rrn: Optional[str] = None
    acquirer_auth_code: Optional[str] = None
    created_at_unix: int
    created_at_iso: str

    @classmethod
    def from_raw(cls, raw: RazorpayPaymentItem) -> "NormalizedPaymentRecord":
        """
        Transforms a raw RazorpayPaymentItem into a sanitized NormalizedPaymentRecord.
        """
        # Redact VPA to handle/domain provider only (e.g. user@okaxis -> okaxis)
        vpa_provider: Optional[str] = None
        if raw.vpa and "@" in raw.vpa:
            vpa_provider = raw.vpa.split("@")[-1].strip().lower()
        elif raw.vpa:
            vpa_provider = "custom_vpa"

        # Extract acquirer identifiers if present
        rrn: Optional[str] = None
        auth_code: Optional[str] = None
        if raw.acquirer_data and isinstance(raw.acquirer_data, dict):
            rrn = str(raw.acquirer_data.get("rrn") or raw.acquirer_data.get("upi_transaction_id") or "") or None
            auth_code = str(raw.acquirer_data.get("auth_code") or "") or None

        # Format ISO timestamp
        created_iso = datetime.fromtimestamp(raw.created_at, tz=timezone.utc).isoformat()

        return cls(
            payment_id=raw.id,
            order_id=raw.order_id,
            amount_paise=raw.amount,
            amount_inr=round(raw.amount / 100.0, 2),
            currency=raw.currency,
            status=raw.status.lower(),
            method=raw.method.lower(),
            bank=raw.bank.upper() if raw.bank else None,
            wallet=raw.wallet.lower() if raw.wallet else None,
            vpa_provider=vpa_provider,
            international=raw.international,
            captured=raw.captured,
            fee_paise=raw.fee,
            tax_paise=raw.tax,
            fee_inr=round(raw.fee / 100.0, 2) if raw.fee is not None else None,
            tax_inr=round(raw.tax / 100.0, 2) if raw.tax is not None else None,
            error_code=raw.error_code,
            error_description=raw.error_description,
            error_source=raw.error_source,
            error_step=raw.error_step,
            error_reason=raw.error_reason,
            acquirer_rrn=rrn,
            acquirer_auth_code=auth_code,
            created_at_unix=raw.created_at,
            created_at_iso=created_iso,
        )


class PaymentIngestionRequest(BaseModel):
    """
    Parameters for triggering payment data ingestion from Razorpay Test API.
    """

    count: int = Field(default=100, ge=1, le=100, description="Items per API request (max 100 per Razorpay spec)")
    skip: int = Field(default=0, ge=0, description="Initial offset skip")
    from_timestamp: Optional[int] = Field(default=None, description="Filter payments created on or after UNIX timestamp")
    to_timestamp: Optional[int] = Field(default=None, description="Filter payments created on or before UNIX timestamp")
    max_pages: int = Field(default=1, ge=1, le=50, description="Maximum number of pages to fetch in this batch")
    save_to_disk: bool = Field(default=True, description="Whether to persist normalized records under data/raw/")


class PaymentIngestionResponse(BaseModel):
    """
    Summary response returned after completing an ingestion run.
    """

    status: str = Field(default="success", description="Overall ingestion status")
    batch_id: str = Field(..., description="Unique identifier for this ingestion batch")
    records_fetched: int = Field(..., ge=0, description="Number of raw records retrieved from Razorpay API")
    records_saved: int = Field(..., ge=0, description="Number of normalized records saved")
    file_path: Optional[str] = Field(default=None, description="Path to the saved normalized dataset file")
    timestamp_range: Optional[Dict[str, Optional[int]]] = Field(
        default=None, description="Min and max timestamp across ingested records"
    )
    methods_breakdown: Dict[str, int] = Field(default_factory=dict, description="Count of records per payment method")
    status_breakdown: Dict[str, int] = Field(default_factory=dict, description="Count of records per payment status")


class RazorpayConnectionTestResponse(BaseModel):
    """
    Response schema for Razorpay Test Mode connectivity verification.
    """

    connected: bool = Field(default=True, description="Whether authentication with Razorpay succeeded")
    status: str = Field(default="ok", description="Status indicator")
    message: str = Field(default="Successfully authenticated with Razorpay Test Mode API.")
    sample_count: Optional[int] = Field(default=None, description="Number of sample payments retrieved")

