# backend/app/storage.py
import os
from datetime import datetime, timezone, timedelta
from azure.storage.blob import BlobServiceClient, generate_blob_sas, BlobSasPermissions
from dotenv import load_dotenv

load_dotenv()

CONNECTION_STRING = os.getenv("AZURE_STORAGE_CONNECTION_STRING")
CONTAINER_NAME = os.getenv("AZURE_CONTAINER_NAME", "padaisathi-videos")

blob_service_client = BlobServiceClient.from_connection_string(CONNECTION_STRING)

def upload_video(video_path: str, filename: str) -> str:
    """Upload video to Azure Blob Storage and return the URL."""
    blob_client = blob_service_client.get_blob_client(
        container=CONTAINER_NAME, blob=filename
    )
    with open(video_path, "rb") as f:
        blob_client.upload_blob(f, overwrite=True)
    return blob_client.url

def get_video_url(filename: str) -> str:
    """Get a signed URL valid for 1 hour."""
    account_name = blob_service_client.account_name
    account_key = blob_service_client.credential.account_key
    sas_token = generate_blob_sas(
        account_name=account_name,
        container_name=CONTAINER_NAME,
        blob_name=filename,
        account_key=account_key,
        permission=BlobSasPermissions(read=True),
        expiry=datetime.now(timezone.utc) + timedelta(hours=1)
    )
    return f"https://{account_name}.blob.core.windows.net/{CONTAINER_NAME}/{filename}?{sas_token}"

def get_signed_url_from_path(s3_path: str) -> str:
    """Extract filename from stored Azure URL and return a fresh signed URL."""
    filename = s3_path.split('/')[-1].split('?')[0]
    return get_video_url(filename)
