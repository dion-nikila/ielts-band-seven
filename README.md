# Band Nine — IELTS Prep Lab

A free IELTS Academic study app on [GitHub Pages](https://dion-nikila.github.io/ielts-band-seven/). The study app and its on-device coaching need no account, API key or paid service.

## Practice and feedback

- Ten guided lessons, worked examples and matching YouTube videos.
- Sixteen Reading sets (including two 40-question, 60-minute simulations), nine Listening sets with playable audio, and a language repair set: 286 distinct original practice questions.
- Strict short-answer word/number rules, explicit rejection reasons, versioned scores and automatic submission when a full Reading clock expires.
- A Score validation page with an internal question audit and observed ranges from distinct, recent official tests under reported exam conditions; it does not invent expected bands.
- A dedicated practice bank with skill filters, unopened-only filtering, saved unfinished attempts, passage navigation, answer explanations and reopening previous reviews.
- Writing drafts, quick pattern checks, optional local AI coaching, quoted corrections and revision comparisons.
- Speaking recording and playback, optional local transcription, then coaching on a checked transcript or talking points.
- Band 9 goals in every skill, advanced practice blocks, mistake review and fresh full-mock tracking.

## Immediate review and optional local AI

Writing and transcript reviews work immediately, without downloading an AI model. They use explicit, limited language-pattern checks and rubric prompts for your own review. A clean result is not evidence of complete grammatical accuracy or task fulfilment.

## Enable optional local AI

Choose **Enable on-device AI** in Writing or Speaking. It explicitly downloads the public Qwen3 1.7B model (about 968 MB of weights, roughly 1.1 GB with runtime files) into browser cache. It needs WebGPU and sufficient memory; a current desktop Chrome or Edge browser is recommended. The app does not download the model on startup. Unload AI releases its memory; downloaded files may remain cached. Reloading the page requires opening the cached model again. Cache eviction may require another download.

Your submitted text is processed in a Web Worker on the device, without a remote inference API. Model files come from public Hugging Face, jsDelivr and the official MLC model library. No student answer is included in those download requests. The model is a small, uncalibrated coach. It can offer one optional sentence-level phrasing alternative, **not a holistic IELTS judgement or band**. Source sentence IDs guarantee that its displayed quotation comes from your answer. Other criteria are explicit prompts for your own review, not model assessments. A separate set of limited, labelled pattern checks catches some common agreement, modal and uncountable-noun issues. Revision comparisons show those covered patterns without treating the count as overall grammar accuracy. Every quotation must match the submitted answer; unsupported quotations are removed and disclosed. Review corrections carefully because suggestions can still be wrong.

Lessons, quick language checks, model answers and progress tracking remain usable without the AI model. The site needs an initial network connection for its practice library; this is not a fully offline-installed application.

## Speaking

Record up to two minutes or choose an audio file. **Make a transcript on this device** downloads the pinned Whisper Tiny English model and runtime on first use (about 70 MB). It uses a local CPU worker, with no recording upload. Listen back and correct the editable transcript. Choosing **I checked this — use transcript** replaces that question's typed answer; reviewing it is a separate step. No pronunciation, spoken fluency or Speaking band is inferred from a transcript. Audio recognition can be inaccurate, especially with background noise, accents or silence.

## Saved work and measurement

Drafts, notes, progress and feedback stay in this browser on this device. They do not automatically sync. Existing v1 backups and valid earlier AI reports remain compatible. Earlier provider estimates retain their original labels; they are not relabelled as local results. Export a backup regularly. Clearing browser data can erase both work and model caches. Audio stays only in the current tab and must be downloaded separately.

Measure bands using fresh full tests, their answer keys and qualified assessment. Original simulations and mini drills show item accuracy; repeated answers and AI report variation do not establish progress or a band. Listening clips use computer-generated voices reading original scripts, alongside links to official recordings. The app has not been independently validated as an IELTS intervention.

## Development

Run `node --test tests/*.test.mjs`. Worker lifecycle and report tests use explicit stubs; they never fabricate a successful live model run. Browser checks separately establish supported startup and actual inference where available. All browser module URLs carry a release version to prevent mixing cached contracts. The old cloud adapters remain unused for compatibility/reference; the active app does not open a private grader or request a cloud key.

References: [WebLLM](https://webllm.mlc.ai/docs/), [Qwen3 1.7B model](https://huggingface.co/mlc-ai/Qwen3-1.7B-q4f16_1-MLC), [Transformers.js](https://huggingface.co/docs/transformers.js), [Whisper Tiny English](https://huggingface.co/Xenova/whisper-tiny.en). Official IELTS sources are linked in the app.

See [the content and scoring audit](QUESTION-AUDIT.md) for changes, official references and the limits of internal checks. Original questions have not been independently calibrated.
