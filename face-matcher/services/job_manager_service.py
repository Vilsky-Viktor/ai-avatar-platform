import os

from models import Job
from utils.service_client import create_service_client

_client = create_service_client(os.environ["JOB_MANAGER_URL"])


def get_job(job: Job) -> Job:
    data = _client.get(f"/get/id/{job.id}", job.userId)
    return Job.model_validate(data)
