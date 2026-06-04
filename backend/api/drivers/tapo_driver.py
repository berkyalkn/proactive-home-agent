from tapo import ApiClient
import logging
import asyncio

logger = logging.getLogger(__name__)
logging.getLogger("tapo.api.protocol.klap_protocol").setLevel(logging.CRITICAL)

async def connect_tapo_device(ip: str, username: str, password: str) -> ApiClient | None:
    try:
        client = ApiClient(username, password)
        device = await asyncio.wait_for(client.p110(ip), timeout=4.0)
        logger.info(f"'{ip}' connected successfully.")
        return device
    except Exception as e:
        logger.error(f"'{ip}' connection failed: {e}")
        return None

async def get_tapo_status(device) -> dict:
    try:
        info = await device.get_device_info()
        is_on = info.to_dict().get("device_on", False)
        return {"on": is_on, "error": None}
    except Exception as e:
        logger.error(f"Tapo device status reading failed: {e}")
        return {"on": False, "error": "Offline"}

async def set_tapo_status(device, set_on: bool):
    try:
        if set_on:
            await device.on()
        else:
            await device.off()
    except Exception as e:
        logger.error(f"Tapo device control failed: {e}")
        raise e

async def connect_tapo_bulb(ip: str, username: str, password: str):
    try:
        client = ApiClient(username, password)
        device = await asyncio.wait_for(client.l530(ip), timeout=4.0)
        logger.info(f"Tapo L530 Bulb '{ip}' connected successfully.")
        return device
    except Exception as e:
        logger.error(f"Tapo L530 Bulb '{ip}' connection failed: {e}")
        return None

async def get_bulb_status(device) -> dict:
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
            "on": False, "brightness": 0, "hue": 0, "saturation": 0,
            "color_temp": 0, "error": "Offline"
        }

async def set_bulb_status(device, set_on: bool):
    try:
        if set_on:
            await device.on()
        else:
            await device.off()
    except Exception as e:
        logger.error(f"Tapo L530 Bulb power control failed: {e}")
        raise e

async def set_bulb_brightness(device, brightness: int):
    try:
        clamped = max(1, min(100, brightness))
        await device.set_brightness(clamped)
    except Exception as e:
        logger.error(f"Tapo L530 Bulb brightness control failed: {e}")
        raise e

async def set_bulb_color(device, hue: int, saturation: int):
    try:
        hue_clamped = max(0, min(360, hue))
        sat_clamped = max(0, min(100, saturation))
        
        if sat_clamped == 0:
            await device.set_color_temperature(6500)
        else:
            await device.set_hue_saturation(hue_clamped, sat_clamped)
    except Exception as e:
        logger.error(f"Tapo L530 Bulb color control failed: {e}")
        raise e

async def get_device_model(ip: str, username: str, password: str, retries: int = 3) -> str:
    import asyncio 
    client = ApiClient(username, password)
    
    for attempt in range(retries):
        device = None
        try:
            device = await asyncio.wait_for(client.l530(ip), timeout=2.0)
            info = await device.get_device_info()
            return str(info.to_dict().get("model", "")).upper()
        except Exception:
            pass
        finally:
            if device:
                try:
                    if hasattr(device, 'logout'): await device.logout()
                    elif hasattr(device, 'close'): await device.close()
                except: pass
                
        await asyncio.sleep(0.3) 
        
        device_plug = None
        try:
            device_plug = await asyncio.wait_for(client.p110(ip), timeout=2.0)
            info = await device_plug.get_device_info()
            return str(info.to_dict().get("model", "")).upper()
        except Exception:
            pass
        finally:
            if device_plug:
                try:
                    if hasattr(device_plug, 'logout'): await device_plug.logout()
                    elif hasattr(device_plug, 'close'): await device_plug.close()
                except: pass

        if attempt < retries - 1:
            await asyncio.sleep(1.0) 

    return ""