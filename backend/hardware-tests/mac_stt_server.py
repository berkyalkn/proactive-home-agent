
from fastapi import FastAPI, UploadFile, File
from faster_whisper import WhisperModel
import io
import time

app = FastAPI(title="Local STT Engine")

print("Loading the Faster-Whisper Base Model into RAM...")
model = WhisperModel("base", device="auto", compute_type="int8")
print("Local STT Engine is ready!")

@app.post("/transcribe")
async def transcribe_audio(file: UploadFile = File(...)):
    start_time = time.time()
    
    audio_bytes = await file.read()
    audio_data = io.BytesIO(audio_bytes)
    
    segments, info = model.transcribe(
        audio_data, 
        beam_size=5,
        language="en", 
        condition_on_previous_text=False
    )
    
    text = " ".join([segment.text for segment in segments])
    
    process_time = time.time() - start_time
    print(f"[{process_time:.2f}s] Algılanan Metin: {text.strip()}")
    
    return {"text": text.strip()}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)