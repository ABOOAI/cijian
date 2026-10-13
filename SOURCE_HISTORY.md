# 词间 · Desktop learning workspace 4.3

Existing Site: appgprj_6ac0e75ad0f88191b6830586ec03911a. Keep its current public audience and URL.

Static, dependency-free browser app. `npm run build` copies the public artifacts into `dist`; `.openai/hosting.json` is the unchanged Site identity. `npm test` runs core and compatibility tests. `npm start` serves the local development checkout, where permitted.

## Architecture
- `src/vocabulary.js`, `vocabulary-data.json`, `memory-hints.json`: official 289-word grade-seven upper dataset and original memory guidance.
- `src/scheduler.js`: the ONLY active scheduling engine, with independent meaning/listening/dictation/spelling/usage records, one due date, short steps and cross-day ladder. The old engine module is retained for its answer-normalization helper and compatibility tests, but its old scheduler is not used by app.js.
- `src/custom-words.js`: validated, stable-ID, device-local custom vocabulary. Required English and Chinese; optional example/translation/hint/group.
- `src/app.js`: real desktop task/training/tracking/sentence/context/reading/cloze/analysis/custom routes. Results and active sessions are saved with learning records to avoid duplicate scoring after refresh.
- `src/phonics-context-pilot.json`: sourced 20-word text-only phonics pilot and 54 original questions. Audio availability remains false; no syllable TTS substitution.

Storage is device-local. V1 overall records are preserved, copied into `legacy`, and conservatively assigned a compatibility review queue. No transfer of mastery into unseen skills. The current state key is `word-garden.workspace.v2`; custom vocabulary is separately `word-garden.custom.v1`.

See TEST_REPORT.md for tested behavior and the explicit missing browser/visual validation. The DOM harness uses a QA-only external JSDOM installation, not a site dependency; point its import at an available jsdom install if rerunning elsewhere.

## Kokoro audio 4.1

`src/audio-manifest.json` and `audio/*.mp3` supply 289 fixed Kokoro whole-word assets. Voices alternate af_heart/am_michael in canonical order and are stable per ID; no runtime inference or paid endpoint is used. `src/audio.js` owns a single active player, cancellation tokens and explicit device fallback. Short-interval/custom progress keys are unchanged. Custom words use clearly labeled device voices until generated audio exists. `audio/LICENSE.txt` includes provenance, quality limitations and model/code license. No syllable recordings were added.

## Navigation and dictionary 4.2

The sidebar uses stable delegated click handling, preventing the 15-second badge refresh from destroying navigation listeners. Every non-home module has an explicit parent return; exercise origin and filter context, reading-to-analysis context, browser Back/Forward and audio cleanup are preserved.

`src/dictionary.js` uses textbook-first exact matching, then on-demand ECDICT shards. No entire dictionary is downloaded at startup. Whole-word English-only creation and reviewed batch paste (up to 100 terms) are supported. Unknown terms need a manual meaning or remain unselected; no guessed translation. Exact uppercase textbook acronyms remain distinct from ordinary lowercase words. User edits are protected from late lookup results.

ECDICT declares MIT; provenance and data quality are not a blanket upstream or teacher audit. Sources: https://github.com/skywind3000/ECDICT . License at dictionary/LICENSE.txt. This release deliberately retains no-login, device-local progress; the user's account request is deferred.

## Autoplay and keyboard 4.3

Listening and dictation attempt playback automatically at question entry. Control pressed and released alone replays the same stable audio without hijacking Ctrl+C/V/A or input text. `src/interactions.js` provides the modifier tracker and nonblocking reduced-motion-aware route transitions. Playback restrictions surface the explicit play button. No repeat answer credit is granted by playback.

## Continuous context practice (v4.4)

The four context modules now have an original finite 96-question bank, immediate per-option feedback, taxonomy-based remediation and device-local persistence. Each module has four concepts and six variants per concept. A failed concept needs two consecutive first-attempt correct answers on unseen questions to complete this round's remediation. Replaying a previously seen question never counts as independent verification. All-new questions are exhausted before explicit old-question review is offered; unresolved concepts remain unresolved when variants run out. The learner can pause, navigate away, reload or stop. Existing skill schedules are not inflated by these content checks.

Reading, cloze and sentence structural content have separate evidence/answer-key checks. Cloze audio is inaccessible before all questions linked to its passage are graded (each current mini-passage contains one question). Sentence playback reads only its example. A single shared audio controller stops sound on replay, navigation, pause, next item and page hide. Existing word recordings, autoplay and Ctrl-alone behavior remain intact. Original cloze passages shared with reading are no longer offered in the reference UI.

## Requested supplementary vocabulary (v4.5)

The original 289 per-unit words retain their IDs, definitions, dedicated memory hints and recordings. A separately sourced 422-entry supplement adds 343 primary-school headwords, 30 cardinals, 30 ordinals, 12 months and 7 weekdays. The four extra groups are selectable in every basic practice/review filter; primary-school words are additionally associated with their textbook unit. Total: 711 canonical headwords. Inflections and textbook alternative expressions are recorded as supporting forms rather than inflated headword counts. Only true spelling variants are accepted as equivalent answers for new headwords.

The five case-sensitive sense collisions am/AM, us/US, it/IT, who/WHO and may/May are intentionally separate. Lookup prioritizes exact case, and spelling checks preserve case for these collisions. New terms use source-checked British IPA, explicitly distinguished from the fixed American Kokoro recordings. Bespoke memory stories, examples and full context exercises are not automatically claimed for this supplement.

### Dictation correction and spacing (4.8)
An actual dictation error starts three successful correction stages: visible analysis, hidden-English recall, then audio-only dictation. Incorrect corrective answers repeat that stage without repeated memory penalties; corrective successes do not raise memory strength. Pause/resume is persisted. Twenty-one audited phonological entries have colored syllable controls with synthetic clips; other entries explicitly fall back to whole-word audio. No arbitrary spelling segmentation is presented as syllabification.
Independent correct answers and completed correction sequences rest the word from automatic queues for at least 30 minutes across skills, while retaining each skill's due obligation. Later due dates and the existing 1/3/7/14/30/60-day ladder still apply. This is a transparent product schedule inspired by spaced retrieval, not an individually measured forgetting curve. Manual practice remains possible. Active wrong-word lists hide 100% words without deleting historical errors.

### Sentence dictation and daily time (4.9)
Thirty selected textbook sentences are grouped by all ten textbook units and the two requested sources. B1b selections originate in reading material. Each sentence has a Chinese cue, its own synthesized audio and text field; answers are hidden until submission. Inputs and results persist independently. Case/punctuation/spacing normalization and curated alternatives avoid trivial false negatives. Sentence practice never changes individual word strength.
Daily effective time counts active foreground practice with a 30-second inactivity cutoff and actual exercise audio, excluding navigation, loading and background gaps. View recent local-day totals from the top bar. Totals begin with this release; they are activity estimates and are not synchronized across devices.

### Five sentences and custom sentence practice (5.0)
Each textbook unit shows five sentences together with per-item source labels. The two added sentences per unit are original extensions, not textbook quotations. Custom sentences can be grouped, edited and removed locally; they use explicitly labeled device English speech. English changes invalidate only that sentence's current practice result and retain old-version history.
Automatic Chinese uses the browser's local full-sentence Translator API (supported desktop Chrome), enabled by a deliberate click; the first use may download a language package. No API key, paid service or external sentence-upload fallback is used. Unsupported browsers preserve the English draft and explain the limitation. Machine translations remain editable. Actual support depends on browser/version/hardware/model availability.

### Cooldown scope (5.1)
The30-minute same-word cooldown applies only to memory tracking. Task-center curricula continue through all scheduled skills, including after correct answers and corrections. Normal training, wrong-book practice and manual practice do not consume this tracking-only restriction. Saved new lessons previously shortened by the global filter recover identifiable missing steps without assigning credit.

### Initial memory strength credit (5.2)
Each core skill's first clean independent correct answer earns5% immediately, including within a new lesson's initial study interval. Later gains retain the due-date and once-per-local-day rules. A fully correct first four-skill lesson can therefore reach20% per word. Hint-assisted responses and immediate corrections do not gain strength. Existing history is preserved without retrospective awards.

### Keyboard practice and repeat credit (5.3)
Enter submits/checks the active exercise, then a separate Enter advances. Select a choice first; sentence dictation uses the focused card. Holding Enter cannot rush multiple steps. Dialogs, composition and multiline authoring retain their normal behavior.
The once-per-calendar-day strength cap has been removed. New ordinary independent attempts can earn5% repeatedly, up to25% per skill. Tracking review still uses due times and its30-minute word cooldown. Hint-assisted attempts, immediate retries and three-round corrections remain non-crediting; old scores are not backfilled.

### Unseen-only application practice (5.4)
Context, reading and cloze no longer recycle old questions.72 additional authored scenarios extend the finite bank, with distinct reading/cloze passages and explanations for every option. The next question is selected from unseen material; no seed, renamed actor or reordered answer list makes an old question new. When all available original material is exhausted, the app says so.
Assigned content and question history persist in this browser, including across the app's word-score reset. Unfinished assigned work can resume. Clearing browser storage or switching devices cannot preserve this local-only ledger. Existing passage/audio resources remain; new full cloze audio uses device English speech only after grading.

### Letter comparison on errors (5.5)
Wrong dictation and spelling submissions display an aligned spelling comparison above the input. Green marks characters needed in the correct form, red marks wrong input, with non-color labels for missing/extra characters, spaces and swaps. Exact input is retained; accepted case and Unicode variations follow the grader. Later corrective rounds show feedback only after a wrong submission and hide it before retry, preserving the independent recall stage and existing scoring protections.

### Three corrections in both typed modes (5.6)
Both wrong dictation and wrong spelling now require three successful correction rounds: copy the visible word; recall with Chinese and completed audio; recall with completed audio only. Mistakes repeat the current round. Comparing an error is allowed after submission, and its answer is hidden before retry. All three rounds remain auxiliary practice without extra penalties or memory-strength gains.

### Automatic caret focus (5.7)
When an answer field appears, the caret moves into it so the learner can type and use Enter without clicking the field. This covers typed word practice, correction rounds, sentence cards and text-entry dialogs. Existing selection/draft state is preserved on redraws, while inactive pages, open dialogs and later user focus choices prevent background focus changes.

### Fixed collocations (6.0)
The new 固定搭配 section has separate phrase IDs, progress and review schedules. The first bank contains60 entries,42 source-verified textbook associations and18 theme extensions, with360 original transfer questions and120 recorded synthetic phrase/example files. It is a selected starting bank, not the whole junior-school curriculum.
Lessons introduce up to5 entries and gradually remove hints. Wrong answers require3 successful corrections followed by an unseen transfer scenario. Four skills each contribute25 points; independent answers add5, mistakes subtract5, hints/correction add0, with no daily cap. The review ladder is1/3/7/14/30 days.100 disables automatic review, while manual mistakes restore eligibility. Context scenes are finite; exhausted context remains pending while other skill review continues.
Custom entries stay in browser storage. Verified exact matches can reuse built-ins; otherwise missing Chinese/example/structure data is clearly marked, available practice remains usable, and device English speech is labeled. Existing word and sentence data are not rewritten. Enter, Ctrl replay, automatic caret and effective-time tracking work in the new section.

### Sentence cards, 60-second activity window, and audio preparation (6.1)
Sentence book now shows one example card; sentence dictation uses one word-style learning card with Chinese prompt, audio, multiline answer, feedback below, and previous/next controls. Existing sentence IDs, answers, drafts and results remain; the old six-card page cursor migrates once. Enter submits then a separate Enter advances; Shift+Enter adds a newline and Ctrl replays the current sentence.
Effective time begins on entering practice. Foreground navigation, loading and waiting continue within 60 seconds of actual interaction. Rendering and network callbacks do not extend that window. Actual practice audio playback can continue beyond idle; background/blur pauses. Existing local daily totals are retained.
Static Kokoro preparation covers current/next sentence, next word and current phrase/example, with at most two background loads. Playback startup has a 15-second watchdog; cache replays update recency. HTTP access denials remain blocked for the current player. No production latency claim or voice changes. Space characters in spelling comparison are blank bordered cells with accessible labels.

### Answer-feedback timing (1.11.0)
Directly restoring a graded answer within an unfinished word practice session starts the same60-second foreground activity window as entering the question. Viewing the answer explanation is included; periodic rendering still cannot extend idle time.

### User-facing release version policy
From the next published release, use1.11.0, then increment the final decimal digit exactly once per successful public release:1.11.1 through1.11.9, then1.12.0,1.12.1, and so on. Draft source saves, undeployed versions, failed deployment attempts and retries do not consume a user-facing version. Keep the package version, visible footer and current release note consistent. Sites saved-version numbers are separate internal sequence IDs. Never use display-version comparison to clear or migrate learning progress; preserve storage schemas and stable IDs independently.

### Clear answer feedback (1.11.1)
Expected answer stays above the learner input. Matching characters are green in both rows; incorrect input is red, with neutral emphasis for the expected replacement. Empty bordered cells represent real spaces. Error type summaries distinguish replacement, omitted/extra characters and transposition without dense per-character labels. All word, sentence and phrase result panels use explicit outcome states, large symbol-plus-text titles, strong borders and polite status announcements. Sentence incorrect results no longer inherit the old green default panel. This follows W3C guidance on clear textual error identification and recognizable feedback, without claiming a universal dyslexia preference or clinical benefit.
Sources: https://www.w3.org/WAI/WCAG22/Understanding/error-identification and https://www.w3.org/WAI/WCAG2/supplemental/patterns/o4p10-status-feedback/

### Compact appearance restored (1.11.2)
Restored the earlier compact feedback appearance at the user's request: removed large check/cross symbols, enlarged feedback type, heavy borders and extra padding. Keeps corrected row/color semantics, blank space cells, sentence error background, short error summaries and polite status semantics. Timing, audio, scoring and saved learning data are unchanged.

### Monotonic memory strength (1.11.3)
Every normal unassisted correct word or collocation answer now adds10 percentage points to an independent overall total, capped at100. The old per-skill25 cap cannot block further total credit. Wrong/uncertain answers, hints and elapsed time never subtract. Legacy strength inherits the exact old sum on first assessment, without retroactive rescoring or clearing data; skill records still schedule reviews separately. Credited event IDs prevent repeat credit even after the short event log rolls over. At100, manual mistakes retain100 and do not re-enable automatic review.
Hinted answers, copying/immediate revealed retries and the three correction rounds remain non-credit practice. Sentence dictation retains its separate answer records and does not award word strength for every word in a sentence. Linked independent context answers use the same +10 rule. Existing UI styling, timer and audio behavior are unchanged.
