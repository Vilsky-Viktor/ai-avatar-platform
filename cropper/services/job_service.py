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


def get_job(job_id: str, user_id: str) -> Job:
    data = _get_client().get(f"/get/job/{job_id}", user_id)
    return Job.model_validate(data)


def update_job(job: Job) -> None:
    _get_client().patch(f"/update/job/{job.id}", job.userId, job.model_dump())
