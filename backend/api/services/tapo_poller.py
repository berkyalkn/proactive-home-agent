import asyncio
import logging
from api.routers.devices_router import CONNECTED_DEVICES
from api.services.websocket_manager import manager 

logger = logging.getLogger(__name__)

async def poll_tapo_devices():
    """
    It queries Tapo devices in a continuous loop:
    1. On/Off State
    2. Instantaneous Power Draw (Watt)
    3. Daily/Monthly Consumption (kWh)
    and writes these to the database AND broadcasts to WebSocket.
    """
    logger.info("Tapo Data Collector (Poller) Launched.")
    
    while True:
        try:
            for device_id, conn in list(CONNECTED_DEVICES.items()):
                
                if conn["protocol"] == "tapo":
                    try:
                        device = conn["object"]
                        
                        info = await device.get_device_info()
                        is_on = info.to_dict().get("device_on", False)

                        power_data = await device.get_current_power()
                        current_power_w = power_data.to_dict().get("current_power", 0) / 1000 

                        energy_usage = await device.get_energy_usage()
                        usage_dict = energy_usage.to_dict()
                        today_kwh = usage_dict.get("today_energy", 0) / 1000
                        month_kwh = usage_dict.get("month_energy", 0) / 1000
                        
                        data_to_save = {
                            "device_id": device_id, 
                            "state": 1.0 if is_on else 0.0,
                            "power": float(current_power_w),
                            "energy_today": float(today_kwh), 
                            "energy_month": float(month_kwh)
                        }
                        
                        from api.services.db_service import save_device_state
                        save_device_state(data_to_save)

                        await manager.broadcast_json({
                            "status": "device_update",
                            "device_id": device_id,
                            "data": {
                                "on": is_on,
                                "power": float(current_power_w)
                            }
                        })
                        
                    except Exception as e:

                        pass

                elif conn["protocol"] == "tapo_bulb":
                    try:
                        device = conn["object"]
                        info = await device.get_device_info()
                        info_dict = info.to_dict()
                        is_on = info_dict.get("device_on", False)
                        
                        await manager.broadcast_json({
                            "status": "device_update",
                            "device_id": device_id,
                            "data": {
                                "on": is_on,
                                "brightness": info_dict.get("brightness"),
                                "hue": info_dict.get("hue"),
                                "saturation": info_dict.get("saturation")
                            }
                        })
                    except Exception:
                        pass

            await asyncio.sleep(3) 
            
        except asyncio.CancelledError:
            logger.info("Tapo Poller has been stopped.")
            break
        except Exception as e:
            logger.error(f"Tapo Poller General Error: {e}")
            await asyncio.sleep(10)