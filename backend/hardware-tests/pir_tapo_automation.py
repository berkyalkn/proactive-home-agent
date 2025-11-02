# =============================================================================
# Description:
# It monitors an HC-SR501 PIR motion sensor and controls a TP-Link Tapo
# P110 smart plug in response to motion events. When motion is detected,
# the plug is turned on; when motion stops, the plug is turned off.
# This script uses the 'tapo' library for plug control.
#
# Hardware Setup:
# - PIR Sensor OUT pin is connected to GPIO 4.
# - A Tapo P110 smart plug is configured on the local network.
# =============================================================================

from json import load
import lgpio
import asyncio
import os
from dotenv import load_dotenv
from tapo import ApiClient
import time

load_dotenv()

PIR_PIN = 4

TAPO_USERNAME = os.getenv("TAPO_USERNAME")
TAPO_PASSWORD = os.getenv("TAPO_PASSWORD")
IP_ADDRESS = os.getenv("TAPO_IP")
# ------------------------------------

async def main():
   
    gpio_handle = lgpio.gpiochip_open(0)
    lgpio.gpio_claim_input(gpio_handle, PIR_PIN)
    print("PIR sensor is ready to detect motion.")

    try:
        client = ApiClient(TAPO_USERNAME, TAPO_PASSWORD)
        tapo_device = await client.p110(IP_ADDRESS)
        print(f"Successfully connected to Tapo Plug ({IP_ADDRESS}).")
    except Exception as e:
        print(f"ERROR: Could not connect to Tapo Plug! -> {e}")
        lgpio.gpiochip_close(gpio_handle) 
        return
    
   
    print("\nAutomation loop started. Waiting for motion...")
    print("-------------------------------------------------")
    
    plug_is_on = False 
    
    try:
        while True:
            motion_detected = lgpio.gpio_read(gpio_handle, PIR_PIN)

            if motion_detected and not plug_is_on:
                print("Motion Detected! -> Turning Plug ON...")
                await tapo_device.on()
                plug_is_on = True

            elif not motion_detected and plug_is_on:
                print("...Motion Stopped. -> Turning Plug OFF...")
                await tapo_device.off()
                plug_is_on = False
            
            await asyncio.sleep(0.5) 

    except (KeyboardInterrupt, asyncio.CancelledError):
        print("\nProgram terminated by user.")

    finally:
        print("Exiting program... Cleaning up GPIO.")
        lgpio.gpiochip_close(gpio_handle)


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        pass