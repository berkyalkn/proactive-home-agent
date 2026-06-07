import logging
from sqlalchemy import event
from database.models import AgentDecision, SystemLog
from api.services.vector_db import vector_db

logger = logging.getLogger(__name__)

@event.listens_for(AgentDecision, "after_insert")
def auto_sync_decision_to_vector_db(mapper, connection, target: AgentDecision):
    """
    It is triggered immediately after a new AI decision is added to PostgreSQL.
     It converts the logic of the decision into semantic text and saves it to ChromaDB.
    """
    try:
        device_str = str(target.target_device_id) if target.target_device_id else "Unknown Device"
        
        memory_text = (
            f"AI Decision: Action {target.action} has been executed."
            f"Target Device: {device_str}. "
            f"Layer: {target.execution_layer}. "
            f"Reasoning for the Decision: {target.reasoning}"
            f"Confidence Score: {target.confidence}"
        )
        
        metadata = {
            "type": "agent_decision",
            "action": target.action,
            "layer": target.execution_layer,
            "confidence": float(target.confidence)
        }
        
        vector_db.add_memory(
            sql_id=str(target.id),
            text=memory_text,
            metadata=metadata
        )
        logger.info(f"[MemoryHook] AgentDecision {target.id} successfully synced to ChromaDB.")
        
    except Exception as e:
        logger.error(f"[MemoryHook] Failed to sync AgentDecision to VectorDB: {e}", exc_info=True)


@event.listens_for(SystemLog, "after_insert")
def auto_sync_log_to_vector_db(mapper, connection, target: SystemLog):
    """
    It is triggered the moment a critical system log is dropped into PostgreSQL.
    It memorizes nighttime activity, emergencies, or biometric security changes.
    """

    if target.level.upper() not in ["WARNING", "ERROR", "CRITICAL"] and "security" not in target.source.lower():
        return

    try:
        memory_text = f"System Event [{target.level}]: {target.message} (Source: {target.source})"
        
        metadata = {
            "type": "system_log",
            "level": target.level,
            "source": target.source
        }
        
        vector_db.add_memory(
            sql_id=str(target.id),
            text=memory_text,
            metadata=metadata
        )
        logger.info(f"[MemoryHook] SystemLog {target.id} successfully synced to ChromaDB.")
        
    except Exception as e:
        logger.error(f"[MemoryHook] Failed to sync SystemLog to VectorDB: {e}", exc_info=True)