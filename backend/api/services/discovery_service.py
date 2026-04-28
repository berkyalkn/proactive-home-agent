import asyncio
import json
import paho.mqtt.client as mqtt
import logging
import os
from dotenv import load_dotenv

from api.drivers.tapo_driver import (
    connect_tapo_device, get_tapo_status, set_tapo_status,
    connect_tapo_bulb, get_bulb_status, set_bulb_status
)

load_dotenv()

logger = logging.getLogger(__name__)

class DiscoveryService:
    def __init__(self):
        self.mqtt_broker = os.getenv("MQTT_BROKER", "127.0.0.1")
        self.mqtt_port = int(os.getenv("MQTT_PORT", 1883))
        self.subnet = os.getenv("NETWORK_SUBNET", "192.168.1.") 
        self.tapo_user = os.getenv("TAPO_USERNAME")
        self.tapo_pass = os.getenv("TAPO_PASSWORD")
        
    async def scan_network(self):
        discovered_devices = []
        
        def on_message(client, userdata, msg):
            try:
                payload = json.loads(msg.payload.decode())
                if "device_id" in payload:
                    dev_id = payload["device_id"]
                    if not any(d['id'] == dev_id for d in discovered_devices):
                        discovered_devices.append({
                            "id": dev_id,
                            "display_name": f"ESP32 Node ({dev_id.split('_')[-1].capitalize()})",
                            "ip": "MQTT Node",
                            "model": "ESP32 Custom",
                            "type": "sensor_node"
                        })
            except Exception as e:
                logger.warning(f"[Discovery] Hata: {e}")

        try:
            mqtt_client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION1)
        except AttributeError:
            mqtt_client = mqtt.Client() 

        mqtt_client.on_message = on_message
        
        try:
            mqtt_client.connect(self.mqtt_broker, self.mqtt_port, 60)
            mqtt_client.subscribe("home/#")
            mqtt_client.loop_start()
        except Exception as e:
            logger.error(f"MQTT Snooping failed: {e}")

        async def check_tapo_ip(ip_end):
            if ip_end == 1: 
                return 

            ip = f"{self.subnet}{ip_end}"

            try:
                reader, writer = await asyncio.wait_for(
                    asyncio.open_connection(ip, 80), timeout=0.2
                )
                writer.close()
                await writer.wait_closed()
                
                device_type = "bulb" if ip_end in [14, 24] else "outlet"
                model_name = "L530E" if device_type == "bulb" else "P110"
                
                discovered_devices.append({
                    "id": f"tapo-{ip}",
                    "display_name": f"Tapo {model_name} ({ip})",
                    "ip": ip,
                    "model": model_name,
                    "type": device_type
                })
            except Exception as e:
                logger.warning(f"[Discovery] Hata: {e}")

        tasks = [check_tapo_ip(i) for i in range(2, 50)] 
        await asyncio.gather(*tasks)

        await asyncio.sleep(3.5)
        
        mqtt_client.loop_stop()
        mqtt_client.disconnect()

        discovered_devices.append({
            "id": "mac-cam-internal", 
            "model": "MacBook-Facetime", 
            "ip": "127.0.0.1", 
            "type": "camera", 
            "display_name": "Local RTSP Camera"
        })

        return discovered_devices

    async def ping_device_for_identification(self, device_id: str) -> bool:
        """
        A 'Blink' or relay sound is triggered to allow the user to physically recognize the device.
        The original state is preserved to avoid disrupting it.
        """
        try:
            if device_id.startswith("tapo-"):
                ip = device_id.split("tapo-")[1] 
                
                if not self.tapo_user or not self.tapo_pass:
                    logger.error("Tapo credentials missing in .env. Cannot ping device.")
                    return False

                is_bulb = False
                device = await connect_tapo_bulb(ip, self.tapo_user, self.tapo_pass)
                
                if device:
                    is_bulb = True
                else:
                    device = await connect_tapo_device(ip, self.tapo_user, self.tapo_pass)
                
                if not device:
                    logger.error(f"Could not connect to Tapo device at {ip} for identification.")
                    return False

                status = await get_bulb_status(device) if is_bulb else await get_tapo_status(device)
                was_on = status.get("on", False)

                toggle_func = set_bulb_status if is_bulb else set_tapo_status
                
                logger.info(f"[{ip}] Triggering identify blink. Current state: {'ON' if was_on else 'OFF'}")
                
                await toggle_func(device, not was_on)
                
                await asyncio.sleep(1.5)
                
                await toggle_func(device, was_on)
                logger.info(f"[{ip}] Identify complete. Restored to original state.")
                
                return True

            elif device_id != "mac-cam-internal":
                try:
                    mqtt_client = mqtt.Client()
                    mqtt_client.connect(self.mqtt_broker, self.mqtt_port, 60)
                    mqtt_client.publish(f"home/{device_id}/identify", "blink")
                    mqtt_client.disconnect()
                    logger.info(f"[Identify] Sent MQTT blink command to {device_id}")
                    return True
                except Exception as e:
                    logger.error(f"MQTT Identify publish failed: {e}")
                    return False

            return False
            
        except Exception as e:
            logger.error(f"[Identify] Failed for {device_id}: {str(e)}")
            return False

discovery_service = DiscoveryService()