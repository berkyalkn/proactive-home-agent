# =============================================================================
# Description:
# This script serves as a fundamental test for sensor-based automation.
# It reads input from an HC-SR501 PIR motion sensor and controls an LED
# based on the detected motion state.
#
# The logic is stateful, meaning the LED is only turned on or off when
# a *change* in the motion state is detected (i.e., when motion starts
# or when it stops). This prevents constant re-triggering and provides
# a clean, real-time response.
#
# Hardware Setup:
# - An LED is connected to GPIO 17 via a 330 Ohm current-limiting resistor.
# - An HC-SR501 PIR motion sensor's OUT pin is connected to GPIO 4.
# - This script uses the 'lgpio' library, which is the modern standard
#   for GPIO control on the Raspberry Pi 5.
# =============================================================================


import lgpio
import time

led_pin = 17
pir_pin = 4

h = None

try:
    h = lgpio.gpiochip_open(0)
    
    lgpio.gpio_claim_input(h, pir_pin, lgpio.SET_PULL_DOWN)
    lgpio.gpio_claim_output(h, led_pin)

    print("Real-time motion sensor activated... (Press CTRL+C to exit)")
    print("----------------------------------------------------------")

    led_is_on = False  
    lgpio.gpio_write(h, led_pin, 0) 

    print("Sensor is stabilizing, please wait 10 seconds...")
    time.sleep(10)
    print("Sensor ready. Awaiting motion.")

    while True:
        motion_detected = lgpio.gpio_read(h, pir_pin)

        if motion_detected and not led_is_on:
            print("Motion Started! -> LED ON")
            lgpio.gpio_write(h, led_pin, 1) 
            led_is_on = True 

        elif not motion_detected and led_is_on:
            print("Motion Stopped! -> LED OFF")
            lgpio.gpio_write(h, led_pin, 0) 
            led_is_on = False 
        
        time.sleep(0.1)

except KeyboardInterrupt:
    print("\nProgram terminated by user.")

finally:
    if h is not None:
        print("Exiting program... Turning LED off and cleaning up pins.")
        lgpio.gpio_write(h, led_pin, 0)
        
        lgpio.gpio_free(h, led_pin)
        lgpio.gpio_free(h, pir_pin)
        
        lgpio.gpiochip_close(h)
        print("GPIO cleanup complete.")