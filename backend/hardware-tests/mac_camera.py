import cv2
from flask import Flask, Response
import time

app = Flask(__name__)

CAMERA_INDEX = 0 
camera = cv2.VideoCapture(CAMERA_INDEX)

time.sleep(2)

camera.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
camera.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)

def generate_frames():
    while True:
        success, frame = camera.read()
        if not success:
            print("ERROR: Cannot read image frame from camera! (Index may be incorrect)")
            time.sleep(1) 
            continue
        else:
            try:
                ret, buffer = cv2.imencode('.jpg', frame)
                if not ret:
                    continue
                frame = buffer.tobytes()
                yield (b'--frame\r\n'
                       b'Content-Type: image/jpeg\r\n\r\n' + frame + b'\r\n')
            except Exception as e:
                print(f"Encode Error: {e}")

@app.route('/video_feed')
def video_feed():
    return Response(generate_frames(), mimetype='multipart/x-mixed-replace; boundary=frame')

if __name__ == '__main__':
    print("Test the stream here: http://100.119.128.11:5001/video_feed")
    app.run(host='0.0.0.0', port=5001)