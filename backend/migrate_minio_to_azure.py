# migrate_minio_to_azure.py
# Run this ONCE to migrate all videos from local MinIO to Azure Blob Storage
# Make sure MinIO is running locally before executing this script
# SAFE: This script only READS from MinIO - it never deletes anything

import boto3
import os
import tempfile
from botocore.client import Config
from azure.storage.blob import BlobServiceClient
from dotenv import load_dotenv
from sqlalchemy import create_engine, text

load_dotenv()

# MinIO (source) - read only, nothing will be deleted
MINIO_ENDPOINT = "http://127.0.0.1:9000"
MINIO_ACCESS_KEY = "minioadmin"
MINIO_SECRET_KEY = "minioadmin"
MINIO_BUCKET = "padaisathi-videos"

# Azure (destination)
CONNECTION_STRING = os.getenv("AZURE_STORAGE_CONNECTION_STRING")
AZURE_CONTAINER = os.getenv("AZURE_CONTAINER_NAME", "padaisathi-videos")

# Database
DATABASE_URL = os.getenv("DATABASE_URL")

def migrate():
    # Connect to MinIO
    s3 = boto3.client(
        "s3",
        endpoint_url=MINIO_ENDPOINT,
        aws_access_key_id=MINIO_ACCESS_KEY,
        aws_secret_access_key=MINIO_SECRET_KEY,
        config=Config(signature_version="s3v4"),
        region_name="us-east-1"
    )

    # Connect to Azure
    azure_client = BlobServiceClient.from_connection_string(CONNECTION_STRING)
    account_name = azure_client.account_name

    # List all files in MinIO bucket
    try:
        response = s3.list_objects_v2(Bucket=MINIO_BUCKET)
        objects = response.get("Contents", [])
    except Exception as e:
        print(f"Could not connect to MinIO: {e}")
        print("Make sure MinIO is running at http://127.0.0.1:9000")
        return

    if not objects:
        print("No files found in MinIO bucket. Nothing to migrate.")
        return

    print(f"Found {len(objects)} file(s) in MinIO. Starting migration...\n")
    print("NOTE: MinIO files will NOT be deleted. This is a copy-only operation.\n")

    engine = create_engine(DATABASE_URL)
    success_count = 0
    fail_count = 0

    for obj in objects:
        filename = obj["Key"]
        old_url = f"{MINIO_ENDPOINT}/{MINIO_BUCKET}/{filename}"
        new_url = f"https://{account_name}.blob.core.windows.net/{AZURE_CONTAINER}/{filename}"

        print(f"Migrating: {filename}")

        tmp_path = None
        try:
            # Download from MinIO to a temp file
            with tempfile.NamedTemporaryFile(delete=False, suffix=".mp4") as tmp:
                tmp_path = tmp.name

            s3.download_file(MINIO_BUCKET, filename, tmp_path)
            print(f"  Downloaded from MinIO")

            # Upload to Azure
            blob_client = azure_client.get_blob_client(
                container=AZURE_CONTAINER, blob=filename
            )
            with open(tmp_path, "rb") as f:
                blob_client.upload_blob(f, overwrite=True)
            print(f"  Uploaded to Azure")

            # Update URL in Supabase database
            with engine.begin() as conn:
                result = conn.execute(
                    text("UPDATE videos SET s3_path = :new_url WHERE s3_path = :old_url"),
                    {"new_url": new_url, "old_url": old_url}
                )
                print(f"  Updated {result.rowcount} database row(s)")

            print(f"  Success: {filename}\n")
            success_count += 1

        except Exception as e:
            print(f"  FAILED: {e}\n")
            fail_count += 1

        finally:
            # Always clean up temp file
            if tmp_path and os.path.exists(tmp_path):
                os.remove(tmp_path)

    print(f"Migration complete! Success: {success_count} | Failed: {fail_count}")
    print("Your MinIO files are still intact and untouched.")

if __name__ == "__main__":
    migrate()
