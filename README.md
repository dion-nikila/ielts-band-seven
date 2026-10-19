# Band Nine — IELTS Prep Lab

A guided IELTS Academic study app hosted on [GitHub Pages](https://dion-nikila.github.io/ielts-band-seven/), with direct Google Gemini feedback through a private companion grader.

## Learning flow

Start with Your next session: learn a technique, check understanding, try its exercise, then review feedback and continue.

- 10 guided lessons with original worked examples and matching YouTube videos.
- 6 original Reading sets, 3 Listening sets with playable audio, and a language repair set: 82 practice questions.
- Writing feedback against all four criteria, with quoted evidence, corrections, priorities and targeted practice. Every report stays linked to its exact submitted answer.
- Speaking audio assessment of an actual recorded or uploaded sample, alongside separate talking-point coaching and checked-transcript language feedback.
- Band 9 goals for every skill, six advanced practice blocks, annotated examples and revision comparisons. Unchanged answer text is not treated as evidence of progress.
- First-attempt/repeat separation, error review and externally assessed mock-score tracking.

## Connect Gemini

Choose **Open private grader** in Writing or Speaking. In the [private companion window](https://ielts-gemini-grader-dion.hf5r5r9j8h.chatgpt.site/), sign in if asked and add a Google AI Studio API key once. Enter the key only in that private setup, never in chat, GitHub, a submitted answer or an app backup. The public GitHub Pages app receives grading reports, not the key. The study link stays the same and changing the provider does not require resetting browser data.

The integration uses Google's available free-tier quota. Availability and rate limits depend on the model, project and region. There is no automatic switch to a paid provider or purchase of a quota upgrade. A key attached to a billing-enabled Google project follows that project's billing configuration, so use a free-tier project if you want free-tier-only access.

A submission sends its question and answer, or the actual audio sample, to Google Gemini through the companion. Google may use unpaid-tier submissions and responses to improve its products; regional and billing-related exceptions are described in its terms. Keep personal or sensitive details out of practice submissions.

## Saved work and grading limits

Drafts, notes, progress and feedback history stay in this browser on this device. They do not automatically sync. Existing v1 data and valid backups remain compatible. Export a backup in Settings regularly; clearing browser data can erase the local copy. Audio stays in the current tab and must be downloaded separately. Assessment history retains recording duration metadata, not the audio itself.

AI reports are provisional practice estimates, not official or independently calibrated IELTS results. A single Writing task is not the weighted Writing section. Paragraphs and talking points receive no band. A checked transcript can support vocabulary and grammar feedback but cannot establish pronunciation, spoken fluency or an overall Speaking band. Audio can support provisional estimates from what is audible in that particular sample; it is not the full three-part Speaking test. Feedback on revised answers remains separate from fresh full-mock evidence.

Listening clips use computer-generated English voices reading original scripts. They supplement official recordings. Original practice and self-assessment do not establish an official IELTS band.

## Checks and references

Run `node --test tests/*.test.mjs`. Transport and provider-contract tests use explicit stubs; they do not create an account, submit a real API key or consume model quota. A real grading call requires the user's private companion setup and available Gemini quota.

Google references: [API key setup](https://ai.google.dev/gemini-api/docs/api-key), [free-tier pricing](https://ai.google.dev/gemini-api/docs/pricing), [rate limits](https://ai.google.dev/gemini-api/docs/rate-limits), and [data terms](https://ai.google.dev/gemini-api/terms). IELTS sources are in `band-nine.mjs` and in the app.
