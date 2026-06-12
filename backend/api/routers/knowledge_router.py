from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from database.settings import engine
from database.models import HomeKnowledge, User, SystemLog
from api.routers.auth_router import get_current_user
from api.services.vector_db import vector_db
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/knowledge", tags=["Knowledge"])

@router.post("/add")
async def add_knowledge(
    title: str, 
    content: str, 
    category: str = "general", 
    current_user: User = Depends(get_current_user)
):
    """Adds a new static rule, password, or manual to the Smart Home's Brain."""
    
    with Session(engine) as session:
        new_knowledge = HomeKnowledge(
            title=title, 
            content=content, 
            category=category
        )
        session.add(new_knowledge)
        
        new_log = SystemLog(
            level="INFO",
            source="Knowledge_Base",
            message=f"'{current_user.username}' added new home knowledge: '{title}'"
        )
        session.add(new_log)
        
        session.commit()
        session.refresh(new_knowledge)
        
        try:
            vector_text = f"Category [{category.upper()}]: {title} - {content}"
            metadata = {
                "category": category,
                "title": title,
                "added_by": current_user.username
            }
            
            vector_db.add_knowledge(
                doc_id=str(new_knowledge.id),
                text=vector_text,
                metadata=metadata
            )
            logger.info(f"[KnowledgeRouter] Successfully vectorized knowledge: {title}")
            
        except Exception as e:
            session.delete(new_knowledge)
            session.commit()
            logger.error(f"[KnowledgeRouter] Vectorization failed: {e}")
            raise HTTPException(status_code=500, detail="Failed to sync with Vector DB.")
            
    return {
        "status": "success", 
        "message": f"Knowledge '{title}' added.",
        "id": new_knowledge.id
    }


@router.get("/list")
async def list_knowledge(current_user: User = Depends(get_current_user)):
    """Lists all active home rules and knowledge from the database."""

    with Session(engine) as session:
        knowledge_list = session.exec(select(HomeKnowledge)).all()
        return {"knowledge_base": knowledge_list}


@router.delete("/{knowledge_id}")
async def delete_knowledge(knowledge_id: int, current_user: User = Depends(get_current_user)):
    """Deletes a rule from both PostgreSQL and ChromaDB."""

    with Session(engine) as session:
        knowledge = session.exec(select(HomeKnowledge).where(HomeKnowledge.id == knowledge_id)).first()
        
        if not knowledge:
            raise HTTPException(status_code=404, detail="Knowledge not found.")
            
        session.delete(knowledge)
        
        new_log = SystemLog(
            level="WARNING",
            source="Knowledge_Base",
            message=f"'{current_user.username}' deleted home knowledge: '{knowledge.title}'"
        )
        session.add(new_log)
        session.commit()
        
        try:
            vector_db.semantic_collection.delete(ids=[f"doc_{knowledge_id}"])
            logger.info(f"[KnowledgeRouter] Deleted vector for doc_{knowledge_id}")
        except Exception as e:
            logger.warning(f"[KnowledgeRouter] Could not delete vector from ChromaDB: {e}")

    return {"status": "success", "message": f"'{knowledge.title}' has been deleted."}