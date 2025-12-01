#Livingroom

import network
import time
from machine import Pin, I2C
import ujson
from umqtt.simple import MQTTClient
import bme280
from bh1750 import BH1750
from pir import PIR


CLIENT_ID = "esp32_livingroom" 
TOPIC = b"home/livingroom/sensors"

WIFI_SSID = "TURKSAT-KABLONET-E602-2.4G" 
WIFI_PASS = "c05f2c96"
MQTT_BROKER = "192.168.0.36"

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
    
    try:
        bme = bme280.BME280(i2c=i2c)
    except Exception as e:
        print("BME280 Error:", e)
        bme = None

    try:
        bh = BH1750(i2c)
    except Exception as e:
        print("BH1750 Error:", e)
        bh = None
        
    pir = PIR(PIR_PIN)

    print(f"{CLIENT_ID} is starting to read...")

    while True:
        t, h, p, lux, motion = None, None, None, None, False

        if bme:
            try:
                temp, pressure, hum = bme.read_compensated_data()
                t = round(temp , 2)
                h = round(hum / 1024, 2)
                p = round(pressure / 256, 2)
            except Exception as e:
                print("BME Read Error:", e)

        if bh:
            try:
                lux = round(bh.luminance(BH1750.ONCE_HIRES_1), 2)
            except Exception as e:
                print("BH1750 Read Error:", e)

        try:
            motion = pir.motion_detected()
        except:
            pass

  
        try:
            payload = ujson.dumps({
                "device_id": CLIENT_ID,
                "temperature": t,
                "humidity": h,
                "pressure": p,
                "light_level": lux,
                "motion_detected": motion
            })

            print(f"Sending: {payload}")
            client.publish(TOPIC, payload)
        except Exception as e:
            print("Error, reconnecting...", e)
            try:
                client = connect_mqtt()
            except:
                pass
        
        time.sleep(2)


if __name__ == "__main__":
    main()