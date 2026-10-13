# Word memory strength and Chinese instructions, release4.7

Date:2026-10-05.

- Added a persisted0–100 score: meaning/listening/dictation/spelling each cap at25. A normally due independent correct answer adds5 once per local date per skill. Wrong/uncertain subtract5; related context errors lower meaning. Hints, immediate corrections, early or same-day repeats do not add points. Context/phonics availability does not gate100. Old records receive at most5 verifiable points per skill, not inferred perfection.
-100 excludes the word from due reviews, review-all, wrong-word auto queues, new lessons and automatic short batches. Pending future items in a running automatic queue are omitted without grading them. Direct manual practice remains available; a manual error drops strength and reactivates scheduling. There is no time decay from100. All track/custom IDs and prior history remain intact.
- Word cards, lists and tracking show the score; help states the rule and that100 is a software threshold rather than a guarantee against forgetting.
- Translated97 instruction/question fields and operation labels to Chinese. English study words, sentences, passages, quoted references, choices and audio text remain unchanged.
- Strength unit and actual-code DOM tests cover date caps/boundaries, hints, correction,100 exclusion/reload, manual-error reactivation, track/custom isolation and running-queue continuity. Real-browser speaker/visual verification remains unclaimed.

# Blank-safe context audio and continuous due review, release4.6.1

Date:2026-10-05.

- Replaced the context-assessment word-audio control with朗读例句. The central word-player path is also guarded in usage sessions, so stale controls cannot read the missing word. Ctrl remains inactive there; ordinary word training is unchanged.
-63 exact visible examples have dedicated Kokoro recordings.43 blanks are represented by350ms silent gaps between106 exact spoken segments. The greet screenshot example never synthesizes greet/count/spell. No choices or answer replacement enter synthesis. Custom examples mask all complete-word occurrences and use clearly labeled device sentence speech. Error/retry/device fallback retain the identical blank-safe sentence.
- Added复习全部 to memory tracking for every currently due word-skill pair in the selected track/scope. The header explicitly includes all skills; each skill card also offers its own all-due queue. Future items are excluded, pairs deduplicated, queues can pause/resume, and progress persists. A13-item scenario completes without repeated menus; hinted answers retain existing mastery protections.
- Static audio underwent independent input/hash/decode/level checks. Full actual-browser speaker listening is not claimed.

# Separate preparatory track and typed-answer fixes, release4.6

Date:2026-10-05.

- The343 primary-school words now live in the dedicated预备单元 sidebar workspace. Their inherited normal-unit query memberships were removed; source unit provenance, word IDs, audio files and records remain intact. Original10 unit totals are restored; numerals/months/weekdays remain in regular learning.
- Regular practice/review defaults exclude primary words. Preparatory drill/review routes remain primary-only, support direct reloadable links and return navigation. Explicit全站复习 is separately labeled; an already-started legacy mixed queue is retained and clearly identified.
- Reproduced the empty-answer bug: setCustomValidity persisted after input, so native validity blocked subsequent submit events even with a correct draft. Input/change now clear that error. Empty and whitespace submissions do not grade. Tests cover button/implicit submit, repeated empties, editing, next-question state, audio gates, composition and custom typed context.
- Assistance scoring no longer uses a cross-skill word exposure timestamp. Only the current attempt's hint/answer-audio flag or an immediate corrective retry counts as assisted. Required dictation playback and Control replay do not. Existing due-time protections remain, with distinct early-practice/correction messages. Historical score records are not rewritten.
- Real-browser physical keyboard/speaker verification remains unavailable; DOM tests execute the actual form listeners and native validity model but do not substitute for a full browser audit.

# Supplementary textbook vocabulary release4.5

Date:2026-10-05. Requested sections added from the same fingerprint-verified official PDF.

- Added422 canonical entries:343 primary-school words (printed119–125),30 cardinals +30 ordinals (126),12 months +7 weekdays (127). Total711. Other Reference sections are excluded.
- Four new selectable groups appear in tasks, basic practice, mistakes, review tracking and sentences. Primary words also retain their source textbook-unit membership. Basic practice now supports search and pagination so every added word is directly accessible.
- am/AM, us/US, it/IT, who/WHO and may/May preserve distinct meanings/IDs. Exact-case lookup and case-sensitive grading distinguish those pairs. Inflections and different spoken alternatives do not falsely pass headword dictation; ordinary supported spelling variants remain accepted.
- Original289 source records, memory hints and manifest entries are unchanged. All711 word recordings match their manifest hashes.422 new Kokoro recordings decoded successfully, without silence/clipping failures; the original50 sentence/cloze files are preserved.
- Supplement IPA is explicitly textbook British notation; recordings remain American synthetic voices. Bespoke new mnemonics, examples and full context courses are not claimed.
-68 unit/data tests and270 actual-code DOM assertions passed:117 legacy,63 adaptive,15 buffered-audio and75 supplement checks. Static build verified1924 copied files. Real-browser speaker/visual and independent teacher audits remain unverified.

# Audio reliability release 4.4.1

Date: 2026-10-05. User-reported VR playback failure inspected from screenshot.

- VR's packaged and deployed MP3 is present, valid audio/mpeg and decodable. Browser-like requests return a full 200 response even when Range was requested; this is not by itself proof of the user's failure. Ordinary non-browser requests can receive403 and are not worked around or automatically retried.
- Modern browsers now load the exact existing Kokoro bytes with a normal same-origin request, validate status/MIME/empty responses, then play a Blob URL. A 48-record in-memory LRU cache avoids repeated downloads and native media range requests. No voice recordings were replaced and no model API is called.
- Added 15-second download timeout, visible loading, specific HTTP/format/autoplay errors and explicit original-voice retry. HTTP401/403 failures are remembered for background loads; only explicit user retry can request again. Navigation invalidates late load/play callbacks. One media failure cannot display duplicate errors.
- First-play autoplay restrictions remain respected; after a browser blocks asynchronous playback, clicking retry uses already-loaded bytes and invokes play synchronously. Device speech stays an explicit fallback and waits for delayed voice registration.
- 64 unit/data tests,117 legacy DOM checks,63 adaptive DOM checks and15 additional actual-app buffered-audio checks passed. Buffered checks cover VR across five word modules, one download across repeated playback, sentence/cloze audio, navigation cancellation and grading gates.
- Browser speaker playback is not established by these simulated tests. No universal browser/network success or perceptual audio audit is claimed.

# Continuous context practice release 4.4

Date: 2026-10-05. No login or model API added. Existing browser-local word records are retained.

- Four modules offer finite original new-question rounds and immediate per-option Chinese feedback. Wrong concepts are prioritized using unseen variants; two consecutive independent correct answers clear that concept's current remediation. Seen-question review cannot validate mastery. Exhausted banks remain explicitly unresolved, with no forced infinite loop.
- 96 questions, 16 concepts, six variants/concept. Reading has six passages; cloze has 24 separate one-blank mini-passages, distinct from all reading material; analysis has 24 distinct example sentences. Old shared reading/cloze reference exercises are not exposed in the cloze route.
- Pause, navigation, refresh, review, duplicate clicks and global progress reset are covered. Existing references/custom words remain reachable, and continuous-practice records do not inflate the independent word scheduling records.
- Sentence and fully graded cloze text have static Kokoro recordings, replay/stop controls and explicit device-voice fallback. New questions, answers, pause, navigation and page hide cancel prior sound. No cloze playback control exists before its linked questions are graded.
- Automated validation: 54 unit/data tests, 63 adaptive actual-code JSDOM checks and 117 legacy JSDOM regressions passed. MP3 generation independently validates text mapping, decoding, non-silence and clipping.
- Real Chromium harness could not open its local debugging endpoint; real-browser layout/speaker-output verification is not claimed. JSDOM and mocked media tests do not constitute a visual or listening audit. No independent teacher review is claimed.

# Autoplay, Control replay and transitions release 4.3

Date: 2026-10-04. No account/data-schema change.

- Listening-meaning and dictation automatically attempt whole-word playback on question entry and each new item, once per entry. Feedback/hint rerenders do not replay automatically.
- A deliberate Control-alone press and release replays the current word even while the dictation input is focused. Ctrl+C/V/A and other chords, key repeat, IME composition, Control-click/wheel, hidden state, dialog state, blur and changed question context do not trigger this shortcut. No keyboard default behavior is prevented.
- Playback end is still required to unlock listening/dictation answers. Old media is canceled on next/exit; stale callback tokens cannot unlock another item. Browser NotAllowedError is shown as an honest prompt to click the existing play button; no simulated success.
- A nonblocking 160ms entry / 90ms exit cross-fade decorates route changes. Outgoing content is inert, aria-hidden, pointer-inert and stripped of duplicate IDs. Reduced-motion preference disables these transitions.
- 117 app DOM checks and 47 unit/data checks pass, including prior navigation/dictionary/audio regressions and the new automatic/replay gates. Media output and transitions are not a real-browser visual/speaker audit.

# Navigation and auto-Chinese release 4.2

Date: 2026-10-04. Only the two user-prioritized changes are in this release; account registration and server progress are deferred.

- Root cause fixed: timed renderNav() replaced the sidebar nodes and lost their per-button event handlers. The sidebar now delegates clicks through its stable parent.
- 106 actual-code JSDOM interaction checks pass, including all previous audio/progress regressions, periodic-menu-refresh survival, parent return on all 13 non-home modules, restoration of exercise unit filter, browser Back/Forward, originating reading passage restoration, English-only single save, batch import/unknown handling, and manual translation protection from late async lookup.
- 39 unit/data checks pass (the previous 33 plus six exact-lookup/normalization/cache/acronym/lemma/error/prototype tests).
- ECDICT: 767,533 entries with Chinese definitions, 699 on-demand shards; optional explicit lemma metadata. 289 current textbook definitions take precedence, with uppercase acronym case preserved. Unknowns are not guessed. All dictionary strings render as text.
- Dictionary source/license retained. Sharded assets verified by build byte comparison; no CSV or first-load full dictionary fetch.
- Browser geometry/speaker-output limitations below remain unchanged; JSDOM is not a real visual browser audit.

# Kokoro release 4.1 validation

Date: 2026-10-04. No progress schema change.

## New audio release checks
- 289/289 static whole-word/full-phrase MP3 assets. 145 af_heart female and 144 am_michael male, alternating by canonical corpus order and permanently keyed to word ID.
- Owner-side integration rechecked every canonical ID/text/index/voice, local file existence and SHA-256 against the producer manifest. The producer reports all 289 files decode completely, are non-silent, finite and unclipped; no failures. Total MP3 bytes: 7,941,932.
- 33 unit/data checks pass, including seven audio-controller tests for completion gates, replay cancellation, stale events, navigation cleanup, rejected play promises, load errors and device fallback.
- 81 DOM interaction checks pass, including the previous 53 regression checks and 28 new audio checks across memory/translation/listening/dictation/written recall, stable male/female files, end-before-answer gates, interrupted playback, explicit fallback labels, hint scoring, sentence book and context playback.
- Test media events are mocked: these are actual app DOM/logic tests, not browser-speaker listening tests. No new browser-visual or audio-output verification is claimed.
- Source/manifest labels explicitly distinguish Kokoro synthetic whole-word audio, optional device fallback, and unavailable syllable recordings. Internal Kokoro phonemes are never presented as standard IPA.
- Abbreviations and selected pronunciation inputs received targeted corrections by the asset producer. No per-file human/teacher listening audit has been performed. Model/code source and Apache-2.0 notice are included at audio/LICENSE.txt.

## Existing v4 validation and boundaries

# Desktop release 4.0 validation

Date: 2026-10-04. Based on official live v3 source 0a91a07ba0b713554c3941a2dd381d53865b3b9d.

## Passed
- 26 Node unit/data tests, including five new tests for the active dual-layer scheduler, skill isolation, due boundary, assistance handling, old-state migration and custom validation. Old engine tests remain as compatibility regression checks; the active app schedules only through scheduler.js.
- 53 DOM interaction/storage checks using the actual app code in JSDOM. These cover all 14 module routes, custom create/edit/search/duplicate validation/delete-confirmation, all five basic training routes, correct EN/ZH error feedback, refresh without repeat scoring, assisted retry, due-only skill queue, custom sentence/usage/cloze, unavailable-audio feedback, explicit missing custom passage content, original pilot questions and result persistence, legacy preservation, and configurable short intervals.
- Pilot data: 20 words, 54 unique question IDs, all answer texts match the selected answer key, all per-syllable audio flags false and no audio assets claimed.
- Static JavaScript syntax and output byte parity checked by build-static.mjs.

## Browser/visual limits
An isolated Chromium launch failed because this execution environment denies the process socket. An approved retry had the same result. The cloud browser rejected the local preview address, and the test environment has no supported preview service. No restriction was bypassed, public tunnel created, or production-site browser opened.

Accordingly, the DOM checks are NOT browser rendering, 1024/1440/1920 visual verification, actual audio playback, or screenshot evidence. Desktop CSS targets these widths and was statically reviewed, but this release has no completed real-browser visual acceptance or screenshots. The prepared browser-v4.mjs suite remains for a future environment that supports it. The site should be checked visually on the user's desktop after publication.

## Product/content boundaries
- Official current grade 7 upper: 289 terms, ten unit groupings, 289 original memory hints/examples. No other grades included.
- Custom words: same core memory/translation/listening/dictation/written-recall, error and per-skill due schedule. User-written examples containing the target term support original-sentence cloze with their own usage schedule. Custom text is never interpreted as HTML. No automatically invented reading passage or meaning disambiguation.
- Phonics/context: 20-word pilot, 40 word questions, two original passages, six reading questions, six passage cloze questions and two structure checks. No automatic verified all-word syllabification, no licensed per-syllable audio. Whole-word device speech only; en-US required for pilot items.
- One active scheduler: configurable within-session steps (1/5 minutes default; 2/10 and 5/20 alternatives) plus 1/3/7/14/30/60-day progression. Per-skill records; no fixed scientific guarantee.
- Old overall progress/date/counters are retained in full legacy snapshots and original storage. Compatibility dates are serviced by the meaning queue; imported successes are not called independently verified meaning successes. Other skills start unverified.
- No account, recording, pronunciation scoring, paid API, cloud storage or cross-device synchronization.

## v14 / 4.8 correction and spacing
- 83 unit checks pass. Ten DOM suites pass, including actual dictation-error entry, make friends color-separated syllable buttons, failure-safe clip playback, three successful correction stages, hidden final listening stage, pause/reload, no duplicate penalty or strength gain, and honest uncovered-word fallback.
- Review All starts with 13 due word-skill pairs across 12 words; after the first independent answer, the same word's other skill is deferred without credit. The 12 distinct words finish continuously. Cooldown persists and schedules retain untested obligations.
- Automatic queues exclude a correctly answered word for at least 30 minutes and then honor each skill's later due time. Correction completion also delays the word at least 30 minutes. Explicit manual practice remains available. Strength 100 remains excluded from automatic practice and the active wrong-word book; a later manual error lowers strength and restores eligibility.
- Phonological analysis is triggered by actual dictation errors only. Coverage is 21 of 711 built-in entries; remaining 690 use whole-word correction. 29 static syllable clips are technically validated; synthetic output has not been human-listened or teacher-audited. Multisyllabic IPA audio labels are kept distinct from spelling support chunks.
- DOM tests simulate audio events; no actual browser speaker/listening audit is claimed.

## v15 / 4.9 sentence dictation and effective time
Sentence dictation contains 30 exact short source selections across 10 textbook units: two Listening Scripts sentences and one Section B 1b reading sentence per unit. Total quoted English content is 162 words, not full columns. Each card has Chinese translation, individual static Kokoro audio and independent input/grading. Unit entries follow the word section; sentence results are separate from word mastery. Thirty audio assets pass decoding, silence and clipping checks; no human listening audit claimed.
Effective practice time uses monotonic elapsed time and local calendar dates. Interaction/new exercise permits up to 30 seconds of thinking; genuine audio playback counts, loading/buffering does not. Navigation, result waiting, hidden tabs and blurred windows pause. Daily totals are local only, with no backfill. A renewable localStorage lease conservatively suppresses overlapping tabs; localStorage cannot provide a formal atomic mutex. This is an activity estimate, not proof of attention.
New tests cover sentence empty-then-valid submission, per-card draft retention, finite paging, source/unit filters, retry assistance, separate word records, parent navigation and reload. Timer tests cover idle, background, waiting, playback, midnight, wall-clock shifts, reload and cross-tab lease behavior. Audio state tests exercise waiting/playing/ended/stale callbacks and actual speech start.

## v16 / 5.0 five sentences per unit and custom practice
- 10 units now have exactly five sentences each in one list: 2 listening excerpts, 1 B1b excerpt and 2 explicitly labeled original extensions. The prior 30 English strings, IDs, audio hashes and voices remain unchanged. New20 synthetic clips pass decoding, non-silence and clipping checks; no human listening audit.
- Custom sentence CRUD uses stable local IDs, ordinary text validation, length limits, explicit delete confirmation, and escaped rendering. English content edits archive/reset only the affected practice; Chinese-only edits preserve it. Drafts and custom practice survive reload, and English is hidden during dictation.
- Free full-sentence automatic Chinese uses Chrome's on-device Translator API exclusively after explicit activation and potential language-model download. No fallback server receives sentence text. Feature detection and unsupported/error states are explicit. The API adapter and stale-result/manual-edit protections were tested with mocks; actual Chrome model download and translation were not exercised in this environment.
- 103 unit checks and all14 DOM suites pass. Dedicated custom-manager14 checks and expanded integrated sentence17 checks cover CRUD, English-only mocked translation, draft persistence, stale response rejection, manual correction protection, five-together layout and shared grading. Build validates every audio path.

## v17 / 5.1 cooldown scope correction
Root cause: global automaticWords filtering and renderSession pruning consumed word cooldowns across every automatic queue. Task-center lesson skills were therefore removed after the same word was answered in an earlier skill.
Cooldown now has explicit persisted session policy derived from the stable tracking origin. It applies only to memory-tracking queues. Task-center and primary new lessons preserve all25 planned word-skill stages; other practice modules and wrong-book entry no longer consume tracking cooldowns. Strength100 exclusions, per-skill daily credit limits and assistance protections remain.
Legacy lesson sessions with recorded cooldown skips recover their identifiable missing stages from the same word IDs; completed stages are retained, restored tasks receive no invented credit, and an incorrectly completed lesson becomes resumable. Correction completion sets the tracking cooldown without rewriting the skill's due date to enforce a global30-minute delay.
New DOM checks complete25 ordinary and25 primary stages, preserve later skills after correct answers and reload, restore shortened legacy lessons, and continue from three-round correction into the next scheduled skill. Tracking Review All continues to defer same-word duplicate skills without awarding credit.

## v18 / 5.2 first independent strength credit
Fixed the confirmed initial-study0% issue. The initial exposure interval no longer blocks a skill's first clean independent answer from earning5%. Subsequent credit still requires its due date and at most one credit per local day; hinted answers, immediate correction and previously failed assessments cannot exploit the initial-credit exception. No historical answers are backfilled.
Both regular and primary25-stage lessons now reach20% per word when all four skill answers are independently correct, including fast completion before the initial interval. Tests verify0→5 immediately, displayed feedback, saved/reloaded values, custom-word first credit, previous credits remaining due-gated, next-day due credit, and hint/retry exclusions. Earlier zero-credit clean events do not permanently block a later first credit. The misleading global-cooldown feedback wording is corrected to tracking-only.

## v19 / 5.3 Enter practice and same-day strength
A single Enter press submits/checks the active answer; a subsequent separate press advances feedback/next stages. Held-key repeats, IME composition, modifiers, open dialogs and multiline editing are guarded. Focused choice buttons retain their own answer action; no unfocused option is guessed. Sentence Enter targets only the active card and next Enter moves focus to the next sentence without submitting it. Click behavior and Ctrl audio replay remain. Audio-required stages cannot be bypassed.
The calendar-day strength cap is removed per the latest instruction. Explicit fresh ordinary practice may gain5% again that day without a review-date wait. Tracking review continues to honor due scheduling and word cooldown. Each skill still caps at25%, total100; hints, immediate retry and correction rounds do not gain credit. No historical scores are changed.
107 unit checks and18 DOM suites cover these changes. The main Enter suite has30 checks across word modes, all four adaptive modules, sentence focus, two-press grading/advance, repeat prevention, composition, modal and audio guards. The full correction flow also passes with Enter replacing all check/next actions. Same-day fresh practice reaches10% while a repeated key cannot duplicate credit.

## v20 / 5.4 unseen-only application practice
The old engine explicitly recycled all questions on review=true. The three requested modules now ignore that recycle request and never offer an old-question replay button. Question IDs, normalized content, structural text and authored semantic identities are persisted. Renaming characters, changing numeric details, changing IDs/titles or reordering options cannot manufacture novelty. Reading/cloze passages are reserved when assigned; a passage cannot enter a later new group. A pre-upgrade unfinished assigned group may finish its pending questions.
A separate browser novelty ledger is merged with adaptive history. The app's word-progress reset preserves application question history/ledger, and even replacement of only the main progress object does not reopen reserved items. Browser data deletion or a different browser/device remains outside this local-only guarantee.
Added72 authored original scenes:24 per requested module,6 per skill tag. Reading/cloze contribute48 independent passages; none duplicate old bank canonical text. These are finite offline supplementary questions, not a cloud-AI or unlimited runtime generator. Exhausting all old and new material reports no unseen scenes and retains unresolved needs; it never forces old answers as mastery. Original recordings remain; new context/cloze speech uses explicitly identified device English, with cloze playback locked until its answer is graded.
Old fixed context reference exercises and reading reference questions are read-only within these modules. Existing custom-example manual work and legacy pending sessions retain safe audio behavior.
Validation includes exhaustion of each old bank into exactly24 fresh scenarios, final no-recycle exhaustion, new same-concept remediation, persistent ledger/reset checks, passage dedup and name/number-only identity checks, plus original regression suites.
Final v20 checks:114 unit tests, all19 DOM suites and static build passed. The dedicated new-only DOM suite has25 checks. Imported generator/catalog/context/reading/cloze assets are byte-identical to the audited delivery. New-question synthesis is bounded authored content selection; no remote service is invoked.

## v21 / 5.5 letter-level correction comparison
Dictation and spelling wrong answers now show the expected spelling and exact submitted answer above the input. Edit-distance alignment isolates insertion, omission, substitution and adjacent transposition; a missing character does not mark the entire suffix wrong. Spaces and absent cells use visible symbols, swap cells have a marker, and every cell has a text/ARIA status. Comparison uses the same case/Unicode/apostrophe/hyphen/space normalization and accepted spellings as the actual grader; successful or blank answers never produce a fault box.
The original submitted string is persisted separately from editable draft state. Dictation's initial error and errors in all three corrective rounds show comparison. A wrong corrective result must be explicitly hidden before another attempt; the answer field is locked while feedback is visible. Enter performs that hide/retry action, and listening-only retry still requires audio completion. These comparisons do not add penalties, successes or strength points. Existing syllable colors remain separate.
Tests cover deletion/insertion/transposition/repeated letters, phrase spaces, sensitive and insensitive case, punctuation and accepted forms, Unicode normalization, HTML injection escaping, main/primary/custom words, initial and corrective reload state, comparison placement, blank/correct states, hide-on-retry and next-word cleanup. Existing correction-flow tests now include the explicit hide action and retain exactly three successful rounds.

## v22 / 5.6 shared three-round correction
Confirmed cause: automatic three-round remediation was entered only for dictation, while spelling still used the former single retry. Both modes now use the same three-success state machine. Round1 shows the correct word for copying; round2 shows Chinese and plays the word, with English hidden; round3 plays the word with both English and Chinese hidden. Round2 and3 cannot submit until an actual playback completion. Failed rounds repeat their stage after comparison is explicitly hidden; they do not increase successes or add scoring penalties. A speech error followed by an end event cannot unlock submission.
Round labels explicitly show1/3,2/3,3/3. Pause/reload retain stage, input and feedback; stale callbacks remain guarded. Old pending spelling errors enter remediation without being graded twice, and an identifiable old successful answer-copy retry resumes its remaining two stages. Only the third success unlocks continuation to the original queue.
The targeted DOM test covers both modes, main/primary/custom words, Enter transitions, held-independent checks, feedback visibility, no round3 target text in page/ARIA labels, audio gating, failed-stage retry, persistence and score stability. The rest of the existing interaction and audio regression tests remain required.

## v23 / 5.7 automatic answer caret
New answer inputs receive focus automatically in dictation, spelling, custom context, sentence cards and all correction stages/retries. First/next unfinished sentence focus is coordinated with the per-card Enter flow. Word and batch-entry dialogs focus their first meaningful text field; custom-sentence creation/editing focuses English. Existing drafts are never selected-all or replaced. Same-question redraws restore the current field and selection; timer/audio/translation status updates do not steal focus.
Focus is scoped to visible/enabled controls and active dialogs, with foreground/visibility guards. A disabled-field observer checks the current logical question and intervening user intent before focusing; stale nodes or newer routes cannot receive delayed focus. Scrolling is limited to the nearest view position when needed.
The actual Chromium harness was attempted in this environment but failed to open its local debugging endpoint within15 seconds. No actual-browser pass or visual QA is claimed. Four controller tests and the15-check integrated DOM flow cover first/next/retry, three correction stages, audio gating, sentence cards, caret/draft preservation, toolbar/modal/background guards, asynchronous status changes and dialogs; regression suites remain required.

## v24 / 6.0 fixed-collocation learning
Added a separate, local-only phrase store (`word-garden.phrases.v1`) with independent IDs, four skill scores, per-skill due dates, history and custom data. No word/sentence progress is migrated or inferred. A complete DOM lesson asserts the original main progress storage remains byte-identical.
The final authored bank contains60 entries:42 with verified textbook unit evidence and18 thematic extensions,122 appropriate preposition/form/structure tasks, and360 globally unique original transfer sentences (6 per entry). Canonical phrases and main examples have120 static Kokoro clips, alternating af_heart/am_michael by entry and sharing one voice within each pair. Every exact text, mapping and file SHA was checked; technical decode/level checks passed. No human listening audit is claimed.
Five-entry lessons contain actual study, meaning choice, applicable grammar structure tasks, Chinese-to-full-phrase recall, dictation and fresh-scenario transfer. Variable patterns explicitly require the stored pattern in complete-recall tasks; concrete context tasks use curated variants. Errors enter three successful correction rounds (visible copy, Chinese+audio, audio only), then an unseen transfer item. Correction gives no extra points or penalties. New transfer exhaustion is explicit and does not block other skills. Old passages cannot become new by replay.
Meaning/listening choices have stable-per-attempt varied answer positions. Listening review is audio-gated choice work; new lessons include full typed dictation. Independent success adds5 up to25 per skill; wrong subtracts5; hints/copy/correction add0. Same-day independent credit is allowed. Due intervals are1/3/7/14/30 days, mistakes shorten to1 day, successful automatic tasks leave the current due cycle,100 exits automatic review and a manual error reactivates it. Grammar structure tasks count toward spelling/structure accuracy; only genuine fresh transfer tasks count toward context.
The original memory tracker can switch to phrase tracking with Review All. Related existing context/reading/cloze items are linked only when their completed text contains the phrase, use the existing unseen-only engine, preserve unfinished work and return to the phrase parent. Entry-level textbook and theme filters are separate from custom entries.
Custom phrases support verified built-in matching, manual fields, bounded/escaped input, partial capability disclosure, safe exact-example gaps, stable IDs, edit archival/reset, and confirmed deletion. No cloud translation or invented grammar is used. The practice timer, Enter, Ctrl replay and autofocus integrate with the existing controllers.
Actual Chromium QA was attempted again; its debugging endpoint did not start within15 seconds. Only unit/DOM verification is claimed, not a real-browser pass.

## v25 / 6.1 sentence-card UI, timing, audio preparation and blank space cells
- Sentence book displays a single shared learning card; dictation displays one current sentence with audio and Chinese above a multiline answer, feedback below, previous/next and completion. Preserves stable IDs, saved results and drafts; migrates the old six-card page cursor once.
- Enter submits once and a distinct press advances; Shift+Enter preserves newline, Ctrl replays the current sentence. Empty then valid submission, wrong retry, long input, custom/official records, parent navigation and autofocus covered.
- New requested timing: 60-second real-input/click/key activity window after study begins, including in-app navigation/loading/waiting. Rendering and loading callbacks do not renew it. Actual playback continues counting; blur/background excluded. Old totals retained. Midnight, multiple tabs, suspension and reload tests pass.
- Bounded two-load background prefetch for current/next sentence, next word and phrase/example. Replays refresh LRU recency; playback-start promise has a 15-second limit. HTTP 401/403 is not retried in this controller. No new audio synthesis, voice substitution or production-network workaround.
- User screenshot was materialized and visually inspected. The visible space glyph rendered as SP in its font; replaced with blank bordered cells retaining error colors and accessible labels, without changing actual answers or normalization.
- 136 unit tests passed. All 24 existing DOM suites pass after updating obsolete list-layout assertions; focused final reruns cover 32 Enter checks, 22 standalone sentence cases, 20 integrated sentence/book cases, 15 autofocus checks, audio buffering, phrases and timing. Static build verified 2,213 files.
- Real Chromium was attempted in the current environment and failed to open its local debugging endpoint. No real-browser visual, audio listening, or production latency verification claimed. No attempt to bypass the previous production 403 restriction.

## 1.11.0 direct answer-feedback timing
- Inspected the user's screenshot: a completed translation/meaning answer in an unfinished learning session.
- v25 already counted when reaching feedback through a normal answer, but a directly restored graded session did not initialize its activity window. `practiceEligible` now accepts unfinished normal word sessions with graded feedback as well as answer entry. No historical total or grading mutation.
- 17 timer DOM checks pass, including direct feedback reload, exact60-second cutoff, no renewal from timer refresh, interaction resume, preserved previous total and background exclusion. The 13 core timer tests pass; static build verified.
- Uses v25 verification limits: no new browser attempt or workaround, no production-resource request.

- User-facing and package version explicitly renamed to1.11.0; storage keys, IDs and schema versions unchanged. Supersedes the undeployed6.2 source save.

## 1.11.1 clear and consistent correctness feedback
- Materialized and visually inspected the user's whont versus I'd like to screenshot. Expected/input rows were not swapped; the old target styling colored mismatches green while matching t stayed white. Corrected semantics: both matched cells green, wrong entered cells red, expected replacement cells neutral. Explicit upper/lower labels retained actual data and edit-distance alignment.
- Added concise wrong-letter/omission/extra/transposition summaries, symbol-plus-text titles, larger sans-serif feedback, spacing, stronger borders and polite status messages without focus movement. Empty space cells preserve error borders.
- Fixed sentence wrong-result styling: its incorrect class previously missed the wrong-only CSS and inherited the green panel. Word/sentence/phrase panels now use explicit correct/incorrect outcome attributes, consistent shapes, text and colors.
- 136 unit tests passed.20 new DOM/CSS checks cover the screenshot's match t, correct/incorrect rows and colors, insertion/deletion/substitution/transposition, spaces, long phrases, accepted correct answers and actual sentence success/failure panels. Existing word diff,60 three-round correction checks,31 phrase checks,20 sentence integration checks,32 Enter checks and15 autofocus checks pass. Static build verified2213files.
- Guidance: W3C Error Identification, User Notification and Cognitive Accessibility Provide Feedback. Does not assert all people with dyslexia share one preference or claim a clinical outcome. Real browser verification remains blocked by the previously verified current-environment Chromium endpoint failure; DOM/CSS checks are not screenshot or human reading tests.

## 1.11.2 compact feedback appearance
- Scoped visual restoration only; no whole-version rollback. Explicit upper/lower answer rows, green matches/red entered errors/neutral targets, blank spaces and sentence incorrect-panel correction retained.
- Removed large symbols and oversized/heavy feedback styling; kept compact text and status semantics.
- 20 DOM/CSS checks passed including 1px sentence result borders, no large symbols, correct shallow red/green result backgrounds and unchanged character colors. Word difference20, three-round correction60, phrase31 and sentence integration20 checks passed. Build verified2213files. Existing real-browser limitation remains disclosed; no new claim of screenshot verification.

## 1.11.3 monotonic overall memory strength
- Word and collocation totals preserve existing values and increment10 per normal correct answer, capped100, independently of historical per-skill25 points. Errors never decrement. Correct-context assessment paths covered; sentence dictation remains separate.
- All135 unit tests passed; all25 DOM suites passed with obsolete +5/deduction assertions updated to the new user rule. Final focused scoring suite17 tests passed. Additional actual DOM strength checks prove legacy25→35 in the same skill, duplicate-submit protection, wrong-after-reload remains35, initial10, custom-word10, visible feedback and stored totals.11 focused strength checks passed.
- Existing100 still exits automatic/due/wrong-book queues and never decays or reactivates after a manual mistake. Hints/immediate copy/three correction rounds remain0 credit and0 penalty. Primary/main/custom isolation and complete task-center flows retained.
- Build verified2213 files. No new real-browser visual or human-listening verification is claimed; this update changes scoring and rules text only.
