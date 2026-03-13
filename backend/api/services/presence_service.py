import time
import logging
from typing import Dict, List

logger = logging.getLogger(__name__)

class PresenceService:
    """
    The system's 'Short-Term Memory'.
    It tracks who is in the room and blocks unnecessary 'Entry' spam.
    """
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(PresenceService, cls).__new__(cls)
            cls._instance.active_people: Dict[str, float] = {}
            cls._instance.timeout_seconds = 15
            logger.info("Presence Service has been started.")
        return cls._instance

    def handle_detection(self, person_name: str) -> str:
        """
        It retrieves the name from the facial recognition system.
        If it's a new login, it returns 'ENTRY'; if it's already been seen inside, it returns 'PRESENT'.
        """
        current_time = time.time()
        
        if person_name not in self.active_people:
            self.active_people[person_name] = current_time
            return "ENTRY"
        else:
            self.active_people[person_name] = current_time
            return "PRESENT"

    def check_timeouts(self) -> List[str]:
        """
        It finds those who haven't been seen on camera for a long time, removes them from the list, and the 'EXIT' list returns.
        """
        current_time = time.time()
        exited_people = []
        
        for person_name in list(self.active_people.keys()):
            last_seen = self.active_people[person_name]
            
            if (current_time - last_seen) > self.timeout_seconds:
                exited_people.append(person_name)
                del self.active_people[person_name]
                logger.info(f"EXIT EVENT: {person_name} left the room (Timeout)")
                
        return exited_people

presence_service = PresenceService()