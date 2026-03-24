import cv2
import mediapipe as mp
from mediapipe.tasks import python
from mediapipe.tasks.python import vision
from flask import Flask, Response
import time
import threading
import requests
import os
import urllib.request

app = Flask(__name__)

CAMERA_INDEX = 0 
camera = cv2.VideoCapture(CAMERA_INDEX)
time.sleep(2)

camera.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
camera.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)

IDENTIFY_URL = "http://100.105.136.5:8000/vision/identify" 
PRESENCE_URL = "http://100.105.136.5:8000/vision/update_presence"

MODEL_PATH = "blaze_face_short_range.tflite"

if not os.path.exists(MODEL_PATH):
    urllib.request.urlretrieve(
        "https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite",
        MODEL_PATH
    )

base_options = python.BaseOptions(model_asset_path=MODEL_PATH)
options = vision.FaceDetectorOptions(base_options=base_options, min_detection_confidence=0.5)
face_detector = vision.FaceDetector.create_from_options(options)

active_trackers = {}
next_tracker_id = 0
MAX_RETRIES = 3        

def identify_face_from_pi(frame_bytes, tracker_id):
    global active_trackers
    try:
        print(f"[{tracker_id}] The face is being sent to Pi 5, awaiting identification...")
        files = {'image_file': ('face.jpg', frame_bytes, 'image/jpeg')}
        
        response = requests.post(IDENTIFY_URL, files=files, timeout=8.0)
        
        if response.status_code == 200:
            data = response.json()
            if tracker_id in active_trackers: 
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
            if tracker_id in active_trackers:
                active_trackers[tracker_id]["user"] = "Unknown"
            
    except Exception as e:
        print(f"[{tracker_id}] Pi could not be reached: {e}")
        if tracker_id in active_trackers:
            active_trackers[tracker_id]["user"] = "Unknown"
            active_trackers[tracker_id]["retry_count"] += 1

def send_presence_json(user_name):
    try:
        payload = {"user": user_name, "status": "PRESENT", "location": "living_room"}
        requests.post(PRESENCE_URL, json=payload, timeout=0.5)
    except:
        pass 

def get_center(bbox):
    x, y, w, h = bbox
    return (x + w/2, y + h/2)

def generate_frames():
    global active_trackers, next_tracker_id
    last_detection_time = 0

    while True:
        success, frame = camera.read()
        if not success:
            time.sleep(0.1) 
            continue

        frame = cv2.flip(frame, 1)
        current_time = time.time()

        trackers_to_delete = []
        
        for t_id, t_data in list(active_trackers.items()):
            success_track, bbox = t_data["tracker"].update(frame)

            if success_track:
                x, y, w, h = [int(v) for v in bbox]
                t_data["bbox"] = (x, y, w, h)
                user = t_data["user"]
                
                color = (0, 0, 255) if user == "Unknown" else (0, 255, 0)
                if user == "Identifying...": color = (255, 0, 0)
                
                cv2.rectangle(frame, (x, y), (x + w, y + h), color, 2)
                cv2.putText(frame, f"ID: {user}", (x, y - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.6, color, 2)

                if user not in ["Unknown", "Identifying..."]:
                    if current_time - t_data.get("last_json_time", 0) > 0.5:
                        threading.Thread(target=send_presence_json, args=(user,), daemon=True).start()
                        t_data["last_json_time"] = current_time

                if user == "Unknown" and (current_time - t_data["last_identify_time"] > 2.0) and t_data["retry_count"] < MAX_RETRIES:
                    print(f"[{t_id}] The box is being tracked, identity is being verified again...")
                    t_data["user"] = "Identifying..."
                    t_data["last_identify_time"] = current_time
                    
                    face_roi = frame[max(0, y):y+h, max(0, x):x+w]
                    if face_roi.size > 0:
                        ret, buffer = cv2.imencode('.jpg', face_roi)
                        if ret:
                            threading.Thread(target=identify_face_from_pi, args=(buffer.tobytes(), t_id), daemon=True).start()
            else:
                trackers_to_delete.append(t_id)

        for t_id in trackers_to_delete:
            print(f"Box Lost [{t_id}]. Being deleted from the dictionary.")
            del active_trackers[t_id]

        if current_time - last_detection_time > 0.5:
            rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            
            mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb_frame)
            detection_result = face_detector.detect(mp_image)

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
                    
                    faces.append((x, y, w, h))

            for (x, y, w, h) in faces:
                new_cx, new_cy = get_center((x, y, w, h))
                is_new_face = True
                
                for t_id, t_data in active_trackers.items():
                    old_cx, old_cy = get_center(t_data["bbox"])
                    dist = ((new_cx - old_cx)**2 + (new_cy - old_cy)**2)**0.5
                    if dist < max(w, t_data["bbox"][2]): 
                        is_new_face = False
                        break
                
                if is_new_face:
                    print(f"New Face Found! Tracking Initiates (ID: {next_tracker_id})")
                    tracker = cv2.TrackerKCF_create()
                    tracker.init(frame, (x, y, w, h))
                    
                    active_trackers[next_tracker_id] = {
                        "tracker": tracker,
                        "user": "Identifying...",
                        "bbox": (x, y, w, h),
                        "retry_count": 0,
                        "last_identify_time": current_time,
                        "last_json_time": 0
                    }
                    
                    face_roi = frame[max(0, y):y+h, max(0, x):x+w]
                    if face_roi.size > 0:
                        ret, buffer = cv2.imencode('.jpg', face_roi)
                        if ret:
                            threading.Thread(target=identify_face_from_pi, args=(buffer.tobytes(), next_tracker_id), daemon=True).start()
                    
                    next_tracker_id += 1
            
            last_detection_time = current_time

        try:
            ret, buffer = cv2.imencode('.jpg', frame)
            if ret:
                yield (b'--frame\r\n'
                       b'Content-Type: image/jpeg\r\n\r\n' + buffer.tobytes() + b'\r\n')
        except Exception as e:
            print(f"Encode Error: {e}")

@app.route('/video_feed')
def video_feed():
    return Response(generate_frames(), mimetype='multipart/x-mixed-replace; boundary=frame')

if __name__ == '__main__':
    print("Multi-Tracking Vision (Tasks API) Active: http://0.0.0.0:5001/video_feed")
    app.run(host='0.0.0.0', port=5001)