# =============================================================================
# Description:
# This script combines the concepts of GPIO input and output to create a
# fundamental "reflex" circuit. It continuously reads the state of a push
# button and mirrors that state to an LED. When the button is pressed, the
# LED turns on; when it's released, the LED turns off. This demonstrates
# the core event-action loop of any automation project.
#
# Hardware Setup:
# - An LED circuit is connected to GPIO 27.
# - A push button circuit (with a pull-down resistor) is connected to GPIO 17.
# - This script controls both circuits simultaneously.
# =============================================================================

import RPi.GPIO as GPIO
import time

GPIO.setmode(GPIO.BCM)

led_pin = 27
button_pin = 17

GPIO.setup(led_pin, GPIO.OUT)
GPIO.setup(button_pin, GPIO.IN, pull_up_down=GPIO.PUD_DOWN)

print("Starting button-to-LED reflex test...")
print("Press and hold the button to light up the LED. Press CTRL+C to exit.")

GPIO.output(led_pin, GPIO.LOW)

try:
    while True:
        if GPIO.input(button_pin) == GPIO.HIGH:
            GPIO.output(led_pin, GPIO.HIGH) 
        else:
            GPIO.output(led_pin, GPIO.LOW) 

        time.sleep(0.02) 

except KeyboardInterrupt:
    print("\nTest stopped by user.")

finally:
    GPIO.cleanup()
    print("GPIO cleanup complete. Exiting.")