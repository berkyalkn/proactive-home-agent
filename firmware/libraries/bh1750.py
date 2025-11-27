import time

class BH1750():
    PWR_OFF = 0x00
    PWR_ON = 0x01
    RESET = 0x07
    
    CONTINUOUS_HIGH_RES_MODE_1 = 0x10
    CONTINUOUS_HIGH_RES_MODE_2 = 0x11
    CONTINUOUS_LOW_RES_MODE = 0x13
    ONCE_HIRES_1 = 0x20
    ONCE_HIRES_2 = 0x21
    ONCE_LOWRES = 0x23

    def __init__(self, bus, address=0x23):
        self.bus = bus
        self.address = address
        self.off()
        self.reset()

    def off(self):
        self.set_mode(self.PWR_OFF)

    def on(self):
        self.set_mode(self.PWR_ON)

    def reset(self):
        self.on()
        self.set_mode(self.RESET)

    def set_mode(self, mode):
        self.mode = mode
        self.bus.writeto(self.address, bytes([self.mode]))

    def luminance(self, mode):
        if mode & 0x10 and mode != self.mode:
            self.set_mode(mode)
        if mode & 0x20:
            self.set_mode(mode)
        time.sleep_ms(24 if mode in (0x13, 0x23) else 180)
        data = self.bus.readfrom(self.address, 2)
        factor = 2.0 if mode in (0x11, 0x21) else 1.0
        return (data[0] << 8 | data[1]) / (1.2 * factor)