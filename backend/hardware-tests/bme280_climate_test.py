# =============================================================================
# Description:
# This script tests the BME280 environmental sensor, which measures
# temperature, humidity, and barometric pressure. It communicates
# via the I2C protocol using the official Adafruit CircuitPython library.
#
# Hardware Setup (for breakout boards with SPI/I2C):
# - This setup is for BME280 modules that support both I2C and SPI.
# - VCC -> 3.3V (Physical Pin 1 or 17)
# - GND -> GND (e.g., Physical Pin 6, 9, 34, etc.)
# - SCL (sometimes labeled SCK) -> SCL (Physical Pin 5 / GPIO 3)
# - SDA (sometimes labeled SDI) -> SDA (Physical Pin 3 / GPIO 2)
# - CS (Chip Select) -> 3.3V (This is CRITICAL to force the module into I2C mode)
# =============================================================================

import time
import board
from adafruit_bme280 import basic as adafruit_bme280

def main(): 
    """Main function to initialize and read from the BME280 sensor."""
    try:
        i2c = board.I2C()

        bme280 = adafruit_bme280.Adafruit_BME280_I2C(i2c, address=0x77)

        print("Reading data from BME280 sensor...")
        print("Press CTRL+C to exit.")

        while True:
            temperature = bme280.temperature
            humidity = bme280.humidity
            pressure = bme280.pressure

            print("\n---------------------------------")
            print(f"Temperature: {temperature:.1f} °C")
            print(f"Humidity:    {humidity:.1f} %")
            print(f"Pressure:    {pressure:.1f} hPa")
            print("---------------------------------")
            
            time.sleep(2)

    except (ValueError, RuntimeError) as e:
        print("\nERROR: Could not read from the sensor. Please check wiring.")
        print("Verify the I2C address with 'sudo i2cdetect -y 1' (should be 0x76 or 0x77).")
        print(f"Details: {e}")
    except KeyboardInterrupt:
        print("\nTest stopped by user.")
    finally:
        print("Exiting program.")


if __name__ == "__main__":
    main()