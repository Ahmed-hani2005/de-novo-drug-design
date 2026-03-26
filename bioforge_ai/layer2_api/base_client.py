"""
BioForge AI - Layer 2: Universal API Router

This module provides the foundational infrastructure for all external API communications.
It includes a robust, asynchronous HTTP client with built-in retry logic, error handling,
and comprehensive logging to ensure production-grade reliability.

Author: BioForge AI Development Team
License: MIT
"""

from __future__ import annotations

import asyncio
import logging
import time
from typing import Any, Dict, Optional, TypeVar, Generic
from contextlib import asynccontextmanager

import httpx
from tenacity import (
    retry,
    stop_after_attempt,
    wait_exponential,
    retry_if_exception_type,
    retry_if_result,
    RetryCallState,
)
from pydantic import BaseModel, Field

# Configure structured logging
logger = logging.getLogger(__name__)

# Type variable for generic response handling
T = TypeVar("T")


class APIError(Exception):
    """Base exception for API-related errors."""

    def __init__(
        self,
        message: str,
        status_code: Optional[int] = None,
        response_body: Optional[Dict[str, Any]] = None,
        url: Optional[str] = None,
    ):
        self.message = message
        self.status_code = status_code
        self.response_body = response_body
        self.url = url
        super().__init__(self.message)

    def __str__(self) -> str:
        if self.status_code:
            return f"{self.message} (Status: {self.status_code}, URL: {self.url})"
        return f"{self.message} (URL: {self.url})" if self.url else self.message


class RateLimitError(APIError):
    """Exception raised when API rate limit is exceeded."""

    pass


class TimeoutError(APIError):
    """Exception raised when API request times out."""

    pass


class BaseAPIResponse(BaseModel):
    """Standardized response model for all API calls."""

    success: bool = Field(..., description="Whether the API call was successful")
    data: Optional[Dict[str, Any]] = Field(None, description="Response data payload")
    error: Optional[str] = Field(None, description="Error message if failed")
    status_code: Optional[int] = Field(None, description="HTTP status code")
    response_time_ms: float = Field(..., description="Response time in milliseconds")
    source: str = Field(..., description="Source API/database name")
    timestamp: float = Field(default_factory=time.time, description="Unix timestamp")


def _log_retry_attempt(retry_state: RetryCallState) -> None:
    """Log retry attempts for debugging and monitoring."""
    if retry_state.attempt_number > 1:
        logger.warning(
            f"Retry attempt {retry_state.attempt_number} for {retry_state.fn.__name__ if retry_state.fn else 'unknown function'}",
            extra={
                "attempt": retry_state.attempt_number,
                "exception": str(retry_state.outcome.exception()) if retry_state.outcome.failed else None,
            },
        )


class AsyncHTTPClient:
    """
    Production-grade asynchronous HTTP client with built-in resilience patterns.

    Features:
        - Automatic retry with exponential backoff
        - Comprehensive error handling and logging
        - Connection pooling and keep-alive
        - Request/response timeouts
        - Rate limiting awareness
        - Structured logging for observability

    Attributes:
        base_url: Base URL for the API endpoint
        timeout: Request timeout in seconds
        max_retries: Maximum number of retry attempts
        rate_limit_delay: Delay between requests for rate-limited APIs

    Example:
        >>> async with AsyncHTTPClient(base_url="https://api.cbioportal.org") as client:
        ...     response = await client.get("/api/studies")
        ...     print(response.data)
    """

    DEFAULT_TIMEOUT = 30.0
    DEFAULT_MAX_RETRIES = 3
    DEFAULT_RATE_LIMIT_DELAY = 0.5

    def __init__(
        self,
        base_url: str,
        timeout: float = DEFAULT_TIMEOUT,
        max_retries: int = DEFAULT_MAX_RETRIES,
        rate_limit_delay: float = DEFAULT_RATE_LIMIT_DELAY,
        headers: Optional[Dict[str, str]] = None,
    ):
        """
        Initialize the asynchronous HTTP client.

        Args:
            base_url: Base URL for the API endpoint
            timeout: Request timeout in seconds (default: 30.0)
            max_retries: Maximum number of retry attempts (default: 3)
            rate_limit_delay: Delay between requests in seconds (default: 0.5)
            headers: Optional default headers to include in all requests
        """
        self.base_url = base_url.rstrip("/")
        self.timeout = timeout
        self.max_retries = max_retries
        self.rate_limit_delay = rate_limit_delay
        self.default_headers = headers or {}

        self._client: Optional[httpx.AsyncClient] = None
        self._request_count = 0
        self._last_request_time: Optional[float] = None

        # Configure retry strategy
        self._retry_strategy = retry(
            stop=stop_after_attempt(max_retries),
            wait=wait_exponential(multiplier=1, min=2, max=60),
            retry=(
                retry_if_exception_type((httpx.TimeoutException, httpx.NetworkError, httpx.RemoteProtocolError))
                | retry_if_result(self._is_retryable_status)
            ),
            after=_log_retry_attempt,
        )

    def _is_retryable_status(self, response: Optional[httpx.Response]) -> bool:
        """Determine if a response status code warrants a retry."""
        if response is None:
            return False
        # Retry on server errors (5xx) and rate limiting (429)
        return response.status_code in {429, 500, 502, 503, 504}

    async def _apply_rate_limiting(self) -> None:
        """Apply rate limiting delay between requests."""
        if self._last_request_time is not None:
            elapsed = time.time() - self._last_request_time
            if elapsed < self.rate_limit_delay:
                await asyncio.sleep(self.rate_limit_delay - elapsed)
        self._last_request_time = time.time()

    @asynccontextmanager
    async def _get_client(self):
        """Context manager for HTTP client with connection pooling."""
        if self._client is None or self._client.is_closed:
            limits = httpx.Limits(max_keepalive_connections=10, max_connections=20)
            self._client = httpx.AsyncClient(
                base_url=self.base_url,
                timeout=httpx.Timeout(self.timeout, connect=10.0),
                limits=limits,
                headers=self.default_headers,
                follow_redirects=True,
            )
        try:
            yield self._client
        except Exception:
            # Don't close client on transient errors to maintain connection pool
            raise

    async def _make_request(
        self,
        method: str,
        endpoint: str,
        params: Optional[Dict[str, Any]] = None,
        json_data: Optional[Dict[str, Any]] = None,
        headers: Optional[Dict[str, str]] = None,
    ) -> httpx.Response:
        """
        Execute an HTTP request with rate limiting.

        Args:
            method: HTTP method (GET, POST, etc.)
            endpoint: API endpoint path
            params: Optional query parameters
            json_data: Optional JSON body for POST/PUT requests
            headers: Optional additional headers for this request

        Returns:
            httpx.Response object

        Raises:
            httpx.HTTPStatusError: For non-successful HTTP status codes
            httpx.TimeoutException: On request timeout
            httpx.NetworkError: On network connectivity issues
        """
        await self._apply_rate_limiting()
        self._request_count += 1

        merged_headers = {**self.default_headers, **(headers or {})}

        async with self._get_client() as client:
            response = await client.request(
                method=method.upper(),
                url=endpoint,
                params=params,
                json=json_data,
                headers=merged_headers,
            )
            response.raise_for_status()
            return response

    @staticmethod
    def _handle_response_errors(
        response: httpx.Response,
        start_time: float,
        source: str,
    ) -> BaseAPIResponse:
        """
        Handle HTTP response errors and create standardized error responses.

        Args:
            response: The HTTP response object
            start_time: Request start time for calculating response duration
            source: Name of the API source

        Returns:
            BaseAPIResponse with error details
        """
        response_time_ms = (time.time() - start_time) * 1000

        try:
            response_body = response.json()
        except (ValueError, httpx.JSONDecodeError):
            response_body = {"raw": response.text}

        error_message = f"HTTP {response.status_code}: {response.reason_phrase}"

        # Handle specific error types
        if response.status_code == 429:
            raise RateLimitError(
                message="Rate limit exceeded",
                status_code=response.status_code,
                response_body=response_body,
                url=str(response.url),
            )
        elif response.status_code >= 500:
            raise APIError(
                message=f"Server error: {error_message}",
                status_code=response.status_code,
                response_body=response_body,
                url=str(response.url),
            )
        elif response.status_code >= 400:
            raise APIError(
                message=f"Client error: {error_message}",
                status_code=response.status_code,
                response_body=response_body,
                url=str(response.url),
            )

        return BaseAPIResponse(
            success=False,
            error=error_message,
            status_code=response.status_code,
            response_time_ms=response_time_ms,
            source=source,
        )

    async def get(
        self,
        endpoint: str,
        params: Optional[Dict[str, Any]] = None,
        headers: Optional[Dict[str, str]] = None,
        source_name: str = "Unknown",
    ) -> BaseAPIResponse:
        """
        Execute a GET request with retry logic and error handling.

        Args:
            endpoint: API endpoint path
            params: Optional query parameters
            headers: Optional additional headers
            source_name: Name of the API source for logging

        Returns:
            BaseAPIResponse with success status and data or error details
        """
        start_time = time.time()

        @self._retry_strategy
        async def _get_with_retry():
            response = await self._make_request(
                method="GET",
                endpoint=endpoint,
                params=params,
                headers=headers,
            )
            return response

        try:
            response = await _get_with_retry()
            response_time_ms = (time.time() - start_time) * 1000

            try:
                data = response.json()
            except (ValueError, httpx.JSONDecodeError):
                data = {"raw": response.text}

            logger.info(
                f"Successful GET request to {source_name}",
                extra={
                    "endpoint": endpoint,
                    "status_code": response.status_code,
                    "response_time_ms": response_time_ms,
                    "source": source_name,
                },
            )

            return BaseAPIResponse(
                success=True,
                data=data,
                status_code=response.status_code,
                response_time_ms=response_time_ms,
                source=source_name,
            )

        except httpx.TimeoutException as e:
            logger.error(
                f"Timeout error in GET request to {source_name}",
                extra={"endpoint": endpoint, "error": str(e), "source": source_name},
            )
            raise TimeoutError(
                message=f"Request timed out after {self.timeout} seconds",
                url=f"{self.base_url}{endpoint}",
            )

        except httpx.HTTPStatusError as e:
            logger.warning(
                f"HTTP status error in GET request to {source_name}",
                extra={"endpoint": endpoint, "status_code": e.response.status_code, "source": source_name},
            )
            return self._handle_response_errors(e.response, start_time, source_name)

        except (httpx.NetworkError, httpx.RemoteProtocolError) as e:
            logger.error(
                f"Network error in GET request to {source_name}",
                extra={"endpoint": endpoint, "error": str(e), "source": source_name},
            )
            raise APIError(
                message=f"Network error: {str(e)}",
                url=f"{self.base_url}{endpoint}",
            )

        except RateLimitError:
            raise

        except Exception as e:
            logger.error(
                f"Unexpected error in GET request to {source_name}",
                extra={"endpoint": endpoint, "error": str(e), "source": source_name},
                exc_info=True,
            )
            raise APIError(
                message=f"Unexpected error: {str(e)}",
                url=f"{self.base_url}{endpoint}",
            )

    async def post(
        self,
        endpoint: str,
        json_data: Optional[Dict[str, Any]] = None,
        params: Optional[Dict[str, Any]] = None,
        headers: Optional[Dict[str, str]] = None,
        source_name: str = "Unknown",
    ) -> BaseAPIResponse:
        """
        Execute a POST request with retry logic and error handling.

        Args:
            endpoint: API endpoint path
            json_data: Optional JSON body for the request
            params: Optional query parameters
            headers: Optional additional headers
            source_name: Name of the API source for logging

        Returns:
            BaseAPIResponse with success status and data or error details
        """
        start_time = time.time()

        @self._retry_strategy
        async def _post_with_retry():
            response = await self._make_request(
                method="POST",
                endpoint=endpoint,
                params=params,
                json_data=json_data,
                headers=headers,
            )
            return response

        try:
            response = await _post_with_retry()
            response_time_ms = (time.time() - start_time) * 1000

            try:
                data = response.json()
            except (ValueError, httpx.JSONDecodeError):
                data = {"raw": response.text}

            logger.info(
                f"Successful POST request to {source_name}",
                extra={
                    "endpoint": endpoint,
                    "status_code": response.status_code,
                    "response_time_ms": response_time_ms,
                    "source": source_name,
                },
            )

            return BaseAPIResponse(
                success=True,
                data=data,
                status_code=response.status_code,
                response_time_ms=response_time_ms,
                source=source_name,
            )

        except httpx.TimeoutException as e:
            logger.error(
                f"Timeout error in POST request to {source_name}",
                extra={"endpoint": endpoint, "error": str(e), "source": source_name},
            )
            raise TimeoutError(
                message=f"Request timed out after {self.timeout} seconds",
                url=f"{self.base_url}{endpoint}",
            )

        except httpx.HTTPStatusError as e:
            logger.warning(
                f"HTTP status error in POST request to {source_name}",
                extra={"endpoint": endpoint, "status_code": e.response.status_code, "source": source_name},
            )
            return self._handle_response_errors(e.response, start_time, source_name)

        except (httpx.NetworkError, httpx.RemoteProtocolError) as e:
            logger.error(
                f"Network error in POST request to {source_name}",
                extra={"endpoint": endpoint, "error": str(e), "source": source_name},
            )
            raise APIError(
                message=f"Network error: {str(e)}",
                url=f"{self.base_url}{endpoint}",
            )

        except RateLimitError:
            raise

        except Exception as e:
            logger.error(
                f"Unexpected error in POST request to {source_name}",
                extra={"endpoint": endpoint, "error": str(e), "source": source_name},
                exc_info=True,
            )
            raise APIError(
                message=f"Unexpected error: {str(e)}",
                url=f"{self.base_url}{endpoint}",
            )

    async def close(self) -> None:
        """Close the HTTP client and release resources."""
        if self._client is not None and not self._client.is_closed:
            await self._client.aclose()
            logger.info("HTTP client closed successfully")

    async def __aenter__(self) -> "AsyncHTTPClient":
        """Async context manager entry."""
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb) -> None:
        """Async context manager exit."""
        await self.close()

    @property
    def request_count(self) -> int:
        """Get the total number of requests made with this client."""
        return self._request_count
