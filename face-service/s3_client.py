import os
from urllib.parse import urlparse

import boto3
from dotenv import load_dotenv

load_dotenv()

AWS_ACCESS_KEY_ID = os.getenv("AWS_ACCESS_KEY_ID")
AWS_SECRET_ACCESS_KEY = os.getenv("AWS_SECRET_ACCESS_KEY")
AWS_REGION = os.getenv("AWS_REGION")
S3_BUCKET = os.getenv("AWS_S3_BUCKET_NAME")

if not all([AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION, S3_BUCKET]):
    raise RuntimeError("❌ Missing AWS credentials in .env")

s3_client = boto3.client(
    "s3",
    region_name=AWS_REGION,
    aws_access_key_id=AWS_ACCESS_KEY_ID,
    aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
)


def extract_s3_key_from_url(url: str) -> str:
    """
    Extracts the S3 object key from a full S3 URL.
    e.g. https://bucket.s3.region.amazonaws.com/students/123/photo.jpg -> students/123/photo.jpg
    """
    if not url or not url.strip():
        return ""
    parsed = urlparse(url)
    path = parsed.path or ""
    return path.lstrip("/")


def download_image_from_s3(s3_key: str) -> bytes:
    """
    Downloads image from S3 using object key. Returns raw bytes.
    """
    if not s3_key:
        raise ValueError("s3_key is required")
    response = s3_client.get_object(Bucket=S3_BUCKET, Key=s3_key)
    return response["Body"].read()


def download_image_to_folder(
    s3_key: str,
    local_folder: str = "downloads",
    filename: str | None = None,
) -> str:
    """
    Downloads image from S3 and saves to a local folder.
    Returns the full path of the saved file.
    """
    if not s3_key:
        raise ValueError("s3_key is required")

    os.makedirs(local_folder, exist_ok=True)
    if not filename:
        # Use last part of key (e.g. students/userId/123_abc.jpg -> 123_abc.jpg)
        filename = s3_key.split("/")[-1] if "/" in s3_key else s3_key

    local_path = os.path.join(local_folder, filename)
    print(f"⬇ Downloading from S3: {s3_key}")

    try:
        image_bytes = download_image_from_s3(s3_key)
        with open(local_path, "wb") as f:
            f.write(image_bytes)
        size_kb = len(image_bytes) / 1024
        print(f"✅ Saved to {local_path} ({size_kb:.2f} KB)")
        return local_path
    except Exception as e:
        print(f"❌ Failed to download/save {s3_key}: {e}")
        raise
