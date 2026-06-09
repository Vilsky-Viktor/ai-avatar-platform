import os
from typing import Optional

from loom24_shared.types import Job
from loom24_shared.services import ServiceClient, create_service_client

_client: Optional[ServiceClient] = None


def _get_client() -> ServiceClient:
    global _client
    if _client is None:
        _client = create_service_client(os.environ["JOB_MANAGER_URL"])
    return _client


def get_job(job: Job) -> Job:
    data = _get_client().get(f"/get/job/{job.id}", job.userId)
    return Job.model_validate(data)
