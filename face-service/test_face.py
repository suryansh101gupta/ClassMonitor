# test_face_encoder.py
from face_encoder import encode_face

with open("69802b40b49d1842f8515919_v1.jpg", "rb") as f:
    emb = encode_face(image_bytes=f.read())

print(len(emb))