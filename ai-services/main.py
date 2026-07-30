from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import psycopg2
import numpy as np
from deepface import DeepFace
import base64
import json
import io
from PIL import Image
import os
import tempfile

app = FastAPI(title="Vulcan Face Detection Service")

app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=os.getenv(
        "VULCAN_CORS_ORIGIN_REGEX",
        r"http://(localhost|127\.0\.0\.1|192\.168\.[0-9.]+|10\.[0-9.]+)(:\d+)?",
    ),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Database connection
def get_db():
    return psycopg2.connect(
        host=os.getenv("DB_HOST", "localhost"),
        port=int(os.getenv("DB_PORT", "5432")),
        database=os.getenv("DB_NAME", "vulcandb"),
        user=os.getenv("DB_USER", "postgres"),
        password=os.getenv("DB_PASSWORD", "kelvin")
    )

def save_image_temp(image_bytes: bytes) -> str:
    """Save image bytes to a temp file and return the path"""
    with tempfile.NamedTemporaryFile(delete=False, suffix=".jpg") as tmp:
        tmp.write(image_bytes)
        return tmp.name

@app.on_event("startup")
def ensure_schema():
    """Create the face_embeddings table up front so /verify-attendance
    works even before the first face is registered."""
    try:
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS face_embeddings (
                id SERIAL PRIMARY KEY,
                worker_id BIGINT UNIQUE NOT NULL,
                embedding TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT NOW()
            )
        """)
        conn.commit()
        cursor.close()
        conn.close()
    except Exception as e:
        print(f"WARNING: could not ensure face_embeddings table: {e}")

@app.on_event("startup")
def warm_up_face_model():
    """Build the Facenet model once, in a background thread, so the first real
    enrollment does not pay the model download + build cost.

    This must NOT run inline: a startup handler blocks the server from accepting
    connections until it returns, so if DeepFace stalls while fetching its
    weights (e.g. on a network that inspects HTTPS) the whole service would
    never come up and every request would time out. Running it on a daemon
    thread lets the service start listening immediately and warm up behind it."""
    import threading

    def _load():
        try:
            dummy = np.zeros((160, 160, 3), dtype=np.uint8)
            DeepFace.represent(img_path=dummy, model_name="Facenet", enforce_detection=False)
            print("Facenet model is warmed up and ready.")
        except Exception as e:
            print(f"WARNING: face model warm-up failed (first real request may be slow): {e}")

    threading.Thread(target=_load, daemon=True).start()


@app.get("/")
def health_check():
    return {"status": "Vulcan Face Detection Service is running"}

@app.post("/register-face")
async def register_face(worker_id: int, file: UploadFile = File(...)):
    """Register a worker's face embedding in the database"""
    try:
        image_bytes = await file.read()
        temp_path = save_image_temp(image_bytes)

        try:
            # Extract face embedding
            embedding_result = DeepFace.represent(
                img_path=temp_path,
                model_name="Facenet",
                enforce_detection=True
            )

            if not embedding_result:
                raise HTTPException(status_code=400, detail="No face detected in image")

            embedding = embedding_result[0]["embedding"]
            embedding_json = json.dumps(embedding)

            # Save to database
            conn = get_db()
            cursor = conn.cursor()

            cursor.execute("""
                CREATE TABLE IF NOT EXISTS face_embeddings (
                    id SERIAL PRIMARY KEY,
                    worker_id BIGINT UNIQUE NOT NULL,
                    embedding TEXT NOT NULL,
                    created_at TIMESTAMP DEFAULT NOW()
                )
            """)

            cursor.execute("""
                INSERT INTO face_embeddings (worker_id, embedding)
                VALUES (%s, %s)
                ON CONFLICT (worker_id) DO UPDATE SET embedding = EXCLUDED.embedding
            """, (worker_id, embedding_json))

            conn.commit()
            cursor.close()
            conn.close()

            return {"message": f"Face registered successfully for worker {worker_id}"}

        finally:
            os.unlink(temp_path)

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/verify-attendance")
async def verify_attendance(site_id: int, file: UploadFile = File(...)):
    """Verify attendance from a group photo"""
    try:
        image_bytes = await file.read()
        temp_path = save_image_temp(image_bytes)

        try:
            # Get all registered face embeddings from database
            conn = get_db()
            cursor = conn.cursor()
            cursor.execute("SELECT worker_id, embedding FROM face_embeddings")
            registered_workers = cursor.fetchall()
            cursor.close()
            conn.close()

            if not registered_workers:
                return {"present": [], "absent": [], "message": "No registered faces found"}

            # Detect all faces in the group photo
            detected_faces = DeepFace.represent(
                img_path=temp_path,
                model_name="Facenet",
                enforce_detection=False
            )

            if not detected_faces:
                return {"present": [], "absent": [w[0] for w in registered_workers], "message": "No faces detected in photo"}

            present_workers = []
            absent_workers = []

            # Compare each registered worker against detected faces
            for worker_id, embedding_json in registered_workers:
                registered_embedding = np.array(json.loads(embedding_json))
                is_present = False

                for detected_face in detected_faces:
                    detected_embedding = np.array(detected_face["embedding"])

                    # Calculate cosine similarity
                    similarity = np.dot(registered_embedding, detected_embedding) / (
                        np.linalg.norm(registered_embedding) * np.linalg.norm(detected_embedding)
                    )

                    # Threshold: 0.7 means 70% similar (adjust as needed)
                    if similarity > 0.5:
                        is_present = True
                        break

                if is_present:
                    present_workers.append(worker_id)
                else:
                    absent_workers.append(worker_id)

            return {
                "present": present_workers,
                "absent": absent_workers,
                "total_detected_faces": len(detected_faces),
                "total_registered_workers": len(registered_workers)
            }

        finally:
            os.unlink(temp_path)

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))