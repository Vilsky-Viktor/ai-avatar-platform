import os
from google.cloud import firestore
from gen_qwen_edit_2511.logger import get_logger

DB_NAME = os.getenv("DB_NAME", "ai-avatar-db")
JOBS_COLLECTION_NAME = os.getenv("JOBS_COLLECTION_NAME", "jobs")

logger = get_logger(__name__)
db_client = firestore.Client(database=DB_NAME)

def get_job_by_id(job_id: str):
    doc = db_client.collection(JOBS_COLLECTION_NAME).document(job_id).get()
    return doc.to_dict() if doc.exists else None
