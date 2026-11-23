# Lifetime AI • Browser agent and hardware architecture

## Application boundaries

| Module | Responsibility | Inputs and outputs |
|---|---|---|
| app and Navbar | Next.js App Router, accessible navigation and Vital Green tokens | Landing, dashboard, studio and assistant routes |
| src/data | Demo, Web Serial and Bluetooth adapters | Timestamped PPG or heartbeat measurements tagged by source |
| src/store and analytics | Bounded signal buffers, quality gates, peak detection | Accepted BPM, quality, fresh samples and trending window |
| src/components/MetricScene | Reference geometry, surface shader and animation | Current BPM to regional cardiac deformation. Lung/brain controls are illustrative |
| src/agent/engine | Unicode normalization, language selection, safety-first triage, evidence selection and rendering | Constrained localized responses, explicit insufficient-data state |
| src/agent/actions | AJV-validated tool arguments, confirm-before-write UI, user-owned storage | Dated logs, experiment plans, check-in entries, editable memory and JSON export |
| src/components/Circuit | Pin editor and supported starter-design validator | Valid netlist enables synthetic PPG test and matching firmware |
| firmware | ESP32 acquisition and embedded reference algorithm | Red/IR at 100 Hz, quality and oxygen when valid |

## Data lifecycle

Device selection requires a user gesture. USB and Bluetooth remain browser-local. Live tracking uses bounded RAM. The assistant reads the approved record ledger separately. It never quietly promotes demo telemetry or speech to a personal fact. Record labels and metrics live in the current browser's localStorage; browser data clearing removes them. Anyone with access to this browser profile may be able to read them. Export is a user-triggered local JSON download.

Agent flow: normalize text → check all six languages for urgent expressions → apply the selected region's emergency template → otherwise detect a medical-advice request → clinician template; for supported data requests, reread approved records → reject low-trust records → require three distinct dates → compute mean, count, range and confidence → render from those fields. Free text from records is never inserted into a medical reply. Emergency handling takes priority over chart questions. Region choice is independent of language. India, US and UK have configured emergency numbers. Unknown regions use local emergency services without guessing a number.

The deterministic renderer is the authority for numerical claims. It calculates from the selected rows in the same turn. Its supported insight is an arithmetic mean, with evidence and sample-quality labels. A future correlation tool needs aligned pairs, lag definition, variability handling, effect-size calculation and sample counts. The confidence labels are heuristics, not calibrated clinical probabilities.

## Hardware studio workflow

Supported request: optical pulse and oxygen monitor on classic ESP32 using a 3.3 V compatible MAX30102 breakout. The starter maps VIN/GND/SDA/SCL to 3V3/GND/21/22. The editor validates each wire against that board profile. The test runs the same pure waveform analyzer against 1,000 synthetic samples and compares the detected rate to the fixture's expected 75 BPM. Passing this authorizes export of the matching prewritten sketch; it does not establish that any board was flashed or that its oxygen measurement is accurate.

Physical test: confirm breakout documentation, disconnect power, check continuity and shorts, connect USB, flash the Arduino sketch, close Serial Monitor, connect the browser, inspect timestamps, raw channels, contact loss, disconnect and reconnect. Require real observations for a physical-pass label. The starter's breakout rail assumptions must never be applied to the bare IC. Keep firmware flashing manual.

## Optional offline model workstation

| Capability | Download / install | Execution and constraints |
|---|---|---|
| Small instruction model | Install [Ollama](https://ollama.com/download) and run ollama pull qwen2.5:0.5b. Alternative: build [llama.cpp](https://github.com/ggml-org/llama.cpp) and load a compatible GGUF. | Open-source runtimes and downloadable weights. Benchmark the 0.5B candidate first, then 1.5B. No measured minimum-size claim. |
| Browser inference | Install [WebLLM](https://github.com/mlc-ai/web-llm) via npm install @mlc-ai/web-llm or [Transformers.js](https://huggingface.co/docs/transformers.js) via npm install @huggingface/transformers. | Local inference after weight download. Bind WebGPU in a worker and let users opt in to the download. Retain the deterministic route on CPU-only devices. |
| Retrieval | pip install sentence-transformers; download [multilingual-e5-small](https://huggingface.co/intfloat/multilingual-e5-small) into a local folder. | Prefix inputs with query: and passage:. Retrieve record IDs, then recheck the SQL/ledger values and current approval. Delete vectors when their records are deleted. |
| Speech recognition | Build [whisper.cpp](https://github.com/ggml-org/whisper.cpp) using CMake; use its multilingual base or small model. Alternative: pip install [faster-whisper](https://github.com/SYSTRAN/faster-whisper). | Multilingual weights rather than English-only variants. Run locally on consented audio. Show editable transcript before routing it. Test actual Indic speech and noisy microphones. |
| Local speech playback | Browser speechSynthesis voices with localService=true. Optional [Coqui TTS](https://github.com/coqui-ai/TTS) via its installation instructions. | Use only installed offline voices. Check the individual voice model license and language coverage. |
| Translation | Clone [IndicTrans2](https://github.com/AI4Bharat/IndicTrans2) and download English–Indic and Indic–English checkpoints per repository instructions. | Separate code/weight terms. If the checkpoint requires an account, keep packaged templates for the keyless path. Preserve BPM, SpO₂, units and dates as placeholders, then restore and validate. |
| Linguistic preprocessing | Install [Indic NLP Library](https://github.com/anoopkunchukuttan/indic_nlp_library) with its resources and [spaCy](https://spacy.io/usage) with pip. | Normalize before matching. Retain original text for the safety route. Never assume an English spaCy pipeline covers all six languages. |
| Typography | Download matching families from [Noto Fonts](https://notofonts.github.io/) and self-host the WOFF2 files with their license. | SIL Open Font License. Current release uses the OS script fallback. |
| UI and evaluation | npm install installs Next, React, Tailwind, Lucide, Framer Motion, Zustand, Recharts, AJV, i18next bindings and Vitest. pip install pytest in a local virtual environment. | No API keys. Run npm test and python -m pytest evaluation. |

Model extensions are optional installation paths. Their weights are not bundled with this deployment. A local model may propose a tool and arguments; it must never select an emergency number, write directly, invent evidence, or deliver unrestricted medical text. Validate schema → show exact change → user confirms → apply once → refresh ledger. Schedule entries currently store a date; background notifications require a separate consented delivery mechanism.

## Evaluation contract

evaluation/messages.json contains 50 labeled cases per language, generated from ten distinct base questions and five prefixes per language. Coverage includes emergency, data, general help and diagnostic/medication requests. Vitest executes the actual router and renderer. It checks exact emergency/clinician replies, language detection, the dates/count/metric/mean in supported answers and missing evidence handling. The constrained emergency/medical responses cannot contain an added diagnosis and still pass. Numbers in the fixture are compared to the known source records. These tests detect regressions in this fixed corpus. Curate independent native-speaker, dialect, Romanized, typo, negation and speech-transcription sets before relying on safety recall in the wild.

Emergency references: [India ERSS](https://112.gov.in/), [US National 911 Program](https://www.911.gov/), [UK emergency numbers](https://www.gov.uk/guidance/999-and-112-the-uks-national-emergency-numbers).

WebGPU is available in the inference selector. Its optional same-origin adapter loads WebLLM only after selection and a submitted message. The first use fetches the open Qwen weights and runtime library; prompts are processed locally. Model download or unsupported GPU errors fall back to rules. The region selector initially displays India for this hackathon audience. Verify it when traveling.
