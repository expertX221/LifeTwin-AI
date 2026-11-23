// Classic ESP32 DevKit and a 3.3 V compatible MAX30102 breakout.
#include <Wire.h>
#include <MAX30105.h>
#include <spo2_algorithm.h>
MAX30105 sensor;
uint32_t irWindow[100], redWindow[100];
uint8_t count25 = 0, phase = 0;
int32_t saturation = 0, rate = 0;
int8_t validOxygen = 0, validRate = 0;
void setup() {
  Serial.begin(115200);
  Wire.begin(21,22);
  if (!sensor.begin(Wire, I2C_SPEED_FAST)) {
    Serial.println("{\"error\":\"MAX30102 unavailable\"}");
    while (true) delay(1000);
  }
  sensor.setup(0x24, 1, 2, 100, 411, 4096);
}
void loop() {
  sensor.check();
  while (sensor.available()) {
    uint32_t ir = sensor.getFIFOIR(), red = sensor.getFIFORed();
    sensor.nextSample();
    // The reference algorithm expects 25 Hz. Keep the USB waveform at 100 Hz.
    if (phase++ % 4 == 0) {
      irWindow[count25] = ir;
      redWindow[count25++] = red;
      if (count25 == 100) {
        maxim_heart_rate_and_oxygen_saturation(irWindow,100,redWindow,&saturation,&validOxygen,&rate,&validRate);
        count25 = 0;
      }
    }
    Serial.printf("{\"sensor\":\"max30102\",\"ts\":%lu,\"ir\":%lu,\"red\":%lu,\"contact\":%s",millis(),ir,red,ir>5000?"true":"false");
    if (validOxygen && saturation>0 && saturation<=100 && ir>5000) Serial.printf(",\"spo2\":%ld",saturation);
    Serial.println("}");
  }
}
