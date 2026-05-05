import cv2
import numpy as np
import mediapipe as mp
from mediapipe.tasks import python
from mediapipe.tasks.python import vision
from flask import Flask, Response
import time
import threading
from collections import deque
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
import requests
import os
import urllib.request
import signal  
import sys     
import ssl

# macOS SSL sertifika hatası için bypass
try:
    _create_unverified_https_context = ssl._create_unverified_context
except AttributeError:
    pass
else:
    ssl._create_default_https_context = _create_unverified_https_context

app = Flask(__name__)

CAMERA_INDEX = 0 
camera = cv2.VideoCapture(CAMERA_INDEX)
time.sleep(2)

camera.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
camera.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)

PI_IP = "100.105.136.5"
IDENTIFY_URL = f"http://{PI_IP}:8000/vision/identify"
PRESENCE_URL = f"http://{PI_IP}:8000/vision/update_presence"
FALL_ALERT_URL = f"http://{PI_IP}:8000/vision/fall_alert"
GESTURE_URL = f"http://{PI_IP}:8000/vision/gesture"

MODEL_PATH = "blaze_face_short_range.tflite"

if not os.path.exists(MODEL_PATH):
    urllib.request.urlretrieve(
        "https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite",
        MODEL_PATH
    )

base_options = python.BaseOptions(model_asset_path=MODEL_PATH)
options = vision.FaceDetectorOptions(base_options=base_options, min_detection_confidence=0.5)
face_detector = vision.FaceDetector.create_from_options(options)

# === GESTURE RECOGNIZER INIT ===
GESTURE_MODEL_PATH = "gesture_recognizer.task"
if not os.path.exists(GESTURE_MODEL_PATH):
    print("Downloading gesture_recognizer.task...")
    urllib.request.urlretrieve(
        "https://storage.googleapis.com/mediapipe-models/gesture_recognizer/gesture_recognizer/float16/1/gesture_recognizer.task",
        GESTURE_MODEL_PATH
    )

latest_gesture = ""
latest_gesture_time = 0
is_gesture_processing = False

current_sustained_gesture = ""
gesture_start_time = 0.0

last_sent_gesture = ""
last_sent_gesture_time = 0
GESTURE_COOLDOWN = 1.0

current_face_is_frontal = False

# === FALL DETECTION INIT (Transformer + MediaPipe Pose) ===
FALL_MODEL_PATH = "data/models/fall_detection_transformer.tflite"
FALL_INPUT_TIMESTEPS = 30     # Frames for temporal window
FALL_CONFIDENCE_THRESHOLD = 0.90
FALL_ALERT_COOLDOWN = 10      # Seconds between fall alerts
# NOTE: Frame skipping widens the temporal window.
# With INTERVAL=2 at 30fps, the 30-sample buffer spans ~2 seconds (60 real frames)
# instead of ~1 second. This is acceptable for fall detection since falls typically
# take 0.5-2s, but be aware the model was trained on consecutive frames.
#  Run fall detection every N frames (Pi optimization)
TARGET_FALL_FPS = 15  # Modelin eğitildiği optimum hız (genelde 15 FPS)
FALL_FRAME_TIME = 1.0 / TARGET_FALL_FPS  # Yaklaşık 0.066 saniyede bir çalışacak
SCREENSHOT_DIR = Path("data/logs/screenshots")
SCREENSHOT_DIR.mkdir(parents=True, exist_ok=True)

# === VELOCITY FILTER (Stage 1: False positive reduction) ===
VELOCITY_WINDOW = 5           # Frames over which to compute avg velocity
MIN_FALL_VELOCITY = 0.025     # Min downward y-change per frame to qualify as a fall

# === POST-FALL VERIFICATION (Stage 2: Inactivity confirmation) ===
POST_FALL_WAIT = 3.0          # Seconds to wait after initial detection
POST_FALL_MOVE_THRESHOLD = 0.015  # Velocity below this = still on the ground

# MediaPipe Pose for fall detection keypoint extraction
mp_pose = mp.solutions.pose
pose_detector = mp_pose.Pose(
    static_image_mode=False,
    model_complexity=1,
    smooth_landmarks=True,
    min_detection_confidence=0.5,
    min_tracking_confidence=0.5,
)

# TFLite Transformer model
fall_interpreter = None
fall_input_details = None
fall_output_details = None

# Sorted keypoint names matching the model's training feature order
SORT_KP_NAMES = sorted([
    'Nose', 'Left Eye', 'Right Eye', 'Left Ear', 'Right Ear',
    'Left Shoulder', 'Right Shoulder', 'Left Elbow', 'Right Elbow',
    'Left Wrist', 'Right Wrist', 'Left Hip', 'Right Hip',
    'Left Knee', 'Right Knee', 'Left Ankle', 'Right Ankle',
])
SKP_IDX = {n: i for i, n in enumerate(SORT_KP_NAMES)}
NUM_FEAT = len(SORT_KP_NAMES) * 3  # 51

# MediaPipe landmark → sorted keypoint name mapping
MP_LANDMARK_MAP = {
    mp_pose.PoseLandmark.NOSE: 'Nose',
    mp_pose.PoseLandmark.LEFT_EYE: 'Left Eye',
    mp_pose.PoseLandmark.RIGHT_EYE: 'Right Eye',
    mp_pose.PoseLandmark.LEFT_EAR: 'Left Ear',
    mp_pose.PoseLandmark.RIGHT_EAR: 'Right Ear',
    mp_pose.PoseLandmark.LEFT_SHOULDER: 'Left Shoulder',
    mp_pose.PoseLandmark.RIGHT_SHOULDER: 'Right Shoulder',
    mp_pose.PoseLandmark.LEFT_ELBOW: 'Left Elbow',
    mp_pose.PoseLandmark.RIGHT_ELBOW: 'Right Elbow',
    mp_pose.PoseLandmark.LEFT_WRIST: 'Left Wrist',
    mp_pose.PoseLandmark.RIGHT_WRIST: 'Right Wrist',
    mp_pose.PoseLandmark.LEFT_HIP: 'Left Hip',
    mp_pose.PoseLandmark.RIGHT_HIP: 'Right Hip',
    mp_pose.PoseLandmark.LEFT_KNEE: 'Left Knee',
    mp_pose.PoseLandmark.RIGHT_KNEE: 'Right Knee',
    mp_pose.PoseLandmark.LEFT_ANKLE: 'Left Ankle',
    mp_pose.PoseLandmark.RIGHT_ANKLE: 'Right Ankle',
}

if Path(FALL_MODEL_PATH).exists():
    TFLiteInterpreter = None
    try:
        from ai_edge_litert.interpreter import Interpreter as TFLiteInterpreter
    except ImportError:
        try:
            from tflite_runtime.interpreter import Interpreter as TFLiteInterpreter
        except ImportError:
            try:
                from tensorflow.lite import Interpreter as TFLiteInterpreter
            except ImportError:
                print("[WARN] No TFLite runtime found. Install: pip install ai-edge-litert")

    if TFLiteInterpreter:
        fall_interpreter = TFLiteInterpreter(model_path=FALL_MODEL_PATH)
        fall_interpreter.allocate_tensors()
        fall_input_details = fall_interpreter.get_input_details()
        fall_output_details = fall_interpreter.get_output_details()
        print(f"[FALL] Transformer model loaded: {FALL_MODEL_PATH} (input: {fall_input_details[0]['shape']})")
else:
    print(f"[FATAL] Fall model not found at {FALL_MODEL_PATH}. Fall detection disabled.")

# Fall detection state
fall_feature_buffer = deque(maxlen=FALL_INPUT_TIMESTEPS)
last_fall_alert_time = 0.0
latest_fall_status = ""  # For overlay
latest_fall_confidence = 0.0

# Velocity tracking — raw (pre-normalization) body center Y positions
velocity_y_buffer = deque(maxlen=VELOCITY_WINDOW + 1)

# Post-fall verification state machine
_FALL_STATE_IDLE = "idle"
_FALL_STATE_MONITORING = "monitoring"
fall_verification_state = _FALL_STATE_IDLE
fall_verification_start_time = 0.0
fall_verification_prob = 0.0  # Cached probability from initial detection


if fall_interpreter is not None:
    print("[FALL] \u2705 Active method: Transformer (TFLite)")
else:
    print("[FALL] \u274c Transformer model unavailable. Fall detection is DISABLED.")


def _kp_idx(name):
    """Get (x, y, vis) indices in the flat feature vector."""
    i = SKP_IDX[name]
    return i * 3, i * 3 + 1, i * 3 + 2


def compute_body_velocity():
    """Average downward velocity from recent shoulder/hip Y positions.

    Positive = moving down (y increases downward in image coordinates).
    Used by the velocity gate to reject slow movements (sitting, bending).
    """
    if len(velocity_y_buffer) < 2:
        return 0.0

    buf = list(velocity_y_buffer)
    velocities = [buf[i] - buf[i - 1] for i in range(1, len(buf))]
    return sum(velocities) / len(velocities)


def extract_and_normalize_pose(rgb_frame):
    """Extract MediaPipe Pose keypoints, normalize (hip-centered, torso-scaled).
    Returns 51-dim feature vector or None.
    Side-effect: feeds velocity_y_buffer with raw body-center Y."""
    results = pose_detector.process(rgb_frame)
    if not results.pose_landmarks:
        return None

    landmarks = results.pose_landmarks.landmark
    features = np.zeros(NUM_FEAT, dtype=np.float32)

    for mp_enum, kp_name in MP_LANDMARK_MAP.items():
        idx = SKP_IDX[kp_name]
        lm = landmarks[mp_enum.value]
        features[idx * 3] = lm.x
        features[idx * 3 + 1] = lm.y
        features[idx * 3 + 2] = lm.visibility

    # Feed velocity buffer with raw body-center Y (BEFORE normalization)
    _ls_x, _ls_y, _ls_c = _kp_idx('Left Shoulder')
    _rs_x, _rs_y, _rs_c = _kp_idx('Right Shoulder')
    _lh_x, _lh_y, _lh_c = _kp_idx('Left Hip')
    _rh_x, _rh_y, _rh_c = _kp_idx('Right Hip')

    body_y_pts = []
    if features[_ls_c] > 0.3: body_y_pts.append(features[_ls_y])
    if features[_rs_c] > 0.3: body_y_pts.append(features[_rs_y])
    if features[_lh_c] > 0.3: body_y_pts.append(features[_lh_y])
    if features[_rh_c] > 0.3: body_y_pts.append(features[_rh_y])

    if body_y_pts:
        velocity_y_buffer.append(sum(body_y_pts) / len(body_y_pts))

    # Normalize: hip-centered + torso-scaled
    ls_x, ls_y, ls_c = _kp_idx('Left Shoulder')
    rs_x, rs_y, rs_c = _kp_idx('Right Shoulder')
    lh_x, lh_y, lh_c = _kp_idx('Left Hip')
    rh_x, rh_y, rh_c = _kp_idx('Right Hip')

    # Mid-hip (origin)
    valid_lh = features[lh_c] > 0.3
    valid_rh = features[rh_c] > 0.3
    if valid_lh and valid_rh:
        hip_x = (features[lh_x] + features[rh_x]) / 2
        hip_y = (features[lh_y] + features[rh_y]) / 2
    elif valid_lh:
        hip_x, hip_y = features[lh_x], features[lh_y]
    elif valid_rh:
        hip_x, hip_y = features[rh_x], features[rh_y]
    else:
        return features  # Can't normalize

    # Mid-shoulder for torso height
    valid_ls = features[ls_c] > 0.3
    valid_rs = features[rs_c] > 0.3
    if valid_ls and valid_rs:
        sh_y = (features[ls_y] + features[rs_y]) / 2
    elif valid_ls:
        sh_y = features[ls_y]
    elif valid_rs:
        sh_y = features[rs_y]
    else:
        sh_y = None

    torso_h = abs(sh_y - hip_y) if sh_y is not None else None
    can_scale = torso_h is not None and torso_h > 1e-5

    normalized = features.copy()
    for kp_name in SORT_KP_NAMES:
        xi, yi, _ = _kp_idx(kp_name)
        normalized[xi] -= hip_x
        normalized[yi] -= hip_y
        if can_scale:
            normalized[xi] /= torso_h
            normalized[yi] /= torso_h

    return normalized


def check_post_fall_inactivity():
    """Check if person remains still after initial fall detection.

    Called every frame during MONITORING state.
    Returns: 'monitoring', 'confirmed', or 'cancelled'
    """
    elapsed = time.time() - fall_verification_start_time

    if elapsed >= POST_FALL_WAIT:
        return "confirmed"

    body_velocity = compute_body_velocity()

    # Large upward movement = person getting up → cancel
    if body_velocity < -POST_FALL_MOVE_THRESHOLD:
        return "cancelled"

    return "monitoring"


def run_fall_detection(rgb_frame):
    """Run the Transformer-based fall detection pipeline on one frame.
    Returns (is_fall_alert, confidence). Alert sending is handled by the caller."""
    global last_fall_alert_time, latest_fall_status, latest_fall_confidence

    # Transformer path
    if fall_interpreter is None:
        return False, 0.0

    features = extract_and_normalize_pose(rgb_frame)
    if features is not None:
        fall_feature_buffer.append(features)
    elif len(fall_feature_buffer) > 0:
        # Kişi düştüğü için landmark kaybolduysa, son pozu kopyala
        fall_feature_buffer.append(fall_feature_buffer[-1]) 
    else:
        # Ekranda en başından beri kimse yoksa
        fall_feature_buffer.append(np.zeros(NUM_FEAT, dtype=np.float32))

    if len(fall_feature_buffer) < FALL_INPUT_TIMESTEPS:
        latest_fall_status = f"Buffering ({len(fall_feature_buffer)}/{FALL_INPUT_TIMESTEPS})"
        latest_fall_confidence = 0.0
        return False, 0.0

    # TFLite inference
    model_input = np.array(fall_feature_buffer, dtype=np.float32)[np.newaxis, ...]
    try:
        fall_interpreter.set_tensor(fall_input_details[0]['index'], model_input)
        fall_interpreter.invoke()
        output = fall_interpreter.get_tensor(fall_output_details[0]['index'])
        fall_prob = float(output[0][0])
    except Exception as e:
        print(f"[FALL] Inference error: {e}")
        return False, 0.0

    is_fall = fall_prob >= FALL_CONFIDENCE_THRESHOLD
    latest_fall_confidence = fall_prob

    if is_fall:
        # Stage 1: Velocity gate — reject slow movements
        body_velocity = compute_body_velocity()
        if body_velocity < MIN_FALL_VELOCITY:
            latest_fall_status = f"Slow motion (v={body_velocity:.4f})"
            print(f"[FALL] ❌ Velocity too low ({body_velocity:.4f} < {MIN_FALL_VELOCITY}). "
                  f"Likely sitting/bending. prob={fall_prob:.2%}")
            return False, fall_prob

        latest_fall_status = "FALL DETECTED"
        now = time.time()
        if (now - last_fall_alert_time) > FALL_ALERT_COOLDOWN:
            last_fall_alert_time = now
            print(f"🚨 FALL DETECTED! Probability: {fall_prob:.2%} (velocity: {body_velocity:.4f})")
            return True, fall_prob
    else:
        latest_fall_status = "Standing"

    return False, fall_prob


def save_fall_screenshot(bgr_frame):
    """Save a timestamped screenshot on fall detection.
    Returns the file path or None on failure."""
    timestamp = time.strftime("%Y%m%d_%H%M%S")
    millis = int(time.time() * 1000) % 1000
    filename = f"fall_{timestamp}_{millis:03d}.jpg"
    filepath = SCREENSHOT_DIR / filename
    try:
        cv2.imwrite(str(filepath), bgr_frame)
        print(f"[FALL] Screenshot saved: {filepath}")
        return str(filepath)
    except Exception as e:
        print(f"[FALL] Screenshot save error: {e}")
        return None


def send_fall_alert(confidence, screenshot_path=None):
    """Send fall alert to Pi backend with optional screenshot."""
    try:
        payload = {
            "event": "fall_detected",
            "confidence": round(confidence, 4),
            "timestamp": time.time(),
            "source": "mac_camera",
            "method": "transformer",
        }

        if screenshot_path and Path(screenshot_path).exists():
            with open(screenshot_path, 'rb') as f:
                files = {'screenshot': (Path(screenshot_path).name, f, 'image/jpeg')}
                data = {k: str(v) for k, v in payload.items()}
                resp = requests.post(FALL_ALERT_URL, data=data, files=files, timeout=5.0)
        else:
            resp = requests.post(FALL_ALERT_URL, json=payload, timeout=3.0)

        print(f"[FALL] Alert sent to backend: {resp.status_code}")
    except Exception as e:
        print(f"[FALL] Alert send error: {e}")

def send_gesture_event(gesture_name, duration):
    try:
        detected_user = "Unknown"
        with trackers_lock:
            for t_id, t_data in active_trackers.items():
                if t_data["user"] not in ["Unknown", "Identifying..."]:
                    detected_user = t_data["user"]
                    break

        payload = {
            "gesture": gesture_name,
            "user": detected_user,
            "location": "living_room",
            "timestamp": time.time(),
            "duration": duration
        }
        presence_session.post(GESTURE_URL, json=payload, timeout=0.5)
    except Exception as e:
        pass

def gesture_callback(result, output_image: mp.Image, timestamp_ms: int):
    global latest_gesture, latest_gesture_time, is_gesture_processing
    global last_sent_gesture, last_sent_gesture_time
    global current_sustained_gesture, gesture_start_time
    global current_face_is_frontal

    if result.gestures:
        for hand_gestures in result.gestures:
            top_gesture = hand_gestures[0].category_name

            if top_gesture in ["Thumb_Up", "Victory"] and not current_face_is_frontal:
                print(f"[Gaze Lock] Ignoring '{top_gesture}' because the user is not looking at the camera.")
                current_sustained_gesture = ""
                continue

            if top_gesture and top_gesture != "None":
                latest_gesture = top_gesture
                latest_gesture_time = time.time()

                if top_gesture == current_sustained_gesture:
                    duration = time.time() - gesture_start_time
                else:
                    current_sustained_gesture = top_gesture
                    gesture_start_time = time.time()
                    duration = 0.0

                if duration > 1.0:
                    if top_gesture != last_sent_gesture or (time.time() - last_sent_gesture_time) > GESTURE_COOLDOWN:
                        print(f"[Async Gesture] Sustained Action: {top_gesture} (Duration: {duration:.1f}s)")
                        network_executor.submit(send_gesture_event, top_gesture, duration)

                        last_sent_gesture = top_gesture
                        last_sent_gesture_time = time.time()
    else:
        current_sustained_gesture = ""

    is_gesture_processing = False

base_options_gesture = python.BaseOptions(model_asset_path=GESTURE_MODEL_PATH)
options_gesture = vision.GestureRecognizerOptions(
    base_options=base_options_gesture,
    running_mode=vision.RunningMode.LIVE_STREAM,
    num_hands=2,
    min_hand_detection_confidence=0.4,
    min_hand_presence_confidence=0.4,
    min_tracking_confidence=0.4,
    result_callback=gesture_callback
)
gesture_recognizer = vision.GestureRecognizer.create_from_options(options_gesture)
# ===============================

active_trackers = {}
trackers_lock = threading.Lock()  # Thread-safe access to active_trackers
next_tracker_id = 0
MAX_RETRIES = 3
network_executor = ThreadPoolExecutor(max_workers=4)  # Bounded pool for identify + presence
presence_session = requests.Session()  # Connection pooling for presence updates

def graceful_shutdown(signum, frame):
    print("\nCTRL+C Caught! Camera is being safely turned off...")
    try:
        payload = {"user": "System", "status": "camera_offline", "location": "living_room"}
        requests.post(PRESENCE_URL, json=payload, timeout=2.0)
        print("The 'camera_offline' signal was successfully sent to the backend.")
    except Exception as e:
        print(f"An error occurred while sending a signal to the backend: {e}")
    finally:
        network_executor.shutdown(wait=False)
        camera.release()
        sys.exit(0)

signal.signal(signal.SIGINT, graceful_shutdown)
signal.signal(signal.SIGTERM, graceful_shutdown)


def identify_face_from_pi(face_roi_raw, tracker_id):
    """Encode JPEG in worker thread, then POST to Pi 5 for identification."""
    try:
        # Phase 3: JPEG encoding moved to worker thread (off main thread)
        ret, buffer = cv2.imencode('.jpg', face_roi_raw)
        if not ret:
            print(f"[{tracker_id}] JPEG encode failed in worker thread")
            return
        
        frame_bytes = buffer.tobytes()
        print(f"[{tracker_id}] The face is being sent to Pi 5, awaiting identification...")
        
        files = {'image_file': ('face.jpg', frame_bytes, 'image/jpeg')}
        
        response = requests.post(IDENTIFY_URL, files=files, timeout=8.0)
        
        if response.status_code == 200:
            data = response.json()
            with trackers_lock:
                if tracker_id not in active_trackers:
                    print(f"[{tracker_id}] Tracker already removed, discarding result.")
                    return
                if data.get("status") == "authorized":
                    active_trackers[tracker_id]["user"] = data["user"]
                    active_trackers[tracker_id]["retry_count"] = 0 
                    print(f"Identity Verified [{tracker_id}]: {data['user']}")
                else:
                    active_trackers[tracker_id]["user"] = "Unknown"
                    active_trackers[tracker_id]["retry_count"] += 1
                    print(f"Stranger or Unknown [{tracker_id}]. (Failed Attempt: {active_trackers[tracker_id]['retry_count']}/{MAX_RETRIES})")
        else:
            print(f"[{tracker_id}] Backend error returned.")
            with trackers_lock:
                if tracker_id in active_trackers:
                    active_trackers[tracker_id]["user"] = "Unknown"
            
    except Exception as e:
        print(f"[{tracker_id}] Pi could not be reached: {e}")
        with trackers_lock:
            if tracker_id in active_trackers:
                active_trackers[tracker_id]["user"] = "Unknown"
                active_trackers[tracker_id]["retry_count"] += 1

def send_presence_json(user_name):
    try:
        payload = {"user": user_name, "status": "PRESENT", "location": "living_room"}
        presence_session.post(PRESENCE_URL, json=payload, timeout=0.5)
    except:
        pass 

def get_center(bbox):
    x, y, w, h = bbox
    return (x + w/2, y + h/2)

def calculate_iou(boxA, boxB):
    xA = max(boxA[0], boxB[0])
    yA = max(boxA[1], boxB[1])
    xB = min(boxA[0] + boxA[2], boxB[0] + boxB[2])
    yB = min(boxA[1] + boxA[3], boxB[1] + boxB[3])

    interArea = max(0, xB - xA) * max(0, yB - yA)
    boxAArea = boxA[2] * boxA[3]
    boxBArea = boxB[2] * boxB[3]

    if boxAArea + boxBArea - interArea == 0:
        return 0.0
    return interArea / float(boxAArea + boxBArea - interArea)

# === QUALITY GATE CONSTANTS ===
MIN_FACE_ROI_SIZE = 60
MIN_LAPLACIAN_VARIANCE = 50
MIN_BRIGHTNESS = 40
MAX_BRIGHTNESS = 230
MIN_EYE_DISTANCE_RATIO = 0.15  # Relative to face width

def estimate_face_frontality(keypoints, img_w, img_h, face_bbox):
    """Use BlazeFace keypoints to check if face is frontal enough.
    
    Returns False if inter-eye distance is too small relative to face width
    (profile or extreme angle view).
    """
    if not keypoints or len(keypoints) < 2:
        return True  # Can't check, allow through
    
    # MediaPipe FaceDetector keypoints: 0=right_eye, 1=left_eye
    right_eye_x = keypoints[0].x * img_w
    left_eye_x = keypoints[1].x * img_w
    
    eye_distance = abs(left_eye_x - right_eye_x)
    face_w = face_bbox[2]  # width from (x, y, w, h)
    
    if face_w > 0 and (eye_distance / face_w) < MIN_EYE_DISTANCE_RATIO:
        return False
    
    return True

def is_face_quality_ok(face_roi, keypoints=None, img_w=640, img_h=480, face_bbox=None):
    """4-layer quality gate: Size/Ratio -> Brightness -> Blur -> Pose.
    
    Each layer ordered cheapest to most expensive computation.
    Returns (passed: bool, quality_score: float).
    """
    h, w = face_roi.shape[:2]

    # Layer 1: Size & Aspect Ratio (instant)
    if w < MIN_FACE_ROI_SIZE or h < MIN_FACE_ROI_SIZE:
        print(f"[QualityGate] BLOCKED: too small ({w}x{h})")
        return False, 0.0

    aspect_ratio = w / float(h)
    if aspect_ratio < 0.5 or aspect_ratio > 1.5:
        print(f"[QualityGate] BLOCKED: bad aspect ratio ({aspect_ratio:.2f})")
        return False, 0.0

    # Layer 2: Brightness (cheap — single np.mean)
    gray = cv2.cvtColor(face_roi, cv2.COLOR_BGR2GRAY)
    mean_brightness = np.mean(gray)
    if mean_brightness < MIN_BRIGHTNESS or mean_brightness > MAX_BRIGHTNESS:
        print(f"[QualityGate] BLOCKED: bad brightness ({mean_brightness:.0f})")
        return False, 0.0

    # Layer 3: Blur (moderate — Laplacian convolution)
    variance = cv2.Laplacian(gray, cv2.CV_64F).var()
    if variance < MIN_LAPLACIAN_VARIANCE:
        print(f"[QualityGate] BLOCKED: too blurry (laplacian={variance:.0f})")
        return False, 0.0

    # Layer 4: Pose via BlazeFace keypoints (zero extra cost)
    if keypoints is not None and face_bbox is not None:
        if not estimate_face_frontality(keypoints, img_w, img_h, face_bbox):
            print(f"[QualityGate] BLOCKED: profile/angled face")
            return False, 0.0

    return True, variance

def camera_processing_loop():
    global next_tracker_id, latest_gesture, latest_gesture_time, is_gesture_processing
    global latest_jpeg_frame, current_face_is_frontal
    global fall_verification_state, fall_verification_start_time, fall_verification_prob
    global latest_fall_status, latest_fall_confidence
    last_detection_time = 0
    last_gesture_timestamp_ms = 0
    last_fall_process_time = 0
    
    # Garbage Collector'ın (GC) asenkron resimleri C++ işlenmeden silmesini önlemek için referans listesi
    async_image_buffer = []

    while True:
        # FPS Limiti Kaldırıldı: Kullanıcı isteği üzerine kamera maksimum hızda çalışacak
        
        success, frame = camera.read()
        if not success:
            time.sleep(0.1) 
            continue

        frame = cv2.flip(frame, 1)
        frame_h, frame_w = frame.shape[:2]
        current_time = time.time()

        trackers_to_delete = []
        
        with trackers_lock:
            snapshot = list(active_trackers.items())

        for t_id, t_data in snapshot:
            success_track, bbox = t_data["tracker"].update(frame)

            if success_track:
                x, y, w, h = [int(v) for v in bbox]
                with trackers_lock:
                    if t_id not in active_trackers:
                        continue
                        
                    # Phase 3: TTL (Time to Live) Ghost Box check
                    if current_time - t_data.get("last_blazeface_update", current_time) > 1.0:
                        print(f"[{t_id}] Tracker TTL expired (Ghost box). Force deleting.")
                        trackers_to_delete.append(t_id)
                        continue
                        
                    t_data["bbox"] = (x, y, w, h)
                    user = t_data["user"]
                
                color = (0, 0, 255) if user == "Unknown" else (0, 255, 0)
                if user == "Identifying...": color = (255, 0, 0)
                
                cv2.rectangle(frame, (x, y), (x + w, y + h), color, 2)
                cv2.putText(frame, f"ID: {user}", (x, y - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.6, color, 2)

                if user not in ["Unknown", "Identifying..."]:
                    cached_kps = t_data.get("detection_keypoints")
                    is_frontal = estimate_face_frontality(cached_kps, frame_w, frame_h, (x, y, w, h))
                    current_face_is_frontal = is_frontal

                    if current_time - t_data.get("last_json_time", 0) > 3.0:
                        network_executor.submit(send_presence_json, user)
                        with trackers_lock:
                            if t_id in active_trackers:
                                t_data["last_json_time"] = current_time

                # Phase 4: Quality-aware retry with exponential backoff
                if user == "Unknown" and t_data["retry_count"] < MAX_RETRIES:
                    face_roi = frame[max(0, y):y+h, max(0, x):x+w]
                    cached_kps = t_data.get("detection_keypoints")

                    if face_roi.size > 0:
                        passed, current_quality = is_face_quality_ok(
                            face_roi, cached_kps, frame_w, frame_h, (x, y, w, h)
                        )
                        if passed:
                            cooldown = 2.0 * (2 ** t_data["retry_count"])
                            time_ok = (current_time - t_data["last_identify_time"]) > cooldown
                            quality_ok = current_quality > t_data.get("best_quality_score", 0) * 0.8

                            if time_ok and quality_ok:
                                print(f"[{t_id}] Quality OK, retrying identification (attempt {t_data['retry_count']+1}/{MAX_RETRIES})...")
                                with trackers_lock:
                                    if t_id in active_trackers:
                                        t_data["user"] = "Identifying..."
                                        t_data["last_identify_time"] = current_time
                                        t_data["best_quality_score"] = max(
                                            t_data.get("best_quality_score", 0), current_quality
                                        )

                                roi_copy = face_roi.copy()
                                network_executor.submit(identify_face_from_pi, roi_copy, t_id)
            else:
                trackers_to_delete.append(t_id)

        with trackers_lock:
            for t_id in trackers_to_delete:
                if t_id in active_trackers:
                    print(f"Box Lost [{t_id}]. Being deleted from the dictionary.")
                    del active_trackers[t_id]

        # Always convert to RGB for async Gesture and conditional Face detection
        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)

        # 1. Async Gesture Recognition
        current_ms = int(current_time * 1000)
        if current_ms <= last_gesture_timestamp_ms:
            current_ms = last_gesture_timestamp_ms + 1
        last_gesture_timestamp_ms = current_ms

        try:
            # CRITICAL FIX for 'trace trap': Memory given to C++ background threads 
            # must be a copy to avoid main loop data overwrites (segmentation fault).
            mp_image_gesture = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb_frame.copy())
            
            # Referansı tutarak Garbage Collector'ı engelle
            async_image_buffer.append(mp_image_gesture)
            if len(async_image_buffer) > 30:
                async_image_buffer.pop(0)

            # Prevent MediaPipe C++ Job Queue Overflow (Trace Trap / SIGABRT)
            # Only send a new frame if the previous async gesture job has finished!
            if not is_gesture_processing:
                is_gesture_processing = True
                gesture_recognizer.recognize_async(mp_image_gesture, current_ms)
        except Exception as e:
            is_gesture_processing = False

        # 2. Draw latest gesture on frame 
        if current_time - latest_gesture_time > 1.5:
            latest_gesture = ""  # Clear old gestures from screen after 1.5s
        
        if latest_gesture:
            cv2.putText(frame, f"Gesture: {latest_gesture}", (20, 40), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 255), 2)

        # 2b. Fall Detection with post-fall inactivity verification
        is_fall = False
        fall_prob = latest_fall_confidence

        if current_time - last_fall_process_time >= FALL_FRAME_TIME:
            last_fall_process_time = current_time

            if fall_verification_state == _FALL_STATE_IDLE:
                is_fall, fall_prob = run_fall_detection(rgb_frame)

                if is_fall:
                    # Enter monitoring — don't alarm yet
                    fall_verification_state = _FALL_STATE_MONITORING
                    fall_verification_start_time = time.time()
                    fall_verification_prob = fall_prob
                    latest_fall_status = "⏳ Verifying fall (0.0/3.0s)..."
                    print(f"[FALL] ⏳ Fall candidate (prob={fall_prob:.2%}). "
                          f"Starting {POST_FALL_WAIT}s inactivity check...")

            elif fall_verification_state == _FALL_STATE_MONITORING:
                # Keep feeding velocity buffer during monitoring
                _ = extract_and_normalize_pose(rgb_frame)

                elapsed = time.time() - fall_verification_start_time
                result = check_post_fall_inactivity()

                if result == "confirmed":
                    fall_verification_state = _FALL_STATE_IDLE
                    latest_fall_status = "FALL CONFIRMED"
                    latest_fall_confidence = fall_verification_prob
                    print(f"🚨 FALL CONFIRMED after {POST_FALL_WAIT}s inactivity! "
                          f"prob={fall_verification_prob:.2%}")
                    screenshot_path = save_fall_screenshot(frame)
                    network_executor.submit(
                        send_fall_alert, fall_verification_prob, screenshot_path
                    )
                elif result == "cancelled":
                    fall_verification_state = _FALL_STATE_IDLE
                    latest_fall_status = "Stumble (recovered)"
                    latest_fall_confidence = 0.0
                    print(f"[FALL] ↩️ Person recovered after {elapsed:.1f}s. "
                          f"Fall cancelled.")
                else:
                    latest_fall_status = f"⏳ Verifying fall ({elapsed:.1f}/{POST_FALL_WAIT}s)..."

        # Draw fall detection status overlay
        if fall_verification_state == _FALL_STATE_MONITORING:
            elapsed = time.time() - fall_verification_start_time
            cv2.putText(frame,
                        f"VERIFYING FALL ({elapsed:.1f}s/{POST_FALL_WAIT}s)",
                        (20, frame_h - 30),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 165, 255), 2)
        elif latest_fall_status == "FALL CONFIRMED":
            cv2.putText(frame,
                        f"FALL CONFIRMED ({latest_fall_confidence:.0%})",
                        (20, frame_h - 30),
                        cv2.FONT_HERSHEY_SIMPLEX, 1.0, (0, 0, 255), 3)
        elif latest_fall_status and latest_fall_status not in ("Standing", ""):
            cv2.putText(frame, latest_fall_status, (20, frame_h - 30),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.6, (200, 200, 200), 1)

        # 3. Synchronous Face Detection (every 0.15s for high-speed anti-drift)
        if current_time - last_detection_time > 0.15:
            # Use another independent mp.Image wrapper
            mp_image_face = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb_frame)
            detection_result = face_detector.detect(mp_image_face)

            faces = []
            if detection_result.detections:
                for detection in detection_result.detections:
                    bbox = detection.bounding_box
                    x = bbox.origin_x
                    y = bbox.origin_y
                    w = bbox.width
                    h = bbox.height

                    pad_w = int(w * 0.25) 
                    pad_h = int(h * 0.35) 
                    
                    x = max(0, x - pad_w)
                    y = max(0, y - pad_h)
                    w = w + (pad_w * 2)
                    h = h + (pad_h * 2)
                    
                    keypoints = detection.keypoints if hasattr(detection, 'keypoints') else None
                    faces.append((x, y, w, h, keypoints))

            for face_data in faces:
                x, y, w, h, keypoints = face_data
                matched_tracker_id = None

                with trackers_lock:
                    best_iou = 0.0
                    for t_id, t_data in active_trackers.items():
                        iou = calculate_iou((x, y, w, h), t_data["bbox"])
                        if iou > best_iou:
                            best_iou = iou
                            if iou > 0.3:
                                matched_tracker_id = t_id

                if matched_tracker_id is not None:
                    # Phase 1: RE-INIT drifted KCF tracker with fresh BlazeFace bbox
                    new_tracker = cv2.TrackerKCF_create()
                    new_tracker.init(frame, (x, y, w, h))
                    with trackers_lock:
                        if matched_tracker_id in active_trackers:
                            active_trackers[matched_tracker_id]["tracker"] = new_tracker
                            active_trackers[matched_tracker_id]["bbox"] = (x, y, w, h)
                            active_trackers[matched_tracker_id]["detection_keypoints"] = keypoints
                            active_trackers[matched_tracker_id]["last_blazeface_update"] = current_time
                else:
                    # Truly new face — full initialization + identify
                    print(f"New Face Found! Tracking Initiates (ID: {next_tracker_id})")
                    tracker = cv2.TrackerKCF_create()
                    tracker.init(frame, (x, y, w, h))

                    with trackers_lock:
                        active_trackers[next_tracker_id] = {
                            "tracker": tracker,
                            "user": "Identifying...",
                            "bbox": (x, y, w, h),
                            "retry_count": 0,
                            "last_identify_time": current_time,
                            "last_json_time": 0,
                            "best_quality_score": 0,
                            "detection_keypoints": keypoints,
                            "last_blazeface_update": current_time,
                        }

                    # Phase 2: Quality gate before initial identification
                    face_roi = frame[max(0, y):y+h, max(0, x):x+w]
                    if face_roi.size > 0:
                        passed, _ = is_face_quality_ok(
                            face_roi, keypoints, frame_w, frame_h, (x, y, w, h)
                        )
                        if passed:
                            roi_copy = face_roi.copy()
                            network_executor.submit(identify_face_from_pi, roi_copy, next_tracker_id)
                        else:
                            # Quality too low — set Unknown for retry path
                            with trackers_lock:
                                if next_tracker_id in active_trackers:
                                    active_trackers[next_tracker_id]["user"] = "Unknown"

                    next_tracker_id += 1
            
            last_detection_time = current_time

        try:
            ret, buffer = cv2.imencode('.jpg', frame)
            if ret:
                latest_jpeg_frame = buffer.tobytes()
        except Exception as e:
            print(f"Encode Error: {e}")

latest_jpeg_frame = None
# Sadece tek bir thread kamerayı yorsun ve FPS limitini sağlasın
threading.Thread(target=camera_processing_loop, daemon=True).start()

def generate_frames():
    while True:
        if latest_jpeg_frame is not None:
            yield (b'--frame\r\n'
                   b'Content-Type: image/jpeg\r\n\r\n' + latest_jpeg_frame + b'\r\n')
        time.sleep(0.03)

@app.route('/')
def index():
    return '''
    <html>
      <head><title>Mac Camera Stream</title></head>
      <body style="background-color:#121212; color:white; text-align:center; font-family:sans-serif;">
        <h2>Live Camera Feed (Face, Gesture & Fall Detection)</h2>
        <img src="/video_feed" style="border:2px solid #333; border-radius:10px; box-shadow: 0px 0px 20px #000;" />
      </body>
    </html>
    '''

@app.route('/video_feed')
def video_feed():
    return Response(generate_frames(), mimetype='multipart/x-mixed-replace; boundary=frame')

if __name__ == '__main__':
    print("Multi-Tracking Vision (Tasks API) Active: http://0.0.0.0:5001/")
    app.run(host='0.0.0.0', port=5001)