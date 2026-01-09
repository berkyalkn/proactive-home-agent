"""
Short-term TTL cache for device status queries.
Improves chatbot response speed by caching recent device states.
"""
import time
from typing import Any, Optional

_cache: dict[str, tuple[Any, float]] = {}
DEFAULT_TTL = 10 


def get_cached(key: str, ttl: float = DEFAULT_TTL) -> Optional[Any]:
    """
    Get cached data if not expired.
    
    Args:
        key: Cache key identifier
        ttl: Time-to-live in seconds (default: 10)
    
    Returns:
        Cached data if valid, None if expired or not found
    """
    if key in _cache:
        data, timestamp = _cache[key]
        if time.time() - timestamp < ttl:
            return data
        del _cache[key] 
    return None


def set_cache(key: str, data: Any) -> None:
    """
    Store data in cache with current timestamp.
    
    Args:
        key: Cache key identifier
        data: Data to cache
    """
    _cache[key] = (data, time.time())


def invalidate_cache(key: str = None) -> None:
    """
    Invalidate specific key or all cache entries.
    
    Args:
        key: Specific key to invalidate, or None to clear all
    """
    if key:
        _cache.pop(key, None)
    else:
        _cache.clear()
