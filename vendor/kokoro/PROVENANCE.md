# Self-hosted Kokoro browser synthesis

- `kokoro.web.js`: unmodified published `kokoro-js` 1.2.1 browser bundle, downloaded from https://registry.npmjs.org/kokoro-js/-/kokoro-js-1.2.1.tgz . Apache-2.0; license included.
- WASM/MJS: bundled ONNX Runtime Web from `@huggingface/transformers` 3.5.1 `dist/ort-wasm-simd-threaded.jsep.*`, downloaded from https://registry.npmjs.org/@huggingface/transformers/-/transformers-3.5.1.tgz . Apache-2.0 Transformers license included; ONNX Runtime MIT license below.
- Model/tokenizer/voices: `onnx-community/Kokoro-82M-v1.0-ONNX` revision `1939ad2a8e416c0acfeecc08a694d14ef25f2231` at https://huggingface.co/onnx-community/Kokoro-82M-v1.0-ONNX . Kokoro model Apache-2.0; quantized `onnx/model_quantized.onnx`, `af_heart` and `am_michael` only.
- Runtime and model files are split into 16 MiB binary chunks to fit static hosting file limits. `model/chunks.json` and `wasm/chunks.json` record original and per-part SHA-256/length. `scripts/package-kokoro-assets.mjs` reproduces packaging from downloaded originals.
- No learner text is sent to third-party services. Model/voice reads are explicitly mapped to these same-origin assets. Inference runs in a dedicated local Web Worker via WASM; generated WAV audio is 24 kHz mono, 16 bit, speed 0.9.
- This is synthesized Kokoro audio, not a teacher recording. Quantization and browser hardware can affect latency; no human pronunciation audit is claimed.

The Kokoro browser bundle includes `phonemizer` 1.2.1 (Apache-2.0 wrapper, license retained) using embedded eSpeak NG. eSpeak NG is GPL-3.0-or-later; its license is retained separately. Corresponding upstream phonemizer implementation and build source: https://github.com/xenova/phonemizer.js ; eSpeak NG source: https://github.com/espeak-ng/espeak-ng . No modifications to the vendored Kokoro bundle were made.
