import paho.mqtt.client as mqtt
import json
import logging
import os
import time
from dotenv import load_dotenv

load_dotenv()
logger = logging.getLogger(__name__)

LATEST_SENSOR_DATA = {}

MQTT_BROKER = "localhost"  
MQTT_PORT = 1883
MQTT_TOPIC = "home/+/sensors" 


def on_connect(client, userdata, flags, rc):
    """It works when connected to the broker."""
    if rc == 0:
        logger.info("MQTT Service: Successfully connected to Broker!")
        client.subscribe(MQTT_TOPIC)
        logger.info(f"Listening: {MQTT_TOPIC}")
    else:
        logger.error(f"MQTT Connection Error. Code: {rc}")

def on_message(client, userdata, msg):
    """Works when a new message arrives."""
    try:

        payload_str = msg.payload.decode("utf-8")
        data = json.loads(payload_str)
        
        device_id = data.get("device_id", "unknown_device")
        
        LATEST_SENSOR_DATA[device_id] = data
    
    except json.JSONDecodeError:
        logger.error(f"Incorrect JSON format: {msg.payload}")
    except Exception as e:
        logger.error(f"Message processing error: {e}")


def on_message(client, userdata, msg):
    try:
        payload_str = msg.payload.decode("utf-8")
        data = json.loads(payload_str)
        
        topic_parts = msg.topic.split("/")
        if len(topic_parts) >= 2:
            room_name = topic_parts[1]
        else:
            room_name = "unknown"

        device_id = data.get("device_id", f"esp32_{room_name}")
        
        data["last_seen"] = time.time()        
        LATEST_SENSOR_DATA[device_id] = data

    except json.JSONDecodeError:
        logger.error(f"Incorrect JSON format: {msg.payload}")
    except Exception as e:
        logger.error(f"Message processing error: {e}")


mqtt_client = mqtt.Client()
mqtt_client.on_connect = on_connect
mqtt_client.on_message = on_message

def start_mqtt_service():
    """Starts the MQTT loop in the background."""
    try:
        mqtt_client.connect(MQTT_BROKER, MQTT_PORT, 60)
        mqtt_client.loop_start() 
        logger.info("MQTT Background Service Started.")
    except Exception as e:
        logger.error(f"Could not start MQTT Service: {e}")

def stop_mqtt_service():
    """Stops the MQTT loop."""
    mqtt_client.loop_stop()
    mqtt_client.disconnect()
    logger.info("MQTT Service Stopped.")