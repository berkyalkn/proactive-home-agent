# =============================================================================
# Description:
# It demonstrates how to read a digital signal from the physical world using a push button.
# The script continuously monitors a GPIO pin and prints a message to the
# console whenever the button is pressed.
#
# Hardware Setup:
# - A push button is connected to GPIO 17 (Physical Pin 11).
# - A 10k Ohm pull-down resistor is used to ensure the pin reads a stable
#   LOW signal when the button is not pressed, preventing "floating" state.
# - The button circuit is powered by a 3.3V pin on the Pi.
# =============================================================================

import RPi.GPIO as GPIO
import time

GPIO.setmode(GPIO.BCM)

button_pin = 17

GPIO.setup(button_pin, GPIO.IN, pull_up_down=GPIO.PUD_DOWN)

print("Starting button read test...")
print("Press the button to see a message. Press CTRL+C to exit.")

try:
    while True:
        if GPIO.input(button_pin) == GPIO.HIGH:
            print("Button Pressed!")
            time.sleep(0.5)
        time.sleep(0.01) 

except KeyboardInterrupt:
    print("Test stopped by user.")

finally:
    GPIO.cleanup()
    print("GPIO cleanup complete. Exiting.")