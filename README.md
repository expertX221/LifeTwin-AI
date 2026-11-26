# Lifetime AI
Heart tracking opens automatically with a clearly labeled 100 Hz demo. Choose USB circuit or Bluetooth watch and press Connect for live acquisition. Disconnect freezes the trace and returns the model to resting scale. Lungs and Brain offer illustrative controls.

[Full foundation, architecture, evaluation and organ production handbook](docs/README.md)

## Run
Use Node 22.13 or later. Run npm install, npm run dev, and open the localhost URL. npm test runs Vitest. npm run build type-checks and builds the Next.js production app. npm run test:portable runs the same analytics cases with the Node standard library.

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
Choose **Bluetooth watch** and connect from desktop Chrome or Edge on this HTTPS site. LifeTwin reads standard Bluetooth heart-rate, Pulse Oximeter (SpO₂), and Physical Activity Monitor sleep services when the watch exposes them. The 38136PP03K is listed by Fastrack as the Jupiter S1 and has Bluetooth connectivity; its charging cable is not a data path for browser health readings. A model name or Bluetooth visibility alone cannot establish that firmware exposes these standard services. If the browser reports no compatible services, keep using Fastrack Smart World and use a supported phone-health sync or export path. Only metrics actually received are shown; no values are fabricated.

Live readings currently stay in the open browser session and are not saved to a cloud database. A physical device test is still needed to confirm which Bluetooth services this particular watch firmware exposes. Standard Bluetooth heart-rate readings do not include the raw red/IR waveform. The app is for personal exploration and education, not a medical device and does not diagnose conditions.

## Android Health Connect sync
The Dashboard includes an encrypted phone-sync panel. The Android companion reads only heart rate, oxygen saturation and sleep records after the user grants those Health Connect permissions. It encrypts a compact latest-reading snapshot on the phone with a per-pair key; the server stores only ciphertext. The dashboard decrypts it in the browser. `migrations/001_health_connect_sync.sql` creates the Neon table, and the deployment needs a `DATABASE_URL` environment variable.

To install the companion, download the `lifetwin-health-sync-debug` artifact from the GitHub Actions run named **Build Android health sync app**. On the dashboard choose **Pair Android phone**, scan its QR in **LifeTwin Health Sync** on Android, then grant the three requested Health Connect permissions. Keep the companion open for updates every 30 seconds. If Health Connect offers and grants background access, Android also checks about every 15 minutes. Fastrack Smart World must sync the watch records into Health Connect first; the website shows the source measurement timestamps, and cannot receive a measurement before that sync occurs.

## Components
src/components/HeartView.tsx composes the monitor and controls. MetricScene.tsx hosts the orbitable scene and animation registry. Waveform.tsx renders the selected channel and marks. src/data/sources.ts defines the common source interface and bounded buffers. src/store/tracking.ts coordinates source changes, freshness, trend and signal trust. src/analytics/bpm.ts contains the pure detector and interval aggregation.

## Add a model
Place a meter-scale, centered GLB in public/models, record its author and license in LICENSES.md, and register its path in HeartView. Extend the Metric union and animations registry, then set the metric range and unit. MetricScene receives metricKey, modelPath, animate and summary. Its frame loop reads live heart rate directly from Zustand. Use a small mesh and a single shared material. The included models can be rebuilt with python tools/models.py.

Lifetime AI is for personal exploration and education. It is not a medical device and does not diagnose conditions.
