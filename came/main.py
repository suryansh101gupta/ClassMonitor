"""
Camera face recognition - detects faces from webcam, matches against MongoDB
face encodings, and displays the recognized name on screen.
"""

import os
import sys
import time
from pathlib import Path
from collections import defaultdict

import requests
NODE_API = "http://localhost:4000/attendance/frame-result"

# Allow loading .env from face-service or project root
root = Path(__file__).resolve().parent.parent
for env_path in [ Path(".env"), root / "face-service" / ".env", root / ".env"]:
    if env_path.exists():
        break
else:
    env_path = None

if env_path:
    from dotenv import load_dotenv
    load_dotenv(env_path)

import cv2
import face_recognition
import numpy as np
from pymongo import MongoClient

# --- Config ---
MONGO_URI = os.getenv("MONGO_URI")
MONGO_DB_NAME = os.getenv("MONGO_DB_NAME", "ClassMonitor")
COLLECTION_NAME = "users"
FACE_MATCH_THRESHOLD = 0.6  # Lower = stricter (face_recognition default is 0.6)
CACHE_RELOAD_INTERVAL = 60  # Reload user encodings from DB every N seconds
WINDOW_DURATION = 3  # Window duration in seconds
CLASS_ID = os.getenv("CLASS_ID")
CAM_INDEX = int(os.getenv("CAM_INDEX", 0))

print("CAM_INDEX:", CAM_INDEX, "CLASS_ID:", CLASS_ID)

def get_mongo_client():
    if not MONGO_URI:
        raise RuntimeError("MONGO_URI not found. Set it in face-service/.env or .env")
    return MongoClient(MONGO_URI)


def load_known_faces():
    """Load all users with processed face encodings from MongoDB."""
    client = get_mongo_client()
    db = client[MONGO_DB_NAME]
    users = list(db[COLLECTION_NAME].find(
        {"faceProcessed": True, "faceEncoding": {"$exists": True, "$ne": []}},
        {"name": 1, "roll_no": 1, "faceEncoding": 1}
    ))
    client.close()

    names = []
    roll_nos = []
    encodings = []
    for u in users:
        enc = u.get("faceEncoding")
        if enc and len(enc) == 128:
            names.append(u.get("name", "Unknown"))
            roll_nos.append(u.get("roll_no", "Unknown"))
            encodings.append(np.array(enc, dtype=np.float64))
    return names, roll_nos, encodings


def find_best_match(encoding, known_encodings, known_names, known_roll_nos, threshold=FACE_MATCH_THRESHOLD):
    """Find the best matching name for the given face encoding."""
    if not known_encodings or not known_names:
        return None

    distances = face_recognition.face_distance(known_encodings, encoding)
    best_idx = np.argmin(distances)
    if distances[best_idx] <= threshold:
        return known_names[best_idx], known_roll_nos[best_idx]
    return None


def main():
    print("Loading known faces from MongoDB...")
    known_names, known_roll_nos, known_encodings = load_known_faces()
    print(f"Loaded {len(known_names)} known face(s) from database.")

    cap = cv2.VideoCapture(CAM_INDEX)
    if not cap.isOpened():
        print("ERROR: Could not open camera.")
        sys.exit(1)

    frame_count = 0
    last_cache_reload = 0
    last_faces = []  # [(top, right, bottom, left, name), ...]
    
    # Window-based tracking
    window_start_time = time.time()
    window_id = 0
    window_student_counts = defaultdict(int)  # roll_no -> frame count
    total_frames_in_window = 0

    print("Camera started. Press 'q' to quit.")
    print("Face detection runs every 3 frames to reduce CPU load.")
    print("Window-based attendance: 3-second windows with presence ratio calculation.")

    while True:
        ret, frame = cap.read()
        if not ret:
            break

        frame_count += 1
        current_time = time.time()

        # Periodically reload known faces from MongoDB
        if frame_count - last_cache_reload > CACHE_RELOAD_INTERVAL * 30:  # ~30 fps
            known_names, known_roll_nos, known_encodings = load_known_faces()
            last_cache_reload = frame_count

        # Process every few frames to reduce CPU load
        if frame_count % 30 == 0:
            rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            face_locations = face_recognition.face_locations(rgb)
            face_encodings = face_recognition.face_encodings(rgb, face_locations)
            last_faces = []
            for (top, right, bottom, left), face_encoding in zip(face_locations, face_encodings):
                name, roll_no = find_best_match(face_encoding, known_encodings, known_names, known_roll_nos)
                last_faces.append((top, right, bottom, left, roll_no))

        # Track recognized students in current window
        recognized_in_frame = set()
        for (_, _, _, _, roll_no) in last_faces:
            if roll_no and roll_no != "Unknown":
                recognized_in_frame.add(roll_no)
        
        # Update window counts
        for roll_no in recognized_in_frame:
            window_student_counts[roll_no] += 1
        total_frames_in_window += 1

        # Check if window duration has passed
        if current_time - window_start_time >= WINDOW_DURATION:
            # Prepare window payload
            window_students = [
                {"roll_no": roll_no, "count": count}
                for roll_no, count in window_student_counts.items()
            ]
            
            try:
                print(f"[WINDOW] Window {window_id} - Total frames: {total_frames_in_window}, Students: {len(window_students)}")
                response = requests.post(
                    NODE_API,
                    json={
                        "class_id": CLASS_ID, 
                        "window_id": window_id,
                        "students": window_students,
                        "total_frames": total_frames_in_window
                    },
                    timeout=1.0
                )
                print(f"[WINDOW] Response: {response.json()}")
            except Exception as e:
                print(f"[WINDOW] API error: {e}")

            # Reset for next window
            window_id += 1
            window_start_time = current_time
            window_student_counts.clear()
            total_frames_in_window = 0

        # Draw last detected faces on every frame for smooth display
        for top, right, bottom, left, roll_no in last_faces:
            color = (0, 255, 0) if roll_no else (0, 0, 255)
            cv2.rectangle(frame, (left, top), (right, bottom), color, 2)
            label = str(roll_no) if roll_no else "Unknown"
            (tw, th), _ = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.8, 2)
            cv2.rectangle(frame, (left, bottom - th - 20), (left + tw + 10, bottom), color, -1)
            cv2.putText(
                frame, label,
                (left + 5, bottom - 8),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.8, (255, 255, 255), 2
            )

        # Display window info on screen
        window_info = f"Window: {window_id} | Frames: {total_frames_in_window} | Students: {len(window_student_counts)}"
        cv2.putText(
            frame, window_info,
            (10, 30),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.6, (255, 255, 0), 2
        )

        cv2.imshow("Face Recognition - ClassMonitor", frame)
        if cv2.waitKey(1) & 0xFF == ord("q"):
            break

    cap.release()
    cv2.destroyAllWindows()


if __name__ == "__main__":
    main()
