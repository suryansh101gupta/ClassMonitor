from fastapi import FastAPI
import face_recognition
import requests
from io import BytesIO

app = FastAPI()

@app.post("/extract")
def extract_vector(data: dict):
    image_url = data["imageUrl"]

    # Step 1: Download the image from S3
    img_bytes = requests.get(image_url).content
    img = face_recognition.load_image_file(BytesIO(img_bytes))

    # Step 2: Extract embeddings
    encodings = face_recognition.face_encodings(img)

    if len(encodings) == 0:
        return {"embedding": None}

    vector = encodings[0].tolist()  # 128-D vector

    return {"embedding": vector}
