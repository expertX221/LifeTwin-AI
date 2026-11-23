# Lifetime AI foundation

| Deliverable | Complete source |
|---|---|
| App Router shell and navigation | [layout](../app/layout.tsx), [Navbar](../src/components/Navbar.tsx) |
| Visual system | [Tailwind tokens](../tailwind.config.ts), [global styles](../app/globals.css) |
| Landing, dashboard, studio and agent | [landing](../app/page.tsx), [dashboard](../app/dashboard/page.tsx), [studio](../app/studio/page.tsx), [agent](../app/agent/page.tsx) |
| Agent design, hardware workflow and optional local installations | [Architecture](ARCHITECTURE.md) |
| Model downloads, authoring workflow, organ briefs, shading and export | [Anatomy production toolkit](ANATOMY.md) |
| Validation | [Labeled evaluation messages](../evaluation/messages.json), [agent tests](../src/agent/evaluation.test.ts), [dataset integrity](../evaluation/test_dataset.py) |

## Try a full demo

Open Dashboard to see the source label, BPM, oxygen and trust state. Inspect each organ. Open Hardware Studio, generate an ESP32 pulse-plus-oxygen design, clear a wire, observe the validation failure, restore the starter, run its synthetic test, and download the firmware. In Aether add three dated BPM records with your own quality estimate and approve each change. Ask for the average. Check the date range against the ledger. Delete a record, ask again and observe the insufficient-data response.

## Optional local inference, speech and memory retrieval

Install Ollama and download qwen2.5:0.5b. On the computer running the browser, allow only your exact Lifetime AI origin in OLLAMA_ORIGINS, restart Ollama, and enable the local classifier in Aether. Browser local-network permission may be required. Requests carry only the submitted message. Parsing accepts only four intent labels. No model text is shown to the user. If the local runtime is unavailable, the deterministic router remains operational.

For local transcription install faster-whisper in a Python environment, download a compatible multilingual CTranslate2 Whisper checkpoint, then run python tools/offline.py transcribe MODEL_DIR recording.wav --language te. Review the printed transcript before pasting it into Aether. For memory search install sentence-transformers, download multilingual-e5-small and run python tools/offline.py retrieve MODEL_DIR exported-records.json "bedtime". The helper returns approved memory IDs and dates for manual inspection. Both commands require predownloaded weights and disable network model loading.
For optional offline note translation, install torch, transformers, sentencepiece, spacy and indic-nlp-library. Download facebook/nllb-200-distilled-600M from https://huggingface.co/facebook/nllb-200-distilled-600M and review its CC BY-NC 4.0 weight license for your use. Run python tools/translate_notes.py MODEL_DIR en te "My BPM record". The helper protects metric symbols and numerical tokens. Safety templates use reviewed fixed text independent of translation. Native-speaker review remains necessary.
