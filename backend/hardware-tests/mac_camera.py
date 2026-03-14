import cv2
from flask import Flask, Response
import time
import threading
import requests

app = Flask(__name__)

CAMERA_INDEX = 0 
camera = cv2.VideoCapture(CAMERA_INDEX)
time.sleep(2) 

camera.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
camera.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)

IDENTIFY_URL = "http://100.105.136.5:8000/vision/identify" 
PRESENCE_URL = "http://100.105.136.5:8000/vision/update_presence"

face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')

tracking_active = False
tracker = None
current_user = "Unknown"
last_json_time = 0
last_identify_time = 0 

def identify_face_from_pi(frame_bytes):
    """It only works once. It sends a photo to Pi and learns your identity."""
    global tracking_active, current_user
    try:
        print("A face is being sent to Pi 5, awaiting identification...")
        files = {'image_file': ('face.jpg', frame_bytes, 'image/jpeg')}
        response = requests.post(IDENTIFY_URL, files=files, timeout=3.0)
        
        if response.status_code == 200:
            data = response.json()
            if data["status"] == "authorized":
                current_user = data["user"]
                print(f"Authenticated: {current_user}")
            else:
                current_user = "Unknown"
                print("Stranger or Unknown.")
        else:
            print("Backend error returned, discontinuing follow-up.")
            tracking_active = False
            
    except Exception as e:
        print(f"Pi could not be reached:{e}")
        tracking_active = False

def send_presence_json():
    """Pi 5 simply sends the message 'Berkay is still here' without tiring itself out at all."""
    try:
        payload = {"user": current_user, "status": "PRESENT", "location": "livingroom"}
        requests.post(PRESENCE_URL, json=payload, timeout=0.5)
    except:
        pass 

def generate_frames():
    global tracking_active, tracker, current_user, last_json_time, last_identify_time

    while True:
        success, frame = camera.read()
        if not success:
            time.sleep(0.1) 
            continue

        frame = cv2.flip(frame, 1)

        current_time = time.time()

        if not tracking_active:

            gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
            faces = face_cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=5, minSize=(60, 60))

            if len(faces) > 0:
                (x, y, w, h) = faces[0]
                cv2.rectangle(frame, (x, y), (x + w, y + h), (255, 0, 0), 2)
                cv2.putText(frame, "Identifying...", (x, y - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 0, 0), 2)

                tracker = cv2.TrackerKCF_create()
                tracker.init(frame, (x, y, w, h))
                
                tracking_active = True
                current_user = "Identifying..."
                last_identify_time = current_time 
                
                ret, buffer = cv2.imencode('.jpg', frame)
                if ret:
                    threading.Thread(target=identify_face_from_pi, args=(buffer.tobytes(),), daemon=True).start()

        else:

            success_track, bbox = tracker.update(frame)

            if success_track:
                x, y, w, h = [int(v) for v in bbox]
                
                color = (0, 0, 255) if current_user == "Unknown" else (0, 255, 0)
                cv2.rectangle(frame, (x, y), (x + w, y + h), color, 2)
                
                if current_user != "Identifying...":
                    cv2.putText(frame, f"ID: {current_user}", (x, y - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.8, color, 2)
                    
                    if current_time - last_json_time > 0.2:
                        threading.Thread(target=send_presence_json, daemon=True).start()
                        last_json_time = current_time

                    if current_user == "Unknown" and (current_time - last_identify_time > 2.0):
                        print("The stranger box is being monitored, identity is being re-verified...")
                        current_user = "Identifying..."
                        last_identify_time = current_time
                        ret, buffer = cv2.imencode('.jpg', frame)
                        if ret:
                            threading.Thread(target=identify_face_from_pi, args=(buffer.tobytes(),), daemon=True).start()
            else:
                print("Box Lost. Returning to Search Mode...")
                tracking_active = False
                current_user = "Unknown"

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
    print("Video Feed: http://0.0.0.0:5001/video_feed")
    app.run(host='0.0.0.0', port=5001)