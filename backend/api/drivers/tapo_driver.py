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
        logger.error(f"Tapo device status reading failed: {e}")
        return {"on": False, "error": "Offline"}

async def set_tapo_status(device: ApiClient, set_on: bool):
    """Sets the status of a connected Tapo device (turns it on/off)."""
    try:
        if set_on:
            await device.on()
        else:
            await device.off()
    except Exception as e:
        logger.error(f"Tapo device control failed: {e}")
        raise e



async def connect_tapo_bulb(ip: str, username: str, password: str):
    """Connects to a Tapo L530 smart bulb at the specified IP address."""
    try:
        client = ApiClient(username, password)
        device = await client.l530(ip)
        logger.info(f"Tapo L530 Bulb '{ip}' connected successfully.")
        return device
    except Exception as e:
        logger.error(f"Tapo L530 Bulb '{ip}' connection failed: {e}")
        return None


async def get_bulb_status(device) -> dict:
    """Gets the current status of a Tapo L530 bulb (on/off, brightness, hue, saturation)."""
    try:
        info = await device.get_device_info()
        data = info.to_dict()
        hue = data.get("hue", 0)
        saturation = data.get("saturation", 0)
        color_temp = data.get("color_temp", 0)

        if color_temp > 0:
            hue = 0
            saturation = 0

        return {
            "on": data.get("device_on", False),
            "brightness": data.get("brightness", 100),
            "hue": hue,
            "saturation": saturation,
            "color_temp": color_temp,
            "error": None
        }
    except Exception as e:
        logger.error(f"Tapo L530 Bulb status reading failed: {e}")
        return {
            "on": False,
            "brightness": 0,
            "hue": 0,
            "saturation": 0,
            "color_temp": 0,
            "error": "Offline"
        }


async def set_bulb_status(device, set_on: bool):
    """Turns a Tapo L530 bulb on or off."""
    try:
        if set_on:
            await device.on()
        else:
            await device.off()
    except Exception as e:
        logger.error(f"Tapo L530 Bulb power control failed: {e}")
        raise e


async def set_bulb_brightness(device, brightness: int):
    """Sets the brightness of a Tapo L530 bulb (1-100)."""
    try:
        clamped = max(1, min(100, brightness))
        await device.set_brightness(clamped)
        logger.info(f"Tapo L530 Bulb brightness set to {clamped}%")
    except Exception as e:
        logger.error(f"Tapo L530 Bulb brightness control failed: {e}")
        raise e


async def set_bulb_color(device, hue: int, saturation: int):
    """Sets the color of a Tapo L530 bulb (hue: 0-360, saturation: 0-100).
    If saturation is 0 (white/daylight), uses color temperature instead.
    """
    try:
        hue_clamped = max(0, min(360, hue))
        sat_clamped = max(0, min(100, saturation))
        
        if sat_clamped == 0:
            await device.set_color_temperature(6500)
            logger.info(f"Tapo L530 Bulb set to daylight mode (6500K)")
        else:
            await device.set_hue_saturation(hue_clamped, sat_clamped)
            logger.info(f"Tapo L530 Bulb color set to hue={hue_clamped}, saturation={sat_clamped}")
    except Exception as e:
        logger.error(f"Tapo L530 Bulb color control failed: {e}")
        raise e


async def set_bulb_color_temperature(device, color_temp: int):
    """Sets the color temperature of a Tapo L530 bulb (2500-6500K)."""
    try:
        temp_clamped = max(2500, min(6500, color_temp))
        await device.set_color_temperature(temp_clamped)
        logger.info(f"Tapo L530 Bulb color temperature set to {temp_clamped}K")
    except Exception as e:
        logger.error(f"Tapo L530 Bulb color temperature control failed: {e}")
        raise e