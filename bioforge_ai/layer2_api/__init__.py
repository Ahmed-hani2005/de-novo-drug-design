"""
BioForge AI - Layer 2: Universal API Router

This package provides robust, production-grade connectors to external bioinformatics databases
and APIs. All clients include:
- Asynchronous HTTP communication via httpx
- Automatic retry logic with exponential backoff via tenacity
- Comprehensive error handling and logging
- Type hints and Pydantic models for data validation

Modules:
    base_client: Core async HTTP client with resilience patterns
    cbioportal_fetcher: cBioPortal cancer genomics API connector
"""

from .base_client import (
    AsyncHTTPClient,
    BaseAPIResponse,
    APIError,
    RateLimitError,
    TimeoutError,
)

__all__ = [
    "AsyncHTTPClient",
    "BaseAPIResponse",
    "APIError",
    "RateLimitError",
    "TimeoutError",
]
