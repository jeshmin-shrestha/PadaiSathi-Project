# backend/app/minio_storage.py
import boto3
from botocore.client import Config

MINIO_ENDPOINT = "http://127.0.0.1:9000"
MINIO_ACCESS_KEY = "minioadmin"
MINIO_SECRET_KEY = "minioadmin"
BUCKET_NAME = "padaisathi-videos"

s3_client = boto3.client(
    "s3",
    endpoint_url=MINIO_ENDPOINT,
    aws_access_key_id=MINIO_ACCESS_KEY,
    aws_secret_access_key=MINIO_SECRET_KEY,
    config=Config(signature_version="s3v4"),
    region_name="us-east-1"
)

def upload_video_to_minio(video_path: str, filename: str) -> str:
    """Upload video to MinIO and return the URL."""
    s3_client.upload_file(
        Filename=video_path,
        Bucket=BUCKET_NAME,
        Key=filename
    )
    video_url = f"{MINIO_ENDPOINT}/{BUCKET_NAME}/{filename}"
    return video_url

def get_video_url(filename: str) -> str:
    """Get a signed URL valid for 1 hour."""
    url = s3_client.generate_presigned_url(
        "get_object",
        Params={"Bucket": BUCKET_NAME, "Key": filename},
        ExpiresIn=3600
    )
    return url