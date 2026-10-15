// Original teaching examples. Official sources support test rules and assessment criteria;
// the practice methods are coaching suggestions, not official scoring formulas.
export const lessons = [
  {
    id: 'reading-tfng',
    title: 'True, False or Not Given: prove your choice',
    skill: 'Reading',
    minutes: 8,
    description: 'Separate a contradiction from missing information, then practise with a complete passage.',
    why: 'A plausible statement can still be Not Given. This task checks what the passage establishes, not what you know about the world.',
    steps: [
      { title: 'Reduce the statement to one claim', text: 'Identify who or what, the action, and any restriction: all, only, more than, before, or because. A statement is not True just because its topic appears in the passage.', example: 'Statement: “Every volunteer received training.” The word every makes this a claim about the whole group.' },
      { title: 'Find the relevant evidence', text: 'Locate the topic, then read the surrounding sentences for meaning. Allow for synonyms. Do not turn an absent keyword into a Not Given answer.', example: '“The induction was attended by all participants” can support “Every volunteer received training” if the context identifies the participants as the volunteers and the induction as their training.' },
      { title: 'Apply the three-way test', text: 'True: the passage supports the whole claim. False: it establishes an incompatible claim. Not Given: a necessary detail is unconfirmed, so neither True nor False is justified.', example: 'Claim: “The training lasted two hours.” Passage: “The training was held on Saturday.” → Not Given: the duration is missing. “The training lasted ninety minutes.” → False: the stated duration contradicts two hours. “The training ran from 10 a.m. to noon.” → True: the times establish a two-hour session.' },
      { title: 'Review the reason, not just the letter', text: 'After marking the practice, identify the exact evidence for every True or False answer and the missing detail for every Not Given answer. Save your most revealing mistake. Compare your first attempt with a fresh passage later; a repeat mostly tests recall.' }
    ],
    check: {
      question: 'Passage: “The pilot began in April. Researchers have not yet published its cost.” Statement: “The pilot was cheaper than the previous project.”',
      options: ['True', 'False', 'Not Given'],
      answer: 'Not Given',
      explanation: 'There is no cost comparison. An unpublished cost neither confirms nor contradicts “cheaper”.'
    },
    practice: { type: 'drill', id: 'reading-urban-trees' },
    videoId: 'WYl9PX7Ua_Q',
    sourceUrl: 'https://ielts.org/take-a-test/test-types/ielts-academic-test/ielts-academic-format-reading'
  },
  {
    id: 'reading-headings',
    title: 'Matching headings: name the paragraph’s job',
    skill: 'Reading',
    minutes: 8,
    description: 'Find the main idea without being pulled towards a heading that shares one word.',
    why: 'A heading summarises the paragraph as a whole. A detail, example or memorable word can be accurate yet make a poor heading.',
    steps: [
      { title: 'Read for the paragraph’s purpose', text: 'Ask what the paragraph is doing: explaining a problem, comparing methods, reporting a change, or questioning a claim. Read beyond its first sentence when the focus develops or changes.' },
      { title: 'Write your own short summary', text: 'Before choosing, express the central message in a few plain words. This is a practice technique, not a required exam step.', example: '“The old system was slow; a digital catalogue cut searching time, although staff initially needed training.” Your summary: a faster replacement system.' },
      { title: 'Compare scope, not shared vocabulary', text: 'Test each candidate against most of the paragraph. Reject headings that cover only an example, claim more than the paragraph says, or focus on an incidental detail.', example: 'For the catalogue example, “Improving access through technology” fits better than “Problems in staff training”: training is a qualification, not the central message.' },
      { title: 'Resolve close options with evidence', text: 'Identify the difference between your last two choices, then reread for that difference. Headings tasks have unused options, and a heading is not reused. After marking, explain why the strongest distractor fails; record accuracy and time on fresh sets.' }
    ],
    check: {
      question: 'A paragraph describes replacing expensive field surveys with volunteer observations, explains the savings, and briefly mentions a phone app. Which heading best fits?',
      options: ['A cheaper way to gather evidence', 'How phone apps are designed', 'Why all professional surveys fail'],
      answer: 'A cheaper way to gather evidence',
      explanation: 'The change in evidence collection and its cost is the main idea. The app is one detail, and “all surveys fail” is unsupported.'
    },
    practice: { type: 'drill', id: 'reading-library-change' },
    videoId: 'wS3w5f_pL_k',
    sourceUrl: 'https://ielts.org/take-a-test/test-types/ielts-academic-test/ielts-academic-format-reading'
  },
  {
    id: 'listening-distractors',
    title: 'Listening: follow corrections and decisions',
    skill: 'Listening',
    minutes: 8,
    description: 'Hear the final relevant answer instead of grabbing the first matching word.',
    why: 'Understanding a conversation includes tracking rejected suggestions, corrections and agreement. In the exam, each recording plays once.',
    steps: [
      { title: 'Predict the information you need', text: 'Read the question and identify whether you need a time, destination, reason or final choice. With options, notice exactly how they differ. This gives your attention a target.' },
      { title: 'Keep the whole exchange in mind', text: 'Words such as actually, instead, used to, but and no longer can change the answer. Do not automatically choose the last number either: it may answer a different question.', example: '“The visit was planned for Tuesday, but it is now Thursday. Please pay by Wednesday.” The visit day is Thursday; Wednesday is the payment deadline.' },
      { title: 'Match meaning rather than repeated words', text: 'A wrong option can be mentioned and rejected. The correct choice may be expressed with different wording.', example: 'Question: Why change rooms? “It has enough seats, but the projector has stopped working.” The reason is faulty equipment, not insufficient space.' },
      { title: 'Review after your first attempt', text: 'Listen once before submitting. Afterwards use the transcript to label each error: missed correction, misunderstood paraphrase, lost place, or inaccurate spelling. Replay the difficult line for learning, then use a fresh set for your next measurement. Synthetic app speech is practice; include official recorded audio in your preparation.' }
    ],
    check: {
      question: '“We considered the 9:30 train, but it is full. Book the 10:15 instead. We should reach the station by 9:50.” Which train will they take?',
      options: ['9:30', '9:50', '10:15'],
      answer: '10:15',
      explanation: '9:30 is rejected; 9:50 is the arrival time at the station. “Book the 10:15 instead” states the choice.'
    },
    practice: { type: 'drill', id: 'listening-booking' },
    videoId: 'hOAsUNNyPIs',
    sourceUrl: 'https://ielts.org/take-a-test/test-types/ielts-academic-test/ielts-academic-format-listening'
  },
  {
    id: 'listening-completion',
    title: 'Listening gaps: predict, capture, check',
    skill: 'Listening',
    minutes: 8,
    description: 'Use the form and its instructions to capture precise answers.',
    why: 'Knowing the general meaning is not enough if the answer exceeds the word limit or does not fit the gap.',
    steps: [
      { title: 'Read the limit and the layout', text: 'Identify the allowed number of words and numbers for this question set. Note information already printed around each gap so you do not add it twice.', example: 'For “Room number: ___” under “ONE WORD AND/OR A NUMBER”, the answer might be 204. For “Cost: £___”, you usually need the amount, not the printed currency symbol.' },
      { title: 'Predict an answer type, not an answer', text: 'Use labels and grammar to expect a surname, date, material, plural noun or number. Prediction focuses your attention; it should not replace what the recording says.', example: '“Please bring a ___” suggests a singular countable item. “Equipment is made from ___” suggests a material.' },
      { title: 'Write the words that fit', text: 'Follow the recording and enter the required words without unnecessary additions. Keep listening for spelled names and corrections. Move on if you miss a gap so one error does not cost the next answer.' },
      { title: 'Make the final check concrete', text: 'Check the instruction, spelling, the number you heard, and whether the answer fits its sentence. After practice, separate comprehension errors from answer-entry errors. Save one spelling or word-limit mistake to revisit tomorrow.', example: 'If the recording says “Bring your passport” and the form reads “Required document: ___” with ONE WORD ONLY, enter passport, not your passport.' }
    ],
    check: {
      question: 'Instruction: ONE WORD ONLY. Recording: “For identification, bring your passport.” Form: “Identification document: ___”. Which entry follows the task?',
      options: ['your passport', 'passport', 'bring passport'],
      answer: 'passport',
      explanation: 'Passport identifies the document and stays within one word. The other entries exceed the limit.'
    },
    practice: { type: 'drill', id: 'listening-campus' },
    videoId: '_6jgygopp40',
    sourceUrl: 'https://ielts.org/take-a-test/test-types/ielts-academic-test/ielts-academic-format-listening'
  },
  {
    id: 'writing-task1-overview',
    title: 'Task 1: see the story before the figures',
    skill: 'Writing',
    minutes: 10,
    description: 'Build a clear overview and sensible comparison groups for an Academic table.',
    why: 'The official Task 1 criteria include selecting key features and presenting an overview. A list of figures makes the main patterns hard to see.',
    steps: [
      { title: 'Read subject, units and dates', text: 'Identify exactly what is measured, where, when and in which unit. A share of commuters is different from a number of journeys. Describe only information supported by the visual.' },
      { title: 'Choose two or three major features', text: 'Look for dominant categories, overall changes, contrasts, stable values and exceptions. Avoid claiming that everything rose when one category fell. For a process, focus on the sequence and main stages; for maps, the major changes.' },
      { title: 'Draft an overview before the detail', text: 'Summarise the big picture in one or two clear sentences. The example below refers to the practice table, not real transport statistics.', example: '“Overall, cars remained the most common commuting method despite a decline across the period. Cycling and public transport gained share, while walking became less common.” This captures the endpoints without saying the car share fell continuously.' },
      { title: 'Group evidence and check precision', text: 'One body paragraph could compare cars and public transport; another could compare cycling and walking. Support key comparisons with figures. In the practice table, cycling rises from 5% to 12%: a rise of 7 percentage points, not 7%. First write the overview and group plan; then complete at least 150 words in about 20 minutes and revise against the checklist.' }
    ],
    check: {
      question: 'In the commuting table, car share is 45%, 50%, then 42%. Which sentence is accurate?',
      options: ['Car share rose before falling below its starting level.', 'Car use fell steadily throughout the period.', 'Cars became the least common method.'],
      answer: 'Car share rose before falling below its starting level.',
      explanation: '50% is above 45%, while the final 42% is below 45%. The trend is not a continuous decline.'
    },
    practice: { type: 'writing', id: 'table-1' },
    videoId: 'A6_0QjlNJqk',
    sourceUrl: 'https://ielts.org/cdn/ielts-guides/ielts-writing-band-descriptors.pdf'
  },
  {
    id: 'writing-task2-plan',
    title: 'Task 2: answer the actual question',
    skill: 'Writing',
    minutes: 10,
    description: 'Turn a prompt into a position and two developed paragraph plans.',
    why: 'Writing assessment considers how well you address and develop the task. Good vocabulary cannot rescue an essay that answers a different question.',
    steps: [
      { title: 'Identify every instruction', text: 'Separate the topic from what you must do with it. Discuss both views and give your opinion requires both views and your own judgement; a causes-and-solutions question needs both parts.', example: 'Practice prompt: universities should teach employment skills versus develop knowledge. Required work: explain the case for each purpose and state your view.' },
      { title: 'Write your answer in one sentence', text: 'Choose a position you can explain, not the position with the fanciest vocabulary. A qualified opinion is fine if its meaning remains clear.', example: '“Universities should develop broad knowledge while connecting it to employment through practical projects.” This gives a clear judgement rather than simply saying both sides exist.' },
      { title: 'Plan the reasoning before the introduction', text: 'Give each body paragraph one central idea, a reason it matters, and a concrete illustration. A two-body-paragraph structure is a useful starting option, not an official requirement.', example: 'Body 1: employment skills → graduates can apply theory → supervised placements. Body 2: broad knowledge → skills may become outdated → scientific reasoning helps graduates adapt. Weigh both in support of your combined position.' },
      { title: 'Draft, then check against the prompt', text: 'Try a 5-minute plan, 30-minute draft and 5-minute check within a 40-minute practice. Write at least 250 words. Save the first draft before revising. Highlight where each task instruction is answered and where your opinion is expressed; fix any missing part.' }
    ],
    check: {
      question: 'For “Discuss both views and give your opinion”, which plan covers the instructions?',
      options: ['Explain only the view you support.', 'List both views without choosing a position.', 'Explain both views and make your own judgement clear.'],
      answer: 'Explain both views and make your own judgement clear.',
      explanation: 'The prompt asks for both perspectives and your opinion. Planning should make space for all three.'
    },
    practice: { type: 'writing', id: 'essay-1' },
    videoId: 'otSbdkbtm2M',
    sourceUrl: 'https://ielts.org/take-a-test/test-types/ielts-academic-test/ielts-academic-format-writing'
  },
  {
    id: 'writing-paragraph-development',
    title: 'Task 2: develop one idea properly',
    skill: 'Writing',
    minutes: 10,
    description: 'Move from a claim to an explanation and a relevant example.',
    why: 'An essay needs developed reasoning. Several unsupported claims can sound confident while leaving the reader unsure why they are true.',
    steps: [
      { title: 'Make a focused claim', text: 'Choose one reason that helps answer the essay question. Keep it narrow enough to explain in a paragraph.', example: 'Prompt: prioritise public transport over new roads. Focused claim: “Frequent bus services can make commuting more affordable for people who do not own cars.”' },
      { title: 'Explain the mechanism', text: 'Ask how or why your claim works. Develop it rather than restating it with synonyms.', example: '“When routes operate reliably across residential areas, workers can reach jobs without paying for fuel, insurance and parking.” This explains the connection between service provision and affordability.' },
      { title: 'Use an illustration that proves the point', text: 'A realistic hypothetical example is useful; invented research statistics are unnecessary. Make the connection to your argument explicit.', example: '“For example, an early bus linking a suburb with an industrial area could allow a worker to accept a shift that previously required an expensive taxi.” Then acknowledge that routes and timetables need to match actual demand.' },
      { title: 'Revise for relevance and accuracy', text: 'Label each sentence: claim, explanation, illustration or qualification. If a sentence does none of these jobs, revise or remove it. Do not force a fixed number of sentences. In practice, draft one strong paragraph first, then complete the essay and save a revised version after feedback.' }
    ],
    check: {
      question: 'Which sentence most directly develops “Reliable buses improve access to jobs”?',
      options: ['Public transport is very important in modern society.', 'If the first bus arrives before a factory shift begins, workers without cars can apply for those jobs.', 'Roads were invented a long time ago.'],
      answer: 'If the first bus arrives before a factory shift begins, workers without cars can apply for those jobs.',
      explanation: 'It explains how bus reliability changes access to work through a specific, relevant situation.'
    },
    practice: { type: 'writing', id: 'essay-3' },
    videoId: 'rXVR-nE2jvw',
    sourceUrl: 'https://ielts.org/take-a-test/test-types/ielts-academic-test/ielts-academic-format-writing'
  },
  {
    id: 'speaking-part1',
    title: 'Part 1: answer naturally and add useful detail',
    skill: 'Speaking',
    minutes: 8,
    description: 'Practise direct answers without memorising miniature speeches.',
    why: 'Part 1 uses familiar topics. Relevant detail gives you room to demonstrate your language without drifting away from the question.',
    steps: [
      { title: 'Give the answer first', text: 'Respond to what was asked before adding background. Your real circumstances are fine; being unemployed does not require a rehearsed cover story.', example: '“Do you work or study?” → “I’m not working at the moment. I’m preparing to study abroad, so this week I’m focusing on my English.”' },
      { title: 'Add a reason or concrete detail', text: 'Try an answer plus a reason, example or brief contrast. This is a flexible practice scaffold, not a required sentence count. Some questions need shorter answers than others.', example: '“Do you like learning new skills?” → “Yes, especially practical ones. I recently learned to cook a few meals because I’ll need to look after myself when I move.”' },
      { title: 'Keep language clear', text: 'Use words you understand and can pronounce. If a word escapes you, explain it another way. Avoid adding memorised idioms that do not fit the meaning. Speak at a comfortable pace; speed alone is not fluency.' },
      { title: 'Record and repair one pattern', text: 'In the Speaking room, switch to Part 1 and answer six questions without writing a script. Listen back: did you answer directly, add relevant detail, and remain understandable? Note one repeated pause or grammar issue. Repeat two answers with that issue in mind, then try fresh questions. A checklist is not a band score.' }
    ],
    check: {
      question: '“Do you enjoy cooking?” Which response answers directly and develops the answer naturally?',
      options: ['Yes, particularly simple meals. I like being able to change the ingredients to suit my taste.', 'Cooking is a controversial issue nowadays in this modern era.', 'Yes.'],
      answer: 'Yes, particularly simple meals. I like being able to change the ingredients to suit my taste.',
      explanation: 'It provides a direct answer and relevant personal detail. The first response avoids the question; the last gives little language to assess.'
    },
    practice: { type: 'speaking', id: '0' },
    videoId: 'TnPsrlxITmI',
    sourceUrl: 'https://ielts.org/take-a-test/test-types/ielts-academic-test/ielts-academic-format-speaking'
  },
  {
    id: 'speaking-part2',
    title: 'Part 2: turn one minute into a speaking map',
    skill: 'Speaking',
    minutes: 10,
    description: 'Prepare keywords, then build an organised long answer from one specific experience.',
    why: 'You have one minute to prepare before the long turn. A useful note map helps you continue without reading or memorising a script.',
    steps: [
      { title: 'Choose a specific example quickly', text: 'Read the cue and its prompts. Choose an experience you can describe clearly; do not spend the whole minute searching for an impressive story.', example: 'Cue: a time you solved a problem. Choose a real incident such as organising transport after missing a bus.' },
      { title: 'Use keywords as a route through the story', text: 'Note the situation, the problem, your actions, the result and why it mattered. Leave full sentences for your spoken answer.', example: '“last month / missed last bus / friend + timetable / taxi shared / relieved / plan earlier” is a speaking map. It is easier to follow than a half-written script.' },
      { title: 'Develop events and reflection', text: 'Explain what happened, the choices you considered and how the experience affected you. If you finish the prompts quickly, add a relevant detail or reflection rather than introducing an unrelated topic.' },
      { title: 'Practise with real time limits', text: 'Use 60 seconds for notes, then speak for up to two minutes. Save or note your actual duration and where you ran out of ideas. Duration is only a practice measure; it cannot establish a band. Replay for organisation and intelligibility, repair one weakness, then try a fresh cue.' }
    ],
    check: {
      question: 'Which preparation note is most useful for “a time you solved a problem”?',
      options: ['A full introduction written word for word', 'missed bus / checked alternatives / shared taxi / relieved / plan earlier', 'A list of impressive idioms unrelated to the event'],
      answer: 'missed bus / checked alternatives / shared taxi / relieved / plan earlier',
      explanation: 'The keywords give a sequence and a reflection while leaving you free to speak naturally.'
    },
    practice: { type: 'speaking', id: '3' },
    videoId: 'rWBrbXrNHwk',
    sourceUrl: 'https://ielts.org/take-a-test/test-types/ielts-academic-test/ielts-academic-format-speaking'
  },
  {
    id: 'speaking-part3',
    title: 'Part 3: explain, compare and qualify',
    skill: 'Speaking',
    minutes: 10,
    description: 'Move beyond your own story to discuss broader ideas with clear reasoning.',
    why: 'Part 3 develops related topics at a more general level. The aim is to communicate and analyse ideas, not to demonstrate specialist knowledge.',
    steps: [
      { title: 'Recognise the thinking task', text: 'Is the question asking for a cause, comparison, prediction, evaluation or solution? Answer that task explicitly. A personal anecdote may illustrate your point, but should not replace the wider discussion.' },
      { title: 'State a view and explain why', text: 'Give a reason that makes your answer understandable. Use a simple example or comparison when it helps.', example: '“Why are long-term goals difficult?” → “One reason is that the reward feels distant. People may find it easier to continue when they can see smaller improvements each week.”' },
      { title: 'Add a useful qualification', text: 'Consider when your claim might be less true, or compare two groups. Avoid absolute claims you cannot support.', example: '“That may be especially important for someone studying alone. A person with a coach already has regular feedback and may find it easier to stay consistent.”' },
      { title: 'Use a fresh-question review loop', text: 'Switch to Part 3 in the Speaking room and record four answers. For each, note your direct answer, reason and any useful example or qualification. Listen for repeated vague words and unclear connections. Retry one answer, then use a different question to see whether the improvement transfers. Seek external feedback for a provisional band estimate.' }
    ],
    check: {
      question: '“Should employers help employees learn new skills?” Which response develops a general position?',
      options: ['My manager is called Sam and my office is near the station.', 'Yes, when the training relates to the job, because both the worker and employer benefit; smaller firms may need cheaper shared courses.', 'It depends. That is all.'],
      answer: 'Yes, when the training relates to the job, because both the worker and employer benefit; smaller firms may need cheaper shared courses.',
      explanation: 'It answers the question, gives a reason and adds a relevant qualification about different employers.'
    },
    practice: { type: 'speaking', id: '7' },
    videoId: '0OODQFf96fg',
    sourceUrl: 'https://ielts.org/take-a-test/test-types/ielts-academic-test/ielts-academic-format-speaking'
  }
];
