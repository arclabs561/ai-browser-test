"""
Configuration using Pydantic Settings for ai-browser-test examples.
"""

from pydantic_settings import BaseSettings, SettingsConfigDict


class AppSettings(BaseSettings):
    """Application settings with environment variable support."""
    
    # API Keys
    gemini_api_key: str | None = None
    openai_api_key: str | None = None
    anthropic_api_key: str | None = None
    
    # Default paths
    screenshot_path: str = "screenshot.png"
    test_url: str = "https://example.com"
    
    # Node.js settings
    node_executable: str = "node"
    
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )
    
    @property
    def api_key(self) -> str | None:
        """Get the first available API key."""
        return self.gemini_api_key or self.openai_api_key or self.anthropic_api_key
    
    @property
    def has_api_key(self) -> bool:
        """Check if any API key is configured."""
        return self.api_key is not None


