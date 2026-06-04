import re
import logging
from typing import Dict, List, Tuple, Optional, Any
from sqlmodel import Session, select
from database.settings import engine
from database.models import Device, Room  

logger = logging.getLogger(__name__)

class ReflexRouter:
    def __init__(self, fuzzy_threshold: float = 0.5):
        self.fuzzy_threshold = fuzzy_threshold
        self.device_lexicon: Dict[str, List[str]] = {}
        
        self.intent_keywords = {
            "TURN_ON": ["turn on", "switch on", "open", "start", "enable", "activate"],
            "TURN_OFF": ["turn off", "switch off", "close", "stop", "disable", "deactivate"]
        }

    def hydrate_lexicon(self):
        """It securely retrieves devices and rooms from the database."""
        
        try:
            with Session(engine) as session:
                db_rooms = session.exec(select(Room)).all()
                room_map = {}
                for r in db_rooms:
                    r_name = getattr(r, "display_name", None) or getattr(r, "room_key", "")
                    if r_name:
                        room_map[r.id] = str(r_name).lower().strip()

                db_devices = session.exec(select(Device).where(Device.device_type.in_(["outlet", "bulb"]))).all()
                new_lexicon = {}
                
                for dev in db_devices:
                    synonyms = set()
                    
                    disp_name = getattr(dev, "display_name", None)
                    if disp_name:
                        disp_str = str(disp_name).lower().strip()
                        synonyms.add(disp_str)
                        for word in disp_str.split():
                            if len(word) > 2: synonyms.add(word)
                                
                    raw_name = getattr(dev, "name", None)
                    if raw_name:
                        raw_str = str(raw_name).lower().replace("tapo-", "").replace("-", " ").strip()
                        synonyms.add(raw_str)
                        
                    r_id = getattr(dev, "room_id", None)
                    if r_id and r_id in room_map:
                        room_str = room_map[r_id]
                        room_clean = room_str.replace("room", " room").strip() 
                        room_clean = re.sub(r'\s+', ' ', room_clean)
                        
                        if dev.device_type == "bulb":
                            synonyms.update([f"{room_clean} light", f"{room_clean} bulb", "lamp", "light", "bulb"])
                        elif dev.device_type == "outlet":
                            synonyms.update([f"{room_clean} plug", f"{room_clean} outlet", "plug", "outlet", "socket"])

                    new_lexicon[dev.name] = list(synonyms)
                
                self.device_lexicon = new_lexicon
                logger.info(f"[SpinalCord] Hydration complete! Devices loaded in RAM: {len(self.device_lexicon)}")
        except Exception as e:
            logger.error(f"[SpinalCord] Hydration error: {e}", exc_info=True)

    @staticmethod
    def _normalize_text(text: str) -> str:
        text = str(text).lower().strip()
        return re.sub(r'[^\w\s]', '', text)

    def extract_intent(self, raw_text: str) -> Tuple[Optional[str], float]:
        for intent, phrases in self.intent_keywords.items():
            for phrase in phrases:
                if re.search(r'\b' + re.escape(phrase) + r'\b', raw_text):
                    return intent, 1.0
        
        if re.search(r'\b(on)\b', raw_text): return "TURN_ON", 0.8
        if re.search(r'\b(off)\b', raw_text): return "TURN_OFF", 0.8
            
        return None, 0.0

    def route_command(self, raw_command: str) -> Dict[str, Any]:
        if not self.device_lexicon:
            self.hydrate_lexicon()

        normalized = self._normalize_text(raw_command)
        intent, intent_conf = self.extract_intent(normalized)
        
        if not intent:
            logger.info(f"[SpinalCord] Bypass: No ON/OFF intent found in '{normalized}'")
            return {"destination": "BRAIN", "reason": "No direct ON/OFF intent found"}

        best_device_id = None
        best_score = 0.0
        matched_word = ""
        
        for device_id, synonyms in self.device_lexicon.items():
            for synonym in synonyms:
                syn_normalized = self._normalize_text(synonym)
                
                if syn_normalized in normalized:
                    score = 1.0
                else:
                    syn_words = set(syn_normalized.split())
                    cmd_words = set(normalized.split())
                    if not syn_words: continue
                    overlap = len(syn_words.intersection(cmd_words))
                    score = overlap / len(syn_words)
                
                if score > best_score:
                    best_score = score
                    best_device_id = device_id
                    matched_word = syn_normalized

        logger.info(f"[SpinalCord] Eval: Cmd='{normalized}' -> Intent={intent}, Device={best_device_id} (Matched: '{matched_word}', Score: {best_score:.2f})")

        if best_device_id and best_score >= 0.5:
            is_on = True if intent == "TURN_ON" else False
            device_type = "bulb" if "bulb" in str(best_device_id).lower() or "l5" in str(best_device_id).lower() else "outlet"
            
            logger.info(f"[SpinalCord] DECISION: INTERCEPT AND EXECUTE ({intent} -> {best_device_id})")
            return {
                "destination": "REFLEX",
                "action": intent,
                "is_on": is_on,
                "device_id": best_device_id,
                "device_type": device_type,
                "confidence": round(best_score, 2),
                "latency": "sub-10ms"
            }
        
        logger.info(f"💤 [SpinalCord] Bypass: Device confidence too low ({best_score:.2f})")
        return {"destination": "BRAIN", "reason": f"Device not found clearly. Score: {best_score}"}

local_reflex_router = ReflexRouter()