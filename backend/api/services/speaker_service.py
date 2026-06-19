import numpy as np
from resemblyzer import VoiceEncoder, preprocess_wav
import io
import soundfile as sf
import logging
from pydub import AudioSegment
from sqlmodel import Session, select
from database.settings import engine
from database.models import User
from datetime import datetime, timezone

logger = logging.getLogger(__name__)

class SpeakerService:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            logger.info("Loading Speaker Recognition Model...")
            cls._instance = super(SpeakerService, cls).__new__(cls)
            cls._instance.encoder = VoiceEncoder()
            cls._instance.known_users = {} 
            cls._instance.load_users_from_db()
        return cls._instance

    def load_users_from_db(self):
        """Load the users from the database into RAM."""
        self.known_users = {}
        try:
            with Session(engine) as session:
                statement = select(User).where(User.voice_embedding.is_not(None))
                users = session.exec(statement).all()
                
                for user in users:
                    if user.voice_embedding:
                        self.known_users[user.username] = np.array(user.voice_embedding)
            
            logger.info(f"Loaded {len(self.known_users)} users from DB: {list(self.known_users.keys())}")
        except Exception as e:
            logger.error(f"Error loading users from DB: {e}")

    def register_user(self, name: str, audio_bytes: bytes):
        """Register the new user in the database."""
        try:
            wav = self._bytes_to_wav(audio_bytes)
            embedding = self.encoder.embed_utterance(wav)
            
            embedding_list = embedding.tolist()
            
            with Session(engine) as session:
                statement = select(User).where(User.username == name)
                existing_user = session.exec(statement).first()
                
                if existing_user:
                    existing_user.voice_embedding = embedding_list
                    existing_user.last_seen = datetime.now(timezone.utc)
                    session.add(existing_user)
                    logger.info(f"Updated voice for existing user: {name}")
                else:
                    new_user = User(
                        username=name,
                        role="admin", 
                        voice_embedding=embedding_list
                    )
                    session.add(new_user)
                    logger.info(f"Created new user: {name}")
                
                session.commit()
            
            self.known_users[name] = embedding
            return True

        except Exception as e:
            logger.error(f"Registration failed: {e}")
            raise e

    def identify_speaker(self, audio_bytes: bytes, threshold=0.55):
        """Voice Recognition: (Name, Similarity Score) returns"""
        
        if not self.known_users:
            logger.warning("No users found in database/memory.")
            return "Guest", 0.0

        try:
            wav = self._bytes_to_wav(audio_bytes)

            if len(wav) < 500: 
                logger.warning("⚠️ Audio too short for analysis.")
                return "Guest", 0.0
                
            embedding = self.encoder.embed_utterance(wav)
            
            best_score = 0.0
            best_user = "Guest"

            for name, user_embed in self.known_users.items():
                similarity = np.dot(embedding, user_embed) / (np.linalg.norm(embedding) * np.linalg.norm(user_embed))

                logger.info(f"Comparing with {name}: Score {similarity:.2f}")
                
                if similarity > best_score:
                    best_score = similarity
                    best_user = name
            
            logger.info(f"Best Match: {best_user} with Score: {best_score:.2f}")

            if best_score > threshold:
                self._update_last_seen(best_user)
                return best_user.capitalize(), float(best_score)
            else:
                logger.warning(f"Match found ({best_user}) but score ({best_score:.2f}) is below threshold ({threshold})")
                return "Guest", float(best_score)
                
        except Exception as e:
            logger.error(f"Identification error: {e}")
            return "Guest", 0.0

    def _update_last_seen(self, username):
        """Update user's last seen time asynchronously"""
        try:
            with Session(engine) as session:
                statement = select(User).where(User.username == username.lower())
                user = session.exec(statement).first()
                if user:
                    user.last_seen = datetime.now(timezone.utc)
                    session.add(user)
                    session.commit()
        except:
            pass

    def _bytes_to_wav(self, audio_bytes):
        """
        Converts incoming audio data (WebM, OGG, MP3, etc.) to WAV format
        and returns it as a Numpy Array.
        """
        try:
            audio = AudioSegment.from_file(io.BytesIO(audio_bytes))
            
            audio = audio.set_frame_rate(16000).set_channels(1)
            
            wav_io = io.BytesIO()
            audio.export(wav_io, format="wav")
            wav_io.seek(0) 
            
            data, samplerate = sf.read(wav_io)
            
            return preprocess_wav(data, source_sr=samplerate)
            
        except Exception as e:
            logger.error(f"Audio conversion error: {e}")
            raise e

    def delete_user(self, username: str):
        """Removes the user from the database and RAM"""
        try:
            with Session(engine) as session:
                statement = select(User).where(User.username == username)
                user = session.exec(statement).first()
                if user:
                    session.delete(user)
                    session.commit()
                    logger.info(f"User deleted from DB: {username}")
            
            if username in self.known_users:
                del self.known_users[username]
                logger.info(f"User deleted from RAM: {username}")
                
            return True
        except Exception as e:
            logger.error(f"Delete failed: {e}")
            raise e

speaker_service = SpeakerService()
