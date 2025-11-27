from machine import Pin

class PIR:
    def __init__(self, pin_number):
        self.pin = Pin(pin_number, Pin.IN)
    
    def motion_detected(self):
        return self.pin.value() == 1