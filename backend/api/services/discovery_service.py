import asyncio
import json
import paho.mqtt.client as mqtt
import logging
import os
import socket
import time
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
        self.tapo_user = os.getenv("TAPO_USERNAME")
        self.tapo_pass = os.getenv("TAPO_PASSWORD")
        
    def detect_local_subnet(self) -> str:
        try:
            s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
            s.connect(("8.8.8.8", 80))
            local_ip = s.getsockname()[0]
            s.close()
            parts = local_ip.split('.')
            return f"{parts[0]}.{parts[1]}.{parts[2]}."
        except Exception:
            return os.getenv("NETWORK_SUBNET", "192.168.1.")

    async def scan_for_esp_nodes(self, duration: float = 3.5) -> list[dict]:
        queue: asyncio.Queue = asyncio.Queue()
        loop = asyncio.get_event_loop()

        def on_message(client, userdata, msg):
            try:
                payload = json.loads(msg.payload.decode())
                if "device_id" in payload:
                    loop.call_soon_threadsafe(queue.put_nowait, payload)
            except Exception as e:
                pass

        try:
            mqtt_client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION1)
        except AttributeError:
            mqtt_client = mqtt.Client() 

        mqtt_client.on_message = on_message
        
        try:
            mqtt_client.connect(self.mqtt_broker, self.mqtt_port, 60)
            mqtt_client.subscribe("home/#")
            mqtt_client.loop_start()
            
            ping_payload = json.dumps({"action": "identify", "timestamp": time.time()})
            mqtt_client.publish("home/discovery/ping", ping_payload)
            logger.info("Sent active MQTT discovery ping")
        except Exception as e:
            logger.error(f"MQTT Snooping failed: {e}")
            return []

        seen_ids = set()
        results = []
        deadline = loop.time() + duration

        while loop.time() < deadline:
            try:
                time_left = deadline - loop.time()
                if time_left <= 0:
                    break
                payload = await asyncio.wait_for(queue.get(), timeout=min(time_left, 0.5))
                dev_id = payload["device_id"]
                if dev_id not in seen_ids:
                    seen_ids.add(dev_id)
                    results.append({
                        "id": dev_id,
                        "display_name": f"ESP32 Node ({dev_id.split('_')[-1].capitalize()})",
                        "ip": "MQTT Node",
                        "model": "ESP32 Custom",
                        "type": "sensor_node"
                    })
            except asyncio.TimeoutError:
                continue
            except Exception as e:
                logger.warning(f"[Discovery] Queue fetch error: {e}")

        mqtt_client.loop_stop()
        mqtt_client.disconnect()
        return results

    async def scan_network(self):
        discovered_devices = []
        
        esp_scan_task = asyncio.create_task(self.scan_for_esp_nodes(duration=4.0))

        subnet = self.detect_local_subnet()
        logger.info(f"[Discovery] Scanning Tapo devices on subnet: {subnet}")
        
        async def check_tapo_ip(ip_end):
            if ip_end == 1: 
                return 

            ip = f"{subnet}{ip_end}"

            try:
                reader, writer = await asyncio.wait_for(
                    asyncio.open_connection(ip, 80), timeout=0.2
                )
                writer.close()
                await writer.wait_closed()
                
                device_type = "bulb" if ip_end in [14, 17] else "outlet"
                model_name = "L530E" if device_type == "bulb" else "P110"
                
                discovered_devices.append({
                    "id": f"tapo-{ip}",
                    "display_name": f"Tapo {model_name} ({ip})",
                    "ip": ip,
                    "model": model_name,
                    "type": device_type
                })
            except Exception:
                pass

        tasks = [check_tapo_ip(i) for i in range(2, 50)]
        await asyncio.gather(*tasks)

        esp_devices = await esp_scan_task
        discovered_devices.extend(esp_devices)

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

                device = None
                is_bulb = False
                
                try:
                    b_device = await asyncio.wait_for(connect_tapo_bulb(ip, self.tapo_user, self.tapo_pass), timeout=3.0)
                    if b_device:
                        await asyncio.wait_for(b_device.get_device_info(), timeout=3.0)
                        device = b_device
                        is_bulb = True
                except Exception:
                    pass
                
                if not device:
                    try:
                        p_device = await asyncio.wait_for(connect_tapo_device(ip, self.tapo_user, self.tapo_pass), timeout=3.0)
                        if p_device:
                            await asyncio.wait_for(p_device.get_device_info(), timeout=3.0)
                            device = p_device
                            is_bulb = False
                    except Exception:
                        pass
                
                if not device:
                    logger.error(f"Could not connect to Tapo device at {ip} for identification.")
                    return False

                status = await get_bulb_status(device) if is_bulb else await get_tapo_status(device)
                was_on = status.get("on", False)

                toggle_func = set_bulb_status if is_bulb else set_tapo_status
                
                logger.info(f"[{ip}] Triggering identify blink. Current state: {'ON' if was_on else 'OFF'}")
                
                try:
                    await toggle_func(device, not was_on)
                    await asyncio.sleep(1.5)
                finally:
                    try:
                        await toggle_func(device, was_on)
                    except Exception as e:
                        logger.error(f"[{ip}] Restore failed: {e}")
                    logger.info(f"[{ip}] Identify complete. Restored to original state.")
                
                return True

            elif device_id != "mac-cam-internal":
                try:
                    try:
                        mqtt_client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION1)
                    except AttributeError:
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