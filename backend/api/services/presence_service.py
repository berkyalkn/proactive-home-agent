import time
import logging
from typing import Dict, List

logger = logging.getLogger(__name__)

class PresenceService:
    """
    The system has 'Short-Term Memory' and 'Flickering Shield'.
    It tracks who is in the room and absorbs momentary 'Unknown' errors caused by head movements.
    """
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(PresenceService, cls).__new__(cls)
            cls._instance.active_people: Dict[str, float] = {}
            cls._instance.timeout_seconds = 15
            
            cls._instance.unknown_grace_period = 4.0 
            cls._instance.unknown_first_seen = 0.0
            
            logger.info("Presence Service has been started")
        return cls._instance

    def handle_detection(self, person_name: str) -> str:
        current_time = time.time()
        
        if person_name != "Unknown":
            self.unknown_first_seen = 0.0
            
            if person_name not in self.active_people:
                self.active_people[person_name] = current_time
                return "ENTRY"
            else:
                self.active_people[person_name] = current_time
                return "PRESENT"

        else:
            if person_name in self.active_people:
                self.active_people[person_name] = current_time
                return "PRESENT"
            
            known_people_present = any(name != "Unknown" for name in self.active_people.keys())
            
            if known_people_present:
                if self.unknown_first_seen == 0.0:
                    self.unknown_first_seen = current_time
                    logger.debug("Shield Activated: A brief 'Unknown' signal was detected, waiting 4 seconds...")
                    return "IGNORED"
                
                elif (current_time - self.unknown_first_seen) > self.unknown_grace_period:
                    self.active_people[person_name] = current_time
                    self.unknown_first_seen = 0.0
                    return "ENTRY"
                
                else:
                    return "IGNORED"
            else:
                self.active_people[person_name] = current_time
                return "ENTRY"

    def check_timeouts(self) -> List[str]:
        current_time = time.time()
        exited_people = []
        
        for person_name in list(self.active_people.keys()):
            last_seen = self.active_people[person_name]
            
            if (current_time - last_seen) > self.timeout_seconds:
                exited_people.append(person_name)
                del self.active_people[person_name]
                logger.info(f"EXIT EVENT: {person_name} left the room (Timeout).")
                
                if person_name == "Unknown":
                    self.unknown_first_seen = 0.0
                
        return exited_people

presence_service = PresenceService()