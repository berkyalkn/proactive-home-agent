from fastapi import FastAPI, UploadFile, File
from faster_whisper import WhisperModel
import io
import time

app = FastAPI(title="Mac Studio STT Engine (Large-v3-Turbo)")

print("Loading the Faster-Whisper Large-v3-Turbo Model into Unified Memory...")
model = WhisperModel("large-v3-turbo", device="auto", compute_type="float16")
print("Local STT Engine (Turbo) is ready!")

@app.post("/transcribe")
async def transcribe_audio(file: UploadFile = File(...)):
    start_time = time.time()
    
    audio_bytes = await file.read()
    audio_data = io.BytesIO(audio_bytes)
    
    segments, info = model.transcribe(
        audio_data, 
        beam_size=5,
        language="en", 
        condition_on_previous_text=False,
        vad_filter=True,
        vad_parameters=dict(min_silence_duration_ms=500)
    )
    
    text = " ".join([segment.text for segment in segments])
    
    process_time = time.time() - start_time
    print(f"[{process_time:.2f}s] Algılanan Metin: {text.strip()}")
    
    return {"text": text.strip()}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)