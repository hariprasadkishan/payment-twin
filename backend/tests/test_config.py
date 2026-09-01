"""
Configuration and environment loading tests.
Ensures environment variables and credentials load securely without exposing secret values.
"""

from app.core.config import Settings, get_settings


def test_settings_load_successfully() -> None:
    """
    Verify Settings object loads properly from environment/.env.
    """
    settings: Settings = get_settings()
    assert settings.PROJECT_NAME == "Payment Twin API"
    assert settings.PORT == 8000
    assert isinstance(settings.CORS_ORIGINS, list)


def test_razorpay_credentials_loaded_safely() -> None:
    """
    Verify that Razorpay credentials are present and non-empty in settings
    without exposing or logging any secret values.
    """
    settings: Settings = get_settings()
    has_key_id = bool(settings.RAZORPAY_KEY_ID and len(settings.RAZORPAY_KEY_ID.strip()) > 0)
    has_key_secret = bool(settings.RAZORPAY_KEY_SECRET and len(settings.RAZORPAY_KEY_SECRET.strip()) > 0)

    # Validate that both credentials are non-empty
    assert has_key_id is True, "RAZORPAY_KEY_ID is missing or empty in configuration"
    assert has_key_secret is True, "RAZORPAY_KEY_SECRET is missing or empty in configuration"
