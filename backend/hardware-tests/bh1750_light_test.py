# =============================================================================
# Description:
# This script tests the BH1750 digital ambient light sensor using the
# official Adafruit CircuitPython library, which is the recommended and
# most up-to-date method for this sensor. It uses the Blinka compatibility
# layer to communicate via I2C on a Raspberry Pi.
#
# Hardware Setup:
# - VCC -> 3.3V (Physical Pin 17)
# - GND -> GND (Physical Pin 34)
# - SCL -> SCL (Physical Pin 5 / GPIO 3)
# - SDA -> SDA (Physical Pin 3 / GPIO 2)
# =============================================================================

import time
import board
import adafruit_bh1750

def main():
    """Main function to initialize and read from the BH1750 sensor."""
    try:
        i2c = board.I2C()

        sensor = adafruit_bh1750.BH1750(i2c, address=0x23)

        print("Reading data from BH1750 sensor (using Adafruit library)...")
        print("Press CTRL+C to exit.")

        while True:
            light_level = sensor.lux
            
            print(f"Ambient Light: {light_level:.2f} Lux")
            
            time.sleep(2)

    except (ValueError, RuntimeError) as e:
        print(f"\nERROR: Could not read from the sensor. Please check wiring.")
        print(f"Details: {e}")
    except KeyboardInterrupt:
        print("\nTest stopped by user.")
    finally:
        print("Exiting program.")


if __name__ == "__main__":
    main()