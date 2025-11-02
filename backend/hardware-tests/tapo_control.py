# =============================================================================
# Description:
# This script provides an interactive command-line interface (CLI) to
# control and monitor a TP-Link Tapo P110 smart plug. It is designed
# as a standalone tool for testing and manual control of the plug
# directly from the Raspberry Pi. The script connects to the plug
# using its local IP address and authenticates with the user's Tapo
# cloud credentials.
#
# How to Use:
# 1. Fill in your credentials (IP_ADDRESS, TAPO_USERNAME, TAPO_PASSWORD).
# 2. Run the script from the terminal: python3 tapo_interactive_control_en.py
# 3. Use the commands 'on', 'off', 'status', or 'quit' to interact
#    with the smart plug.
#
# Libraries Used:
# - tapo (ApiClient): A community-developed library for controlling
#   TP-Link Tapo devices locally.
# - asyncio: Used to handle the asynchronous communication with the device.
# =============================================================================


import asyncio
import os
from dotenv import load_dotenv
from datetime import datetime

from tapo import ApiClient
from tapo.requests import EnergyDataInterval

load_dotenv()

TAPO_USERNAME = os.getenv("TAPO_USERNAME")
TAPO_PASSWORD = os.getenv("TAPO_PASSWORD")
IP_ADDRESS = os.getenv("TAPO_IP")


async def main():
    """
    Connects to the Tapo P110 plug and enters an interactive loop
    to control it from the command line.
    """
    try:
        
        client = ApiClient(TAPO_USERNAME, TAPO_PASSWORD)
        device = await client.p110(IP_ADDRESS)
        device_info = await device.get_device_info()
        device_name = device_info.to_dict().get("nickname", IP_ADDRESS)
        print(f"Successfully connected to the plug named '{device_name}'.")
        print("-------------------------------------------------")

    except Exception as e:
        print(f"ERROR: Could not connect to the plug! -> {e}")
        return 

   
    while True:
        print("\nWhat would you like to do?")
        print("  'on'    -> Turn the plug On")
        print("  'off'   -> Turn the plug Off")
        print("  'status'-> Show the plug's status and power consumption")
        print("  'quit'  -> Exit the program")
        
        command = input("Your command: ").lower().strip()

        try:
            if command == "on":
                await device.on()
                print("Plug has been turned ON.")
            
            elif command == "off":
                await device.off()
                print("Plug has been turned OFF.")

            elif command == "status":
                print("--- Plug Status ---")

                info = await device.get_device_info()
                energy = await device.get_energy_usage()
                
                is_on = "ON" if info.to_dict().get("device_on", False) else "OFF"
                power = energy.get("current_power", 0) / 1000

                print(f"  State: {is_on}")
                print(f"  Current Power: {power} Watts")
                print("---------------------")

            elif command == "quit":
                print("Exiting program...")
                break 
            
            else:
                print(" Invalid command. Please choose one from the list.")

        except Exception as e:
            print(f" ERROR: An issue occurred while processing the command! -> {e}")

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\nProgram terminated by user.")