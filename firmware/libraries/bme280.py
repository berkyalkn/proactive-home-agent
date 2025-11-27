from machine import I2C
import time

BME280_I2CADDR = 0x76

class BME280:
    def __init__(self, i2c, address=BME280_I2CADDR):
        self.i2c = i2c
        self.address = address
        self.cal = []
        self._load_calibration()
        self.i2c.writeto(self.address, b'\xF2\x01')
        self.i2c.writeto(self.address, b'\xF4\x27')
        self.i2c.writeto(self.address, b'\xF5\x14')

    def _load_calibration(self):
        dig_88_a1 = self.i2c.readfrom_mem(self.address, 0x88, 26)
        dig_e1_e7 = self.i2c.readfrom_mem(self.address, 0xE1, 7)
        self.cal = []
        self.cal.append((dig_88_a1[1] << 8) | dig_88_a1[0])
        self.cal.append(self._signed16((dig_88_a1[3] << 8) | dig_88_a1[2]))
        self.cal.append(self._signed16((dig_88_a1[5] << 8) | dig_88_a1[4]))
        self.cal.append((dig_88_a1[7] << 8) | dig_88_a1[6])
        self.cal.append(self._signed16((dig_88_a1[9] << 8) | dig_88_a1[8]))
        self.cal.append(self._signed16((dig_88_a1[11] << 8) | dig_88_a1[10]))
        self.cal.append(self._signed16((dig_88_a1[13] << 8) | dig_88_a1[12]))
        self.cal.append(self._signed16((dig_88_a1[15] << 8) | dig_88_a1[14]))
        self.cal.append(self._signed16((dig_88_a1[17] << 8) | dig_88_a1[16]))
        self.cal.append(self._signed16((dig_88_a1[19] << 8) | dig_88_a1[18]))
        self.cal.append(self._signed16((dig_88_a1[21] << 8) | dig_88_a1[20]))
        self.cal.append(self._signed16((dig_88_a1[23] << 8) | dig_88_a1[22]))
        self.cal.append(dig_88_a1[25])
        self.cal.append(self._signed16((dig_e1_e7[1] << 8) | dig_e1_e7[0]))
        self.cal.append(dig_e1_e7[2])
        self.cal.append((dig_e1_e7[3] << 4) | (dig_e1_e7[4] & 0x0F))
        self.cal.append((dig_e1_e7[5] << 4) | (dig_e1_e7[4] >> 4))
        self.cal.append(self._signed8(dig_e1_e7[6]))

    def _signed16(self, x):
        if x > 32767: return x - 65536
        return x

    def _signed8(self, x):
        if x > 127: return x - 256
        return x

    def read_compensated_data(self):
        data = self.i2c.readfrom_mem(self.address, 0xF7, 8)
        pres_raw = (data[0] << 12) | (data[1] << 4) | (data[2] >> 4)
        temp_raw = (data[3] << 12) | (data[4] << 4) | (data[5] >> 4)
        hum_raw = (data[6] << 8) | data[7]
        
        var1 = (temp_raw / 16384.0 - self.cal[0] / 1024.0) * self.cal[1]
        var2 = ((temp_raw / 131072.0 - self.cal[0] / 8192.0) * (temp_raw / 131072.0 - self.cal[0] / 8192.0)) * self.cal[2]
        t_fine = var1 + var2
        temp = t_fine / 5120.0
        
        var1 = (t_fine / 2.0) - 64000.0
        var2 = var1 * var1 * self.cal[5] / 32768.0
        var2 = var2 + var1 * self.cal[4] * 2.0
        var2 = (var2 / 4.0) + (self.cal[3] * 65536.0)
        var1 = (self.cal[2] * var1 * var1 / 524288.0 + self.cal[1] * var1) / 524288.0
        var1 = (1.0 + var1 / 32768.0) * self.cal[0]
        if var1 == 0: pressure = 0
        else:
            pressure = 1048576.0 - pres_raw
            pressure = ((pressure - var2 / 4096.0) * 6250.0) / var1
            var1 = self.cal[8] * pressure * pressure / 2147483648.0
            var2 = pressure * self.cal[7] / 32768.0
            pressure = pressure + (var1 + var2 + self.cal[6]) / 16.0
            
        var_h = t_fine - 76800.0
        var_h = (hum_raw - (self.cal[13] * 64.0 + self.cal[14] / 16384.0 * var_h)) * (self.cal[11] / 65536.0 * (1.0 + self.cal[15] / 67108864.0 * var_h * (1.0 + self.cal[12] / 67108864.0 * var_h)))
        var_h = var_h * (1.0 - self.cal[10] * var_h / 524288.0)
        if var_h > 100: var_h = 100
        elif var_h < 0: var_h = 0
        
        return temp, pressure / 100.0, var_h