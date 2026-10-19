# Band Nine — IELTS Prep Lab

A guided IELTS Academic study app hosted on GitHub Pages.

## Learning flow

Start with Your next session: learn a technique, check understanding, try its exercise, then review feedback and continue.

- 10 guided lessons with original worked examples and matching YouTube videos.
- 6 original Reading sets, 3 Listening sets with playable audio, and a language repair set: 82 practice questions.
- Writing submission grading through Puter / OpenAI (GPT-4.1), with four criteria, quoted evidence, corrections and targeted practice. Every report is linked to its immutable submitted answer.
- Talking-point coaching, transcript language feedback, and recorded/uploaded audio transcription through Puter / OpenAI (`gpt-transcribe`). This transcription route does not grade pronunciation or spoken fluency.
- Band 9 goals for every skill, six advanced practice blocks, annotated examples and revision comparisons.
- First-attempt/repeat separation, error review and externally assessed mock-score tracking.

The site remains on GitHub Pages at its existing URL. Connect the grader with a Puter account, then choose Submit in Writing or Speaking. Puter provides a limited account allowance; usage limits or charges can apply. The app never purchases an upgrade. No Vercel deployment or embedded API key is needed.

Drafts and feedback history stay in the browser. Only deliberately submitted answers/questions or recordings are sent to Puter and its model provider. The third-party SDK loads when Connect/Submit is used. Authentication is managed by Puter, and application backups contain no provider keys. Existing v1 data and backups remain compatible. Use Settings to export regularly; audio stays in the tab and must be downloaded separately.

AI reports are provisional practice estimates, not official or independently calibrated IELTS results. A single task is not the weighted Writing section. Paragraphs and talking points receive no band. Transcripts receive no overall Speaking band, pronunciation or delivery score. Feedback from revised answers is separate from fresh full mock evidence.

Listening clips use computer-generated English voices reading original scripts. They supplement official recordings. Original practice and self-assessment do not establish an official IELTS band.

Run checks with `node --test tests/*.test.mjs`. Provider contract tests use explicit stubs, not real account signup or paid inference. A live model call requires the user's Puter sign-in and available allowance.

Integration references: [Puter chat](https://docs.puter.com/AI/chat/), [speech transcription](https://docs.puter.com/AI/speech2txt/), [account usage](https://docs.puter.com/user-pays-model/). IELTS sources are in `band-nine.mjs` and in the app.
