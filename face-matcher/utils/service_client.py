import logging
import time
from typing import Any

import requests

RETRY_ATTEMPTS    = 3
RETRY_BASE_DELAY  = 0.5  # seconds

logger = logging.getLogger(__name__)


def create_service_client(base_url: str):
    def _request(method: str, path: str, user_id: str, body: Any = None) -> Any:
        url     = f"{base_url}{path}"
        headers = {"x-user-id": user_id}

        for attempt in range(1, RETRY_ATTEMPTS + 1):
            try:
                resp = requests.request(method, url, headers=headers, json=body, timeout=10)

                if 400 <= resp.status_code < 500:
                    logger.error(f"Service call failed [{method} {url}] with status {resp.status_code}: {resp.text}")
                    resp.raise_for_status()

                resp.raise_for_status()
                return resp.json()

            except requests.HTTPError:
                raise
            except Exception as e:
                if attempt < RETRY_ATTEMPTS:
                    delay = RETRY_BASE_DELAY * (2 ** (attempt - 1))
                    logger.warning(f"Service call attempt {attempt}/{RETRY_ATTEMPTS} failed [{method} {url}]: {e} — retrying in {delay}s")
                    time.sleep(delay)
                else:
                    logger.error(f"Service call failed after {RETRY_ATTEMPTS} attempts [{method} {url}]: {e}")
                    raise

    class ServiceClient:
        def get(self, path: str, user_id: str) -> Any:
            return _request("GET", path, user_id)

        def post(self, path: str, user_id: str, body: Any = None) -> Any:
            return _request("POST", path, user_id, body)

        def patch(self, path: str, user_id: str, body: Any = None) -> Any:
            return _request("PATCH", path, user_id, body)

        def delete(self, path: str, user_id: str) -> Any:
            return _request("DELETE", path, user_id)

    return ServiceClient()
