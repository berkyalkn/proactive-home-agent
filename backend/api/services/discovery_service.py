import asyncio
import json
import paho.mqtt.client as mqtt
import logging
import os
from dotenv import load_dotenv

logger = logging.getLogger(__name__)

class DiscoveryService:
    def __init__(self):
        self.mqtt_broker = os.getenv("MQTT_BROKER", "127.0.0.1")
        self.mqtt_port = int(os.getenv("MQTT_PORT", 1883))
        self.subnet = os.getenv("NETWORK_SUBNET", "192.168.0.")
        
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
            except:
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
                    "id": f"tapo-{ip.replace('.', '')}",
                    "display_name": f"Tapo {model_name} ({ip})",
                    "ip": ip,
                    "model": model_name,
                    "type": device_type
                })
            except:
                pass

        tasks = [check_tapo_ip(i) for i in range(2, 50)] 
        await asyncio.gather(*tasks)

        await asyncio.sleep(4)
        
        mqtt_client.loop_stop()
        mqtt_client.disconnect()

        discovered_devices.append({
            "id": "mac-cam-internal", "model": "MacBook-Facetime", 
            "ip": "127.0.0.1", "type": "camera", "display_name": "Local RTSP Camera"
        })

        return discovered_devices

discovery_service = DiscoveryService()