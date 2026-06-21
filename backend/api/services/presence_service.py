import time
import logging
import os
from typing import Any, Dict, List
from datetime import datetime, timezone, timedelta

from sqlmodel import Session, select
from sqlalchemy import func
from database.settings import engine
from database.models import User

logger = logging.getLogger(__name__)

class PresenceService:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(PresenceService, cls).__new__(cls)
            
            cls._instance.active_people: Dict[str, dict] = {}
            cls._instance.history_ledger: List[dict] = []
            
            cls._instance.timeout_seconds = 20
            cls._instance.identity_present_backstop_s = int(
                os.getenv("IDENTITY_PRESENT_BACKSTOP_S", "300")
            )
            cls._instance.unknown_grace_period = 4.0 
            cls._instance.unknown_first_seen = 0.0
            
            logger.info("Presence Service (with Spatial and Temporal Memory) has been initiated.")
        return cls._instance

    def _log_event(self, person_name: str, action: str, location: str):
        """The agent writes down the entry / exit events, along with the times, in a notebook for to read."""
        tr_timezone = timezone(timedelta(hours=3))
        now_str = datetime.now(tr_timezone).strftime("%H:%M")
        
        event = {"time": now_str, "user": person_name, "action": action, "location": location}
        self.history_ledger.append(event)
        
        if len(self.history_ledger) > 20:
            self.history_ledger.pop(0)

    def log_gesture(self, person_name: str, gesture: str, location: str):
        tr_timezone = timezone(timedelta(hours=3))
        now_str = datetime.now(tr_timezone).strftime("%H:%M")
        
        action = f"made a '{gesture}' gesture in"
        event = {"time": now_str, "user": person_name, "action": action, "location": location}
        
        self.history_ledger.append(event)
        if len(self.history_ledger) > 20:
            self.history_ledger.pop(0)
            
        logger.info(f"Gesture Logged (Silent): [{now_str}] {person_name} {action} the {location}")

    def log_fall_event(self, location: str, confidence: float):
        """Log a fall detection event to the history ledger."""
        tr_timezone = timezone(timedelta(hours=3))
        now_str = datetime.now(tr_timezone).strftime("%H:%M")

        action = f"FALL DETECTED (confidence: {confidence:.0%}) in"
        event = {"time": now_str, "user": "Vision System", "action": action, "location": location}

        self.history_ledger.append(event)
        if len(self.history_ledger) > 20:
            self.history_ledger.pop(0)

        logger.critical(f"FALL EVENT: [{now_str}] {action} the {location}")

    def _update_db_last_seen(self, username: str):
        if username in ["Unknown", "Guest", "A Stranger"]: 
            return 
            
        try:
            with Session(engine) as session:
                statement = select(User).where(
                    func.lower(User.username) == username.lower()
                )
                user = session.exec(statement).first()
                if user:
                    local_time_naive = datetime.utcnow() + timedelta(hours=3)
                    user.last_seen = local_time_naive
                    session.add(user)
                    session.commit()
                    logger.info(f"Permanent Memory: {username} last seen -> {user.last_seen.strftime('%H:%M')}")
                else:
                    logger.warning(
                        f"Identity event for unknown user '{username}' — no User row; parity broken?"
                    )
        except Exception as e:
            logger.error(f"DB Update Error for last_seen: {e}")

    def log_identity_session(self, event: Any):
        if event.event_type == "person_identified":
            self._log_event(event.user, "ENTERED", event.zone)
            self._update_db_last_seen(event.user)
            logger.info(f"IDENTITY EVENT: {event.user} entered {event.zone} via track {event.track_id}")
        elif event.event_type == "person_left":
            self._log_event(event.user, "EXITED", event.zone)
            self._update_db_last_seen(event.user)
            logger.info(
                f"IDENTITY EVENT: {event.user} left {event.zone} via track {event.track_id}; "
                f"dwell={event.dwell_s}s"
            )

    def mark_identity_present(self, person_name: str, location: str = "living_room") -> None:
        current_time = time.time()
        self.active_people[person_name] = {
            "last_seen": current_time,
            "location": location,
            "identity_sourced": True,
        }
        self._update_db_last_seen(person_name)

    def clear_identity_present(self, person_name: str, location: str = "living_room") -> None:
        if person_name in self.active_people:
            del self.active_people[person_name]
        self._update_db_last_seen(person_name)

    def handle_detection(self, person_name: str, location: str = "living_room") -> str:
        current_time = time.time()
        
        if person_name != "Unknown":
            self.unknown_first_seen = 0.0
            
            if person_name not in self.active_people:
                self.active_people[person_name] = {"last_seen": current_time, "location": location}
                self._log_event(person_name, "ENTERED", location) 
                self._update_db_last_seen(person_name)
                return "ENTRY"
            else:
                self.active_people[person_name]["last_seen"] = current_time
                self.active_people[person_name]["location"] = location
                return "PRESENT"

        else: 
            if person_name in self.active_people:
                self.active_people[person_name]["last_seen"] = current_time
                self.active_people[person_name]["location"] = location
                return "PRESENT"
            
            known_people_present = any(name != "Unknown" for name in self.active_people.keys())
            
            if known_people_present:
                if self.unknown_first_seen == 0.0:
                    self.unknown_first_seen = current_time
                    return "IGNORED"
                elif (current_time - self.unknown_first_seen) > self.unknown_grace_period:
                    self.active_people[person_name] = {"last_seen": current_time, "location": location}
                    self._log_event("A Stranger", "ENTERED", location)
                    self.unknown_first_seen = 0.0
                    return "ENTRY"
                else:
                    return "IGNORED"
            else:
                self.active_people[person_name] = {"last_seen": current_time, "location": location}
                self._log_event("A Stranger", "ENTERED", location)
                return "ENTRY"

    def check_timeouts(self, identity_authoritative: bool = False) -> List[str]:
        current_time = time.time()
        exited_people = []
        
        for person_name in list(self.active_people.keys()):
            last_seen = self.active_people[person_name]["last_seen"]
            location = self.active_people[person_name]["location"]
            is_identity_sourced = bool(self.active_people[person_name].get("identity_sourced"))
            timeout_seconds = (
                self.identity_present_backstop_s
                if identity_authoritative and is_identity_sourced
                else self.timeout_seconds
            )
            
            if (current_time - last_seen) > timeout_seconds:
                exited_people.append(person_name)
                del self.active_people[person_name]
                logger.info(f"EXIT EVENT: {person_name} left the room (Timeout).")
                
                if person_name == "Unknown":
                    self.unknown_first_seen = 0.0
                    self._log_event("A Stranger", "EXITED", location)
                else:
                    self._log_event(person_name, "EXITED", location)
                    self._update_db_last_seen(person_name)
                
        return exited_people

presence_service = PresenceService()
