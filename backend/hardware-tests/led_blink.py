# =============================================================================
# Description:
# Its sole purpose is to test and confirm that the Raspberry Pi can send a signal
# through its GPIO pins to control an external component. It does this by
# blinking a simple LED on and off at half-second intervals.
#
# Hardware Setup:
# - An LED is connected to GPIO 27 (Physical Pin 13).
# - A 330 Ohm resistor is used in series with the LED to limit current.
# - The circuit is completed by connecting to a GND pin on the Pi.
# - This script uses the RPi.GPIO library, which is now considered legacy
#   for the Pi 5 but is used here for initial basic testing.
# =============================================================================


import RPi.GPIO as GPIO
import time

GPIO.setmode(GPIO.BCM)


led_pin = 27

GPIO.setup(led_pin, GPIO.OUT)

print("Starting LED blink test...")
print("Press CTRL+C to exit.")

try:
    while True:
        GPIO.output(led_pin, GPIO.HIGH)
        time.sleep(0.5) 

        GPIO.output(led_pin, GPIO.LOW)
        time.sleep(0.5) 

except KeyboardInterrupt:
    print("Test stopped by user.")

finally:
    GPIO.cleanup()
    print("GPIO cleanup complete. Exiting.")