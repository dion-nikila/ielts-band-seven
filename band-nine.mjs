// Official sources support the assessment summaries and test facts below.
// Sessions, examples and readiness checks are original coaching suggestions.
// A practice target is not an IELTS result or a promise of a particular score.

export const bandNineSources = [
  { id: 'writing-descriptors', title: 'IELTS Writing band descriptors', url: 'https://ielts.org/cdn/ielts-guides/ielts-writing-band-descriptors.pdf', checked: '2026-10-19' },
  { id: 'speaking-descriptors', title: 'IELTS Speaking band descriptors', url: 'https://ielts.org/cdn/ielts-guides/ielts-speaking-band-descriptors.pdf', checked: '2026-10-19' },
  { id: 'scoring', title: 'IELTS scoring in detail', url: 'https://ielts.org/take-a-test/your-results/ielts-scoring-in-detail', checked: '2026-10-19' },
  { id: 'listening-conversion', title: 'IDP IELTS Listening score guide', url: 'https://ielts.idp.com/thailand/results/scores/listening', checked: '2026-10-19' },
  { id: 'reading-conversion', title: 'IDP IELTS Academic Reading score guide', url: 'https://ielts.idp.com/vietnam/results/scores', checked: '2026-10-19' },
  { id: 'official-practice', title: 'Free official IELTS Academic practice', url: 'https://ielts.org/take-a-test/preparation-resources/sample-test-questions/academic-test', checked: '2026-10-19' },
  { id: 'academic-writing', title: 'IELTS Academic Writing format', url: 'https://ielts.org/take-a-test/test-types/ielts-academic-test/ielts-academic-format-writing', checked: '2026-10-19' }
];

export const bandNineTarget = {
  title: 'Band 9 in every skill',
  skillTargets: { Listening: 9, Reading: 9, Writing: 9, Speaking: 9 },
  description: 'Aim for precise understanding and clear, flexible English across unfamiliar tasks. Use feedback to fix one weakness, then test it on a different prompt.',
  expectation: 'Band 9 is an ambitious expert-level goal. Your starting level and performance on fresh full tests determine the work ahead; completing a week or a lesson path does not establish readiness.',
  nextStep: 'Submit an unaided first attempt, inspect the evidence behind the feedback, revise once, then try a fresh task.',
  sourceIds: ['scoring']
};

export const bandNineCriteria = {
  writingTask1: [
    { id: 'taskAchievement', title: 'Task achievement', goal: 'Satisfy the visual task completely and accurately, with only exceptionally rare content slips.' },
    { id: 'coherence', title: 'Coherence and cohesion', goal: 'Make the organisation effortless to follow, with skilful paragraphs and unobtrusive connections.' },
    { id: 'vocabulary', title: 'Lexical resource', goal: 'Choose precise, natural vocabulary flexibly; spelling and word-formation slips should be exceptionally rare.' },
    { id: 'grammar', title: 'Grammatical range and accuracy', goal: 'Use varied structures with consistent control, accurate punctuation and exceptionally rare minor errors.' }
  ],
  writingTask2: [
    { id: 'taskResponse', title: 'Task response', goal: 'Explore the exact question deeply, sustaining a fully developed position with relevant, thoroughly supported ideas.' },
    { id: 'coherence', title: 'Coherence and cohesion', goal: 'Let readers follow the reasoning effortlessly, with skilful paragraphs and natural connections.' },
    { id: 'vocabulary', title: 'Lexical resource', goal: 'Express distinctions precisely with flexible, natural vocabulary and exceptionally rare word-choice or spelling slips.' },
    { id: 'grammar', title: 'Grammatical range and accuracy', goal: 'Control a wide range of structures and punctuation; minor errors should be exceptionally rare.' }
  ],
  speaking: [
    { id: 'fluency', title: 'Fluency and coherence', goal: 'Develop relevant answers smoothly and coherently; occasional hesitation should concern ideas rather than searching for language.' },
    { id: 'vocabulary', title: 'Lexical resource', goal: 'Use vocabulary precisely and flexibly, with natural idiomatic expression across topics.' },
    { id: 'grammar', title: 'Grammatical range and accuracy', goal: 'Control varied structures precisely, allowing only slips typical of natural speech.' },
    { id: 'pronunciation', title: 'Pronunciation', goal: 'Remain effortless to understand, using connected speech, stress and intonation flexibly to convey meaning. A particular accent is not required.' }
  ]
};

export const bandNineSkills = [
  {
    id: 'listening', skill: 'Listening', target: 9, href: '#drills', actionLabel: 'Practise listening',
    goal: 'Track detail, speaker intention and changes of mind through unfamiliar recorded English.',
    benchmark: 'Use 39–40/40 on fresh full official Listening practice as a demanding training benchmark. Published conversions are indicative and vary by test version.',
    evidence: 'Keep the first-play result, recording source and mistake types. A perfect short app set measures that set only.',
    checklist: [
      'Read the answer limit and predict the information type before the audio starts.',
      'After marking, identify the exact phrase that supports each answer and the phrase that made a distractor tempting.',
      'Separate a missed meaning from a spelling, plural, word-limit or lost-place error.',
      'Replay for learning, then measure again with an unheard recording.'
    ],
    sourceIds: ['listening-conversion', 'scoring', 'official-practice']
  },
  {
    id: 'reading', skill: 'Reading', target: 9, href: '#drills', actionLabel: 'Practise reading',
    goal: 'Resolve exact claims, paragraph purpose and implied relationships without adding outside assumptions.',
    benchmark: 'Use 39–40/40 on fresh full official Academic Reading practice as a demanding training benchmark. The raw-to-band conversion can differ by test version.',
    evidence: 'Record the first timed result and evidence for uncertain answers. Recalled answers from a repeated passage cannot show fresh-test readiness.',
    checklist: [
      'Underline the restriction in a claim: only, most, before, more than, or a cause.',
      'For every close option, state the difference and find evidence that resolves it.',
      'Explain both why the correct option fits and why your strongest alternative fails.',
      'Practise a new passage after reviewing the error; compare accuracy and time.'
    ],
    sourceIds: ['reading-conversion', 'scoring', 'official-practice']
  },
  {
    id: 'writing', skill: 'Writing', target: 9, href: '#writing', actionLabel: 'Write and get feedback',
    goal: 'Meet the four assessment criteria together. Vocabulary and length cannot compensate for incomplete reasoning or inaccurate data.',
    criteria: bandNineCriteria.writingTask2,
    benchmark: 'Build evidence from fresh, timed Task 1 and Task 2 answers, followed by targeted revision and independent feedback.',
    evidence: 'AI feedback is a provisional practice estimate for the submitted answer. A single task estimate is not a full Writing result; Task 2 carries twice the weight of Task 1.',
    checklist: [
      'Before drafting, name every instruction and write your answer to it in one sentence.',
      'For Task 1, check every figure, unit, comparison and overall feature against the visual.',
      'For Task 2, test each main claim: why is it true, under what conditions, and how does it answer this question?',
      'Revise one quoted weak passage, explain the improvement, then use the same skill on a new prompt.'
    ],
    sourceIds: ['writing-descriptors', 'academic-writing', 'scoring']
  },
  {
    id: 'speaking', skill: 'Speaking', target: 9, href: '#speaking', actionLabel: 'Speak and get feedback',
    goal: 'Develop spontaneous answers clearly and precisely while staying easy to understand.',
    criteria: bandNineCriteria.speaking,
    benchmark: 'Practise unfamiliar questions across Parts 1, 2 and 3. Review actual recordings and check that improvements transfer to a fresh question.',
    evidence: 'Talking points can receive idea-development feedback. A transcript cannot establish pronunciation or delivery; a short recording cannot establish a complete Speaking band.',
    checklist: [
      'Answer the question directly, then develop it with a reason, concrete detail or qualification.',
      'Listen to a recording before reading the transcript. Mark where a listener may lose the thread.',
      'Replay one unclear phrase; practise its stress and grouping, then answer again in your own words.',
      'Use fresh follow-up questions to test flexibility rather than memorising a polished speech.'
    ],
    sourceIds: ['speaking-descriptors', 'official-practice']
  }
];

export const bandNineSessions = [
  {
    id: 'reading-evidence-audit', skill: 'Reading', title: 'Audit the last two choices', minutes: 18,
    href: '#drills', actionLabel: 'Open reading practice',
    task: 'Use one unattempted passage. On each uncertain item, note your strongest two choices and the exact difference between them before submitting.',
    steps: ['Attempt under the set timer without help.', 'Mark the answers and locate the decisive sentence or missing fact.', 'Write one sentence explaining why the tempting alternative fails.'],
    review: ['Did I confuse a missing fact with a contradiction?', 'Did I change a cautious claim into an absolute one?', 'Which fresh question will test the same distinction?'],
    successEvidence: 'The explanation uses passage evidence, and the same mistake does not recur on a different passage.',
    sourceIds: ['official-practice']
  },
  {
    id: 'listening-distractor-audit', skill: 'Listening', title: 'Hear why the wrong answer is wrong', minutes: 18,
    href: '#drills', actionLabel: 'Open listening practice',
    task: 'Attempt an unheard recording once. For each miss, identify whether you lost the meaning, followed an abandoned choice, or entered the answer incorrectly.',
    steps: ['Listen once and submit before opening the transcript.', 'Replay only the difficult exchange and write the final intended meaning.', 'Compare it with the transcript, then test the skill on new audio.'],
    review: ['What changed during the exchange?', 'Was the final-mentioned detail relevant to this question?', 'Did my entry obey the word limit and fit the sentence?'],
    successEvidence: 'A correct first-play answer on unheard audio, with fewer errors of the same type.',
    sourceIds: ['official-practice']
  },
  {
    id: 'writing-precision-audit', skill: 'Writing', title: 'Task 1: check the meaning of every comparison', minutes: 28,
    href: '#writing', actionLabel: 'Open Writing Task 1', promptId: 'table-2', taskType: 1,
    task: 'Write a full report on the broadband-access table in 20 minutes. Use the final eight minutes to check the draft against the data and the feedback.',
    steps: ['Choose the main overall patterns and sensible groups before drafting.', 'Write at least 150 words without viewing a model.', 'Submit the original, then revise the weakest comparison and overview sentence.'],
    review: ['Is every subject, year and unit correct?', 'Does a change describe percentage points or relative percentage growth?', 'Does the overview capture the main patterns without inventing causes?'],
    workedExample: 'If a share moves from 20% to 35%, it rises by 15 percentage points. Calling it a 15% rise changes the mathematical meaning.',
    successEvidence: 'The revised report preserves accurate figures and improves the selected feature, rather than merely adding more words.',
    sourceIds: ['writing-descriptors', 'academic-writing']
  },
  {
    id: 'writing-reasoning-audit', skill: 'Writing', title: 'Task 2: challenge your own argument', minutes: 50,
    href: '#writing', actionLabel: 'Open Writing Task 2', promptId: 'essay-7', taskType: 2,
    task: 'Discuss government and individual responsibility for environmental problems. Write an unaided 40-minute answer, then spend ten minutes checking its reasoning.',
    steps: ['Plan both views and your judgement; answer the exact prompt.', 'Write at least 250 words and save the first attempt before requesting feedback.', 'Find the least-supported claim. Add a mechanism, a useful example, or a relevant limitation; remove any unsupported generalisation.'],
    review: ['Where does the reader learn why my claim should hold?', 'Could my example support the opposing view just as well?', 'Does the conclusion follow from what the body actually established?'],
    workedExample: '“Governments can help the environment” is broad. Explain which policy changes whose behaviour and why that mechanism matters, then qualify its limits.',
    successEvidence: 'You can point to a specific improvement in reasoning and repeat it on a fresh essay without feedback.',
    sourceIds: ['writing-descriptors', 'academic-writing']
  },
  {
    id: 'speaking-coherent-long-turn', skill: 'Speaking', title: 'Part 2: make the listener follow you', minutes: 12,
    href: '#speaking', actionLabel: 'Open speaking practice', mode: 'part2',
    task: 'Choose a fresh cue card. Prepare for one minute, then record a one-to-two-minute response using brief notes rather than a written script.',
    steps: ['Use a simple sequence: what happened, a revealing detail, and why it matters.', 'Listen back and mark a place where the story repeats or becomes unclear.', 'Record once more with that problem fixed; use another cue card next time.'],
    review: ['Can a listener identify the main point without my notes?', 'Did I pause to plan an idea or to search for basic language?', 'Which phrase needs clearer stress or grouping?'],
    successEvidence: 'The second version is easier to follow, and an unfamiliar cue card remains coherent without a memorised script.',
    sourceIds: ['speaking-descriptors', 'official-practice']
  },
  {
    id: 'speaking-qualified-analysis', skill: 'Speaking', title: 'Part 3: explain, qualify, extend', minutes: 15,
    href: '#speaking', actionLabel: 'Open discussion practice', mode: 'part3',
    task: 'Answer three unfamiliar discussion questions aloud. Develop a view, explain a mechanism, and consider a condition or exception when it is relevant.',
    steps: ['Give a direct answer before expanding it.', 'Support the explanation with one concrete example; keep it connected to the question.', 'Take an unprepared follow-up and explain how it changes or confirms your answer.'],
    review: ['Did the qualification add meaning or merely fill time?', 'Did I explain the link between my example and my claim?', 'Can I rephrase an idea naturally without repeating the same sentence?'],
    workedExample: 'For “Will remote work replace offices?”, distinguish roles that can move online from those needing physical equipment, then explain why that difference affects your prediction.',
    successEvidence: 'Fresh follow-ups produce clear, developed answers and precise language rather than a rehearsed response.',
    sourceIds: ['speaking-descriptors', 'official-practice']
  }
];

export const bandNineAssessmentLimits = [
  { id: 'ai-estimate', title: 'An estimate, with evidence', text: 'AI feedback is provisional practice feedback, not an official IELTS result. Check that quoted evidence comes from your own submission and use disagreement to guide revision.' },
  { id: 'talking-points', title: 'Ideas are not a Speaking performance', text: 'Bullet points can be reviewed for relevance and development. They cannot establish a full Speaking band, fluency, delivery or pronunciation.' },
  { id: 'transcript', title: 'A transcript loses delivery', text: 'Text can support feedback on language and organisation. Pronunciation and spoken fluency need actual audio; transcription errors may misrepresent your English.' },
  { id: 'short-recording', title: 'A sample is a sample', text: 'Audio feedback concerns the submitted recording. A full Speaking estimate needs evidence across all three parts, and remains provisional without an official examination.' },
  { id: 'short-drill', title: 'Short drills do not convert to bands', text: 'App exercise accuracy is a raw result on those items. For realistic Listening and Reading evidence, use fresh full official practice tests under timed conditions.' },
  { id: 'transfer', title: 'A revision is a learning step', text: 'An improved draft or repeated answer shows revision. Check progress on a different task completed unaided; repeated answers can benefit from memory and feedback.' }
];

export const bandNineReviewLoop = [
  { title: 'Attempt', text: 'Complete a fresh task unaided. Keep the original answer, time and conditions.' },
  { title: 'Inspect', text: 'Read the criterion feedback and its quoted evidence. Pick the weakness that most affects meaning or task fulfilment.' },
  { title: 'Revise', text: 'Improve one passage or spoken answer. Say exactly what became clearer, more accurate or better supported.' },
  { title: 'Transfer', text: 'Use a different prompt without feedback. Compare like-for-like first attempts before calling it progress.' }
];
