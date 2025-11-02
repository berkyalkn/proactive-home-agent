from tapo import ApiClient
import logging

logger = logging.getLogger(__name__)

async def connect_tapo_device(ip: str, username: str, password: str) -> ApiClient | None:
    """Tries to connect to a Tapo device at a specific IP address."""
    try:
        client = ApiClient(username, password)
        device = await client.p110(ip)
        logger.info(f"'{ip}' connected successfully.")
        return device
    except Exception as e:
        logger.error(f"'{ip}' connection failed: {e}")
        return None

async def get_tapo_status(device: ApiClient) -> dict:
    """Gets the status of a connected Tapo device."""
    try:
        info = await device.get_device_info()
        is_on = info.to_dict().get("device_on", False)
        return {"on": is_on, "error": None}
    except Exception as e:
        logger.error(f"'{ip}' status reading failed: {e}")
        return {"on": False, "error": "Offline"}

async def set_tapo_status(device: ApiClient, set_on: bool):
    """Sets the status of a connected Tapo device (turns it on/off)."""
    try:
        if set_on:
            await device.on()
        else:
            await device.off()
    except Exception as e:
        logger.error(f"'{ip}' control failed: {e}")
        raise e