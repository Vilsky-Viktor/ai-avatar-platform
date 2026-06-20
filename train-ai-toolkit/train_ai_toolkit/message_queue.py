import json
import os

from google.cloud import pubsub_v1

PROJECT_ID = os.environ.get("PROJECT_ID", "loom24-mvp")
SUBSCRIPTION_ID = os.environ.get("SUBSCRIPTION_ID", "train-ai-toolkit-sub")
RESULT_TOPIC_ID = os.environ.get("RESULT_TOPIC_ID", "ai-model-result")


def get_subscriber_client() -> pubsub_v1.SubscriberClient:
    return pubsub_v1.SubscriberClient()


def publish_status(result_payload: dict):
    publisher = pubsub_v1.PublisherClient()
    topic_path = publisher.topic_path(PROJECT_ID, RESULT_TOPIC_ID)
    data = json.dumps(result_payload).encode("utf-8")
    publisher.publish(topic_path, data=data).result()
