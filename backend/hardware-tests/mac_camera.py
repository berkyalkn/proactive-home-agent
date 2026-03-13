import cv2
from flask import Flask, Response
import time
import threading
import requests
import traceback

app = Flask(__name__)

CAMERA_INDEX = 0 
camera = cv2.VideoCapture(CAMERA_INDEX)
time.sleep(2)

camera.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
camera.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)

BACKEND_URL = "http://100.105.136.5:8000/vision/analyze" 
MOTION_AREA_THRESHOLD = 5000  
COOLDOWN_SECONDS = 2.0        

def send_frame_to_backend(frame_bytes):
    """It throws the photo (in the thread) to the Pi in the background."""
    try:
        files = {'image_file': ('motion.jpg', frame_bytes, 'image/jpeg')}
        response = requests.post(BACKEND_URL, files=files, timeout=2.0)
        if response.status_code == 200:
            print(f"Backend Answer: {response.json()}")
        else:
            print(f"Backend returned an error: {response.status_code}")
    except Exception as e:
        print(f"Backend could not be reached: {e}")

def generate_frames():
    prev_frame = None
    last_trigger_time = 0

    while True:
        success, frame = camera.read()
        if not success:
            print("Camera could not be detected, waiting...")
            time.sleep(0.1) 
            continue

        try:
            gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
            gray = cv2.GaussianBlur(gray, (21, 21), 0)

            if prev_frame is None:
                prev_frame = gray.copy().astype("float")
            else:
                cv2.accumulateWeighted(gray, prev_frame, 0.1)
                
                frame_delta = cv2.absdiff(gray, cv2.convertScaleAbs(prev_frame))
                thresh = cv2.threshold(frame_delta, 25, 255, cv2.THRESH_BINARY)[1]
                thresh = cv2.dilate(thresh, None, iterations=2)
                
                contours, _ = cv2.findContours(thresh.copy(), cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

                motion_detected = False
                for contour in contours:
                    if cv2.contourArea(contour) > MOTION_AREA_THRESHOLD:
                        motion_detected = True
                        (x, y, w, h) = cv2.boundingRect(contour)
                        cv2.rectangle(frame, (x, y), (x + w, y + h), (0, 255, 0), 2)

                current_time = time.time()
                if motion_detected and (current_time - last_trigger_time > COOLDOWN_SECONDS):
                    print("Motion detected! Photo is being sent to Pi...")
                    ret, buffer = cv2.imencode('.jpg', frame)
                    if ret:
                        threading.Thread(target=send_frame_to_backend, args=(buffer.tobytes(),), daemon=True).start()
                        last_trigger_time = current_time

        except Exception as e:
            print(f"Motion Detection Error: {e}")

        try:
            ret, buffer = cv2.imencode('.jpg', frame)
            if not ret:
                continue
            yield (b'--frame\r\n'
                   b'Content-Type: image/jpeg\r\n\r\n' + buffer.tobytes() + b'\r\n')
        except Exception as e:
            print(f"Encode Error: {e}")

@app.route('/video_feed')
def video_feed():
    return Response(generate_frames(), mimetype='multipart/x-mixed-replace; boundary=frame')

if __name__ == '__main__':
    print("Video streaming: http://0.0.0.0:5001/video_feed")
    print(f"Target Backend (Pi): {BACKEND_URL}")
    app.run(host='0.0.0.0', port=5001)