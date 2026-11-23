# LifeTwin AI
Heart tracking opens automatically with a clearly labeled 100 Hz demo. Choose USB circuit or Bluetooth watch and press Connect for live acquisition. Disconnect freezes the trace and returns the model to resting scale. The other five tabs provide interactive illustrative controls.

## Run
Use Node 22.13 or later. Run npm install, npm run dev, and open the localhost URL. npm test runs Vitest. npm run build type-checks and builds dist. npm run test:portable runs the same analytics cases with the Node standard library.

## Circuit
Use a **classic ESP32 DevKit** and a MAX30102 **breakout documented for 3.3 V input and 3.3 V I²C logic**. The bare IC requires separate rails. With power off, wire:

| ESP32 | Breakout |
|---|---|
| 3V3 | VIN (3.3 V compatible board only) |
| GND | GND |
| GPIO21 | SDA |
| GPIO22 | SCL |

Use the breakout's onboard I²C pull-ups to 3.3 V. If absent, add one 4.7 kΩ resistor from each bus line to 3.3 V. Install the ESP32 Arduino core and SparkFun MAX3010x Pulse and Proximity Sensor Library. Open firmware/max30102_serial/max30102_serial.ino in Arduino IDE, select your board and port, upload, then close Serial Monitor. Connect in desktop Chrome or Edge on localhost or HTTPS. The two optical channels supply pulse shape and BPM. The firmware emits the reference algorithm's experimental oxygen estimate only when valid. Optical contact thresholds are heuristic and depend on the breakout. No independent motion measurement is available on the starter circuit.

## Watch
Start heart tracking on the watch if required and enable heart-rate broadcasting if available. Choose Bluetooth watch and select the device. The adapter requires the standard BLE Heart Rate Service (0x180D) and notifications on 0x2A37. A name like _FT1383 alone cannot establish compatibility. Watches reporting only BPM can animate the model but supply no raw red/IR waveform or oxygen through this characteristic. No fabricated waveform is shown. Initial pairing, service access, and firmware behavior need verification on the physical device. The app uses only local frontend assets and holds readings in memory.

## Components
src/components/HeartView.tsx composes the monitor and controls. MetricScene.tsx hosts the orbitable scene and animation registry. Waveform.tsx renders the selected channel and marks. src/data/sources.ts defines the common source interface and bounded buffers. src/store/tracking.ts coordinates source changes, freshness, trend and signal trust. src/analytics/bpm.ts contains the pure detector and interval aggregation.

## Add a model
Place a meter-scale, centered GLB in public/models, record its author and license in LICENSES.md, and register its path in HeartView. Extend the Metric union and animations registry, then set the metric range and unit. MetricScene receives metricKey, modelPath, animate and summary. Its frame loop reads live heart rate directly from Zustand. Use a small mesh and a single shared material. The included models can be rebuilt with python tools/models.py.

LifeTwin AI is for personal exploration and education. It is not a medical device and does not diagnose conditions.
