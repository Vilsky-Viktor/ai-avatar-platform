from __future__ import annotations

import logging
import time
from typing import Any

import requests

RETRY_ATTEMPTS   = 3
RETRY_BASE_DELAY = 0.5

logger = logging.getLogger(__name__)

_DEFAULT_TIMEOUT = 10


class ServiceClient:
    def __init__(self, base_url: str, timeout: int = _DEFAULT_TIMEOUT) -> None:
        self._base_url = base_url
        self._timeout  = timeout

    def _request(self, method: str, path: str, user_id: str, body: Any = None) -> Any:
        url     = f"{self._base_url}{path}"
        headers = {"x-user-id": user_id}

        for attempt in range(1, RETRY_ATTEMPTS + 1):
            try:
                resp = requests.request(
                    method, url, headers=headers, json=body, timeout=self._timeout
                )

                if 400 <= resp.status_code < 500:
                    logger.error(
                        "Service call failed [%s %s] status %d: %s",
                        method, url, resp.status_code, resp.text,
                    )
                    resp.raise_for_status()

                resp.raise_for_status()
                return resp.json()

            except requests.HTTPError:
                raise
            except Exception as e:
                if attempt < RETRY_ATTEMPTS:
                    delay = RETRY_BASE_DELAY * (2 ** (attempt - 1))
                    logger.warning(
                        "Service call attempt %d/%d failed [%s %s]: %s — retrying in %.1fs",
                        attempt, RETRY_ATTEMPTS, method, url, e, delay,
                    )
                    time.sleep(delay)
                else:
                    logger.error(
                        "Service call failed after %d attempts [%s %s]: %s",
                        RETRY_ATTEMPTS, method, url, e,
                    )
                    raise

    def get(self, path: str, user_id: str) -> Any:
        return self._request("GET", path, user_id)

    def post(self, path: str, user_id: str, body: Any = None) -> Any:
        return self._request("POST", path, user_id, body)

    def patch(self, path: str, user_id: str, body: Any = None) -> Any:
        return self._request("PATCH", path, user_id, body)

    def delete(self, path: str, user_id: str) -> Any:
        return self._request("DELETE", path, user_id)


def create_service_client(base_url: str, timeout: int = _DEFAULT_TIMEOUT) -> ServiceClient:
    return ServiceClient(base_url, timeout)
