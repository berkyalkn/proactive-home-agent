import re
import logging
from typing import Dict, List, Tuple, Optional, Any
from sqlmodel import Session, select
from database.settings import engine
from database.models import Device, Room, AgentDecision

logger = logging.getLogger(__name__)

class ReflexRouter:
    def __init__(self, fuzzy_threshold: float = 0.5):
        self.fuzzy_threshold = fuzzy_threshold
        self.device_lexicon: Dict[str, List[str]] = {}
        
        self.intent_keywords = {
            "TURN_ON": ["turn on", "switch on", "open", "start", "enable", "activate"],
            "TURN_OFF": ["turn off", "switch off", "close", "stop", "disable", "deactivate"]
        }
        
        self.core_keywords = {"bulb", "lamp", "light", "plug", "outlet", "socket", "strip"}

    def hydrate_lexicon(self):
        try:
            with Session(engine) as session:
                db_rooms = session.exec(select(Room)).all()
                room_map = {r.id: str(getattr(r, "display_name", None) or getattr(r, "room_key", "")).lower().strip() for r in db_rooms}

                db_devices = session.exec(select(Device).where(Device.device_type.in_(["outlet", "bulb"]))).all()
                new_lexicon = {}
                
                for dev in db_devices:
                    synonyms = set()
                    
                    disp_name = getattr(dev, "display_name", None)
                    if disp_name:
                        disp_str = str(disp_name).lower().strip()
                        synonyms.add(disp_str)
                        
                    raw_name = getattr(dev, "name", None)
                    if raw_name:
                        raw_str = str(raw_name).lower().replace("tapo-", "").replace("-", " ").strip()
                        synonyms.add(raw_str)
                        
                    r_id = getattr(dev, "room_id", None)
                    if r_id and r_id in room_map:
                        room_clean = re.sub(r'\s+', ' ', room_map[r_id].replace("room", " room").strip())
                        
                        if dev.device_type == "bulb":
                            synonyms.update([f"{room_clean} light", f"{room_clean} bulb", f"{room_clean} lamp"])
                        elif dev.device_type == "outlet":
                            synonyms.update([f"{room_clean} plug", f"{room_clean} outlet"])

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
            return {"destination": "BRAIN", "reason": "No direct ON/OFF intent found"}

        best_device_id = None
        best_score = 0.0
        matched_word = ""
        
        cmd_words = set(normalized.split())

        for device_id, synonyms in self.device_lexicon.items():
            for synonym in synonyms:
                syn_normalized = self._normalize_text(synonym)
                syn_words = set(syn_normalized.split())
                
                if not syn_words:
                    continue

                matched_words = syn_words.intersection(cmd_words)
                match_count = len(matched_words)
                total_words = len(syn_words)

                syn_has_core = bool(syn_words.intersection(self.core_keywords))
                match_has_core = bool(matched_words.intersection(self.core_keywords))
                
                if syn_has_core and not match_has_core:
                    continue 

                required_matches = total_words if total_words <= 2 else total_words - 1
                
                score = 0.0
                if match_count >= required_matches:
                    score = match_count / total_words
                    if syn_normalized in normalized:
                        score += 0.2
                
                if score > best_score:
                    best_score = score
                    best_device_id = device_id
                    matched_word = syn_normalized

        logger.info(f"[SpinalCord] Eval: Cmd='{normalized}' -> Intent={intent}, Device={best_device_id} (Matched: '{matched_word}', Score: {best_score:.2f})")

        if best_device_id and best_score >= self.fuzzy_threshold:
            is_on = True if intent == "TURN_ON" else False
            device_type = "bulb" if "bulb" in str(best_device_id).lower() or "l5" in str(best_device_id).lower() else "outlet"
            
            logger.info(f"⚡ [SpinalCord] DECISION: INTERCEPT AND EXECUTE ({intent} -> {best_device_id})")

            with Session(engine) as session:
                from database.models import AgentDecision
                db_dev = session.exec(select(Device).where(Device.name == best_device_id)).first()
                real_id = db_dev.id if db_dev else None
                
                new_decision = AgentDecision(
                    action=intent,
                    reasoning=f"Reflex Router (Spinal Cord) instantly intercepted and executed command for '{matched_word.title()}'.",
                    confidence=round(best_score, 2),
                    execution_layer="SPINAL_CORD", 
                    target_device_id=real_id
                )
                session.add(new_decision)
                session.commit()

            return {
                "destination": "REFLEX",
                "action": intent,
                "is_on": is_on,
                "device_id": best_device_id,
                "device_type": device_type,
                "device_name": matched_word.title(), 
                "confidence": round(best_score, 2),
                "latency": "sub-10ms"
            }
        
        logger.info(f"[SpinalCord] Bypass: Device confidence too low ({best_score:.2f})")
        return {"destination": "BRAIN", "reason": f"Device not found strictly. Score: {best_score}"}

local_reflex_router = ReflexRouter()