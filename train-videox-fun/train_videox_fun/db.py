import os
from google.cloud.firestore import Client

DB_NAME = os.environ.get("DB_NAME", "ai-avatar-db")
JOBS_COLLECTION = os.environ.get("JOBS_COLLECTION_NAME", "jobs")

_db: Client | None = None


def _get_db() -> Client:
    global _db
    if _db is None:
        from google.cloud import firestore
        _db = firestore.Client(database=DB_NAME)
    return _db


def get_job_by_id(job_id: str) -> dict | None:
    doc = _get_db().collection(JOBS_COLLECTION).document(job_id).get()
    return doc.to_dict() if doc.exists else None
