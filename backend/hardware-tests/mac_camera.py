import cv2
import numpy as np
import mediapipe as mp
from mediapipe.tasks import python
from mediapipe.tasks.python import vision
from flask import Flask, Response
import time
import threading
from concurrent.futures import ThreadPoolExecutor
import requests
import os
import urllib.request
import signal  
import sys     
import ssl

if sys.platform == 'darwin':
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

def send_gesture_event(gesture_name):
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
            "timestamp": time.time()
        }
        presence_session.post(GESTURE_URL, json=payload, timeout=0.5)
    except Exception as e:
        pass 

def gesture_callback(result, output_image: mp.Image, timestamp_ms: int):
    global latest_gesture, latest_gesture_time, is_gesture_processing
    if result.gestures:
        for hand_gestures in result.gestures:
            top_gesture = hand_gestures[0].category_name
            if top_gesture and top_gesture != "None":
                latest_gesture = top_gesture
                latest_gesture_time = time.time()
                print(f"[Async Gesture] Detected: {top_gesture}")
                network_executor.submit(send_gesture_event, top_gesture)
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


active_trackers = {}
trackers_lock = threading.Lock()  
next_tracker_id = 0
MAX_RETRIES = 3
network_executor = ThreadPoolExecutor(max_workers=4)  
presence_session = requests.Session() 

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

MIN_FACE_ROI_SIZE = 60
MIN_LAPLACIAN_VARIANCE = 50
MIN_BRIGHTNESS = 40
MAX_BRIGHTNESS = 230
MIN_EYE_DISTANCE_RATIO = 0.15  

def estimate_face_frontality(keypoints, img_w, img_h, face_bbox):
    """Use BlazeFace keypoints to check if face is frontal enough."""
    if not keypoints or len(keypoints) < 2:
        return True 
    
    right_eye_x = keypoints[0].x * img_w
    left_eye_x = keypoints[1].x * img_w
    
    eye_distance = abs(left_eye_x - right_eye_x)
    face_w = face_bbox[2] 
    
    if face_w > 0 and (eye_distance / face_w) < MIN_EYE_DISTANCE_RATIO:
        return False
    
    return True

def is_face_quality_ok(face_roi, keypoints=None, img_w=640, img_h=480, face_bbox=None):
    """4-layer quality gate."""
    h, w = face_roi.shape[:2]

    if w < MIN_FACE_ROI_SIZE or h < MIN_FACE_ROI_SIZE:
        print(f"[QualityGate] BLOCKED: too small ({w}x{h})")
        return False, 0.0

    aspect_ratio = w / float(h)
    if aspect_ratio < 0.5 or aspect_ratio > 1.5:
        print(f"[QualityGate] BLOCKED: bad aspect ratio ({aspect_ratio:.2f})")
        return False, 0.0

    gray = cv2.cvtColor(face_roi, cv2.COLOR_BGR2GRAY)
    mean_brightness = np.mean(gray)
    if mean_brightness < MIN_BRIGHTNESS or mean_brightness > MAX_BRIGHTNESS:
        print(f"[QualityGate] BLOCKED: bad brightness ({mean_brightness:.0f})")
        return False, 0.0

    variance = cv2.Laplacian(gray, cv2.CV_64F).var()
    if variance < MIN_LAPLACIAN_VARIANCE:
        print(f"[QualityGate] BLOCKED: too blurry (laplacian={variance:.0f})")
        return False, 0.0

    if keypoints is not None and face_bbox is not None:
        if not estimate_face_frontality(keypoints, img_w, img_h, face_bbox):
            print(f"[QualityGate] BLOCKED: profile/angled face")
            return False, 0.0

    return True, variance

def camera_processing_loop():
    global next_tracker_id, latest_gesture, latest_gesture_time, is_gesture_processing
    global latest_jpeg_frame
    last_detection_time = 0
    last_gesture_timestamp_ms = 0
    
    async_image_buffer = []

    while True:
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
                    if current_time - t_data.get("last_json_time", 0) > 3.0:
                        network_executor.submit(send_presence_json, user)
                        with trackers_lock:
                            if t_id in active_trackers:
                                t_data["last_json_time"] = current_time

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

        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)

        current_ms = int(current_time * 1000)
        if current_ms <= last_gesture_timestamp_ms:
            current_ms = last_gesture_timestamp_ms + 1
        last_gesture_timestamp_ms = current_ms

        try:
            mp_image_gesture = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb_frame.copy())
            
            async_image_buffer.append(mp_image_gesture)
            if len(async_image_buffer) > 15:
                async_image_buffer.pop(0)

            if not is_gesture_processing:
                is_gesture_processing = True
                gesture_recognizer.recognize_async(mp_image_gesture, current_ms)
        except Exception as e:
            is_gesture_processing = False

        if current_time - latest_gesture_time > 1.5:
            latest_gesture = "" 
        
        if latest_gesture:
            cv2.putText(frame, f"Gesture: {latest_gesture}", (20, 40), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 255), 2)

        if current_time - last_detection_time > 0.15:
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
                    new_tracker = cv2.TrackerKCF_create()
                    new_tracker.init(frame, (x, y, w, h))
                    with trackers_lock:
                        if matched_tracker_id in active_trackers:
                            active_trackers[matched_tracker_id]["tracker"] = new_tracker
                            active_trackers[matched_tracker_id]["bbox"] = (x, y, w, h)
                            active_trackers[matched_tracker_id]["detection_keypoints"] = keypoints
                            active_trackers[matched_tracker_id]["last_blazeface_update"] = current_time
                else:
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

                    face_roi = frame[max(0, y):y+h, max(0, x):x+w]
                    if face_roi.size > 0:
                        passed, _ = is_face_quality_ok(
                            face_roi, keypoints, frame_w, frame_h, (x, y, w, h)
                        )
                        if passed:
                            roi_copy = face_roi.copy()
                            network_executor.submit(identify_face_from_pi, roi_copy, next_tracker_id)
                        else:
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
        <h2>Live Camera Feed (Face & Gesture)</h2>
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