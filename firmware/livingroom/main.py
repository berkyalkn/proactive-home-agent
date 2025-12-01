#LIVINGROOM

import network
import time
from machine import Pin, I2C
import ujson
from umqtt.simple import MQTTClient
import bme280
from bh1750 import BH1750
from pir import PIR

import secrets

CLIENT_ID = "esp32_livingroom" 
TOPIC = b"home/livingroom/sensors"

WIFI_SSID = secrets.WIFI_SSID
WIFI_PASS = secrets.WIFI_PASS
MQTT_BROKER = secrets.MQTT_BROKER

I2C_SCL = 22
I2C_SDA = 21
PIR_PIN = 27

def connect_wifi():
    wlan = network.WLAN(network.STA_IF)
    wlan.active(True)
    if not wlan.isconnected():
        print('Connecting to Wi-Fi...')
        wlan.connect(WIFI_SSID, WIFI_PASS)
        while not wlan.isconnected():
            pass
    print('Connected to Wi-Fi:', wlan.ifconfig())

def connect_mqtt():
    client = MQTTClient(CLIENT_ID, MQTT_BROKER)
    client.connect()
    print('MQTT Broker has connected')
    return client

def main():
    connect_wifi()
    client = connect_mqtt()
    
    i2c = I2C(0, scl=Pin(I2C_SCL), sda=Pin(I2C_SDA), freq=400000)
    bme = bme280.BME280(i2c=i2c,address=0x76)
    bh = BH1750(i2c)
    pir = PIR(PIR_PIN)

    print(f"{CLIENT_ID} starts reading sensor...")

    while True:
        try:
            temp, pressure, hum = bme.read_compensated_data()
            t = temp / 100
            h = hum / 1024
            p = pressure / 256
            lux = bh.luminance(BH1750.ONCE_HIRES_1)
            motion = pir.motion_detected()

            payload = ujson.dumps({
                "device_id": CLIENT_ID,
                "temperature": round(t, 2),
                "humidity": round(h, 2),
                "pressure": round(p, 2),
                "light_level": round(lux, 2),
                "motion_detected": motion
            })

            print(f"Sending ({TOPIC}): {payload}")
            client.publish(TOPIC, payload)
            time.sleep(5)

        except OSError as e:
            print('Error, reconnecting...', e)
            time.sleep(10)
            try:
                client = connect_mqtt()
            except:
                pass

if __name__ == "__main__":
    main()