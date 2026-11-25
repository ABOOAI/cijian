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

Date: 2026-10-05. Same Site/audience; no login or model API added. Existing browser-local word records are retained.

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

Date: 2026-10-04. Existing Site, same public audience and URL; no progress schema change.

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
An isolated Chromium launch failed because this execution environment denies the process socket. An approved retry had the same result. The cloud browser rejected the local preview address, and this executor has no supervised Sites preview service. No restriction was bypassed, public tunnel created, or production-site browser opened.

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

## 1.11.4 custom expressions and immediate practice (2026-10-21)
- Verified original Sites source: project appgprj_6ac0e75ad0f88191b6830586ec03911a, saved version30, commit fbe2b6c1372c491d81daff42cb42556b5f774b5e. Fresh checkout was clean; no prior local files or personal browser storage were modified.
- Final npm test:152 passed,0 failed. Includes15 phrase-core tests and12 custom-editor DOM tests. QA-only JSDOM is outside the Site; tests/qa-dom.mjs uses WORD_GARDEN_JSDOM or an installed jsdom package. No application dependency was added.
- Real isolated Chrome browser:31 checks passed,0 runtime errors. Covers dictionary/manual meanings; blank/duplicate validation; save-only and Enter-save-and-study; refresh; all four supplied learning skills; three corrections without extra credit; wrong history; due review; finite context exhaustion; separate browser profiles; legacy blank meanings and accepted variants; unrelated custom-word storage preservation; quota failure rollback and retained draft. Device speech completion is mocked for deterministic gating; voice quality was not assessed.
- Desktop screenshot checked at1366x900: clear two-column entry fields, visible focus, primary/secondary actions, no horizontal overflow. Evidence remains in ignored evidence/custom-phrase-editor.png and evidence/custom-phrases-browser.json, outside the deployed static file list.
- Browser regression found and fixed blur-triggered lookup moving the save button between pointerdown/up. Explicit lookup and submit-time lookup remain. The local server now serves existing .mjs imports with JavaScript MIME type. The Sites build helper's Windows npm shim failed; direct npm run build succeeded and verified2213 public files, including711 word audio files. Final build repeated after the last UI repair.
- Hosting identity and storage keys/schema are unchanged. This app still has no login/account synchronization: isolation is by browser profile and origin. No personal learning records are in source/artifacts. User-supplied matching examples enable finite context exercises; missing examples or new transfer scenes are not fabricated.

## 1.11.5 direct homepage expression entry (2026-10-21)
- The user confirmed the live footer already read 1.11.4; the issue was that the changed form was inside the management screen while the phrase landing page looked unchanged. Public HTML/scripts matched the deployed source, with must-revalidate/max-age=0 caching.
- The phrase landing page now shows the shared English/Chinese entry form before filters and lists. Existing lookup, validation, immediate learning and management/edit behavior are reused. No storage schema, progress or Site identity changes.
- Full npm test passed 157/157 before the final targeted fixes; the affected custom-UI suite then passed 19/19 including two additional regressions. The final changes also address filtering after a persistence rollback and prevent list pagination/filtering from pulling focus to the homepage form.
- Actual Chrome through CUA on a new localhost port verified the visible two-column form and initial English focus, ECDICT lookup, manual Chinese correction, save-only with list display, refresh retention, Enter starting the existing lesson, and a correct meaning answer increasing strength from 0 to 10. Reload retained both synthetic entries and the strength value. No console errors were observed. Tests used localhost only; no test entries were added to production.
- npm run build succeeded, verifying 2213 public files and 711 word audio assets. The 1.11.4 full correction/review/audio-gating results remain applicable; this follow-up does not modify the learning engine.

## 1.11.6 今日学情（2026-10-21）

- 基线是原 Sites 第 32 版、应用 1.11.5，源提交 `273411dafc354373b4d928797e6deda7c8eb0032`；工作树初始无未提交修改。继续同一个 `appgprj_6ac0e75ad0f88191b6830586ec03911a` 项目，原网址与 public 权限不变，不发布 GitHub Pages。
- 核实旧数据边界：单词最多保留 16 条强度事件，句子保留最近结果，三轮订正没有完整历史；搭配和语境保留部分带时间事件。旧记录不足以得到统一完整的今日首答率，因此不导入旧题次，新版起单独采集；已有每日总时长保留。
- 全套 `npm test`：188/188 通过，无失败、无跳过。包括新增 18 项统计/持久化测试、7 项真实 app 的 DOM 集成测试、4 项展示测试。覆盖零学习、单模式、首错及完整三轮订正关联、提示/自评排除、听力/搭配/句子分类、刷新幂等、跨日/时区、独立存储、多标签页、格式损坏/配额/读取失败、导航不改成绩、旧键字节保留和既有时长读取。DOM 音频使用确定性替身，不声称人工试听。
- 本地隔离 Chrome：15 项检查通过，无运行时异常。覆盖 1024/1366/1920 桌面无页面横向溢出、入口、实际焦点与回车提交、首错和订正分离、刷新持久化、复习只导航、原固定搭配首页输入仍可见。检查了桌面截图。使用全新测试配置及 localhost，不读取用户日常浏览器资料、不清理用户存储、不添加生产测试词条。
- 构建验证 2215 个静态文件，包含 711 个单词音频。个人数据、测试配置和截图均不在发布白名单；证据位于忽略的 `evidence/daily-insights-browser.json` 和 `evidence/daily-insights-desktop.png`。
- 规则复核：音频播放和重绘不生成作答事件；单词/搭配本轮首答、句子/语境原模式首次记录与订正分开；订正不进入首答分母。所有分析是本机透明规则，没有外部 AI 请求或数据上传。

## 1.11.7 custom learning update — 2026-10-30

Base verified against official Sites version 33 / source 73953a7f1f5bdc9d6054adfc6899160a4acd7416 (live deployment succeeded), not an old local backup.

- `npm test`: 220 tests passed, 0 failed (QA JSDOM installed outside the Site).
- New adapter tests: original IDs/data preservation, no retroactive credit, English-edit/archive, removal and Chinese/group preservation.
- Real-app integration: all five modes, common +10 scoring and scheduler, no duplicate award after reload, Enter/held Enter and focus, long sentences, missing en-US voice locking audio-only submission, transactional storage failure rollback and safe retry.
- Speech tests: only real start/end events count; strict US voice selection, no-voice/start/end errors, cancellation/stale events, repeated voice discovery.
- Sentence save tests: false/throw failures preserve original data/drafts on editing and deletion.
- Existing textbook, phrase, correction, scheduler, keyboard, daily-insight and vocabulary suites remained green.
- Browser preview: actual custom sentence authoring/save and navigation inspected. Real device voice availability and sound quality are environment-dependent and cannot be inferred from mocked speech tests. No remote speech provider was installed or claimed.

## 1.11.8 discoverability and sentence-first correction — 2026-10-30

User screenshot confirmed 1.11.7 was loaded, but the sidebar lacked a separate “自定义句子” item. The prior in-page management link was insufficiently discoverable. Added a stable sidebar route and per-sentence practice/audio controls, reusing the original sentence data and 1.11.7 scoring implementation.

`npm test`: 223 passed, 0 failed. New real-app coverage verifies direct sidebar add form, creating a complete sentence (no word splitting), five modes from both existing and new entries, reload/deep-link recovery, return navigation, old progress preservation, and no unrelated phrase storage creation. Real preview also confirmed the original previously saved sentence remains present and new sentence authoring works in the independent route.

## 1.11.9 — Independent sentence tracker

- Full Node suite: 229 tests passed, including 6 new real-app JSDOM integration tests for the sentence tracker.
- Covered: sidebar/deep-link entry; one progress list; 50 built-ins + existing custom sentences; preservation of original word/legacy sentence data; all five practice modes; recorded-audio completion gates without device voices; normalization; +10 and duplicate/reload protection; return route; 30-minute cooldown; retained other-skill obligations; distinct word/sentence review-all queue ownership; 100% automatic exclusion and manual wrong answer without score loss.
- Build verifies matching source/output artifacts and every existing canonical, sentence and phrase audio path.
- Managed cloud-browser preview: checked new entry and range/queues; original sentence recording reached playback completion and enabled dictation submission; submitted full sentence and observed 0% → 10% correct feedback; checked screenshot. This verifies actual playback lifecycle, not a subjective audio-quality audit or every user's device voice availability.

## 1.12.0 — Genuine local Kokoro for custom content

- Full Node/JSDOM suite: 240 passing tests, including 9 new controller tests and 2 additional real-app integration checks. QA dependency installed outside source; run with `WORD_GARDEN_JSDOM=/tmp/cijian-kokoro-qa/node_modules/jsdom/lib/api.js npm test`.
- Coverage: stable alternating voices across reload/text edit, generated-audio cache reuse, actual player-ended gate, cancellation/stale worker and player callbacks, failed/invalid/timeout generation, no automatic speech fallback, explicit en-US device fallback, all pre-existing scoring/storage/route regressions.
- Managed Chromium preview, real self-hosted q8 model/WASM (not mocks): saved an arbitrary full custom sentence, generated female af_heart audio and observed playback ending; replay started immediately from cache. Added a separate custom word, observed male am_michael generation and disabled submission until audio completion; submitted correct dictation and observed 0% → 10%. Navigating away during playback cancels it. These are playback lifecycle checks, not a blanket pronunciation/human-quality audit.
- Asset validation: pinned model/runtime chunks recombine to original SHA-256 digests; all vendor artifacts below25 MiB static limit. No personal learner records or generated user WAVs are packaged in source.

## 1.12.1 — Kokoro-only playback

- Audited every UI playback caller: no application call to device playSpeech, speechSynthesis or SpeechSynthesisUtterance, and no device-fallback control remains. The unused legacy low-level speech method retains its historical unit tests but is not wired into the application; the application explicitly passes null synthesis and utterance constructors.
- All prerecorded manifest families identify Kokoro-82M American English, including syllable clips. Existing MP3s and assignments are unchanged.
- Added integration coverage for custom phrase + example Kokoro generation, same-entry voice stability, no device fallback, stopped/stale playback and failure retry while grading remains locked. Updated the earlier device-fallback expectations to the new Kokoro-only requirement.
- Node suite runs with QA-only JSDOM under /tmp; no test dependency is shipped. Initial run lacked JSDOM (180 passing, six test-file import failures); installing the isolated QA dependency resolved that environment issue.
- Static build verifies 2,242 assets with byte checks, including 711 canonical whole-word recordings. Release/import cache keys updated to 1.12.1 for changed modules.
- Browser QA uses isolated localhost preview data. Custom phrase playback has been observed progressing through Kokoro initialization to completed playback. This is a functional playback check, not a human listening review of all utterances or a guarantee for every browser/device.

- Final automated result: 242 tests passed, zero failed/skipped. The new multi-playback integration waits for the second audio element before firing its completion event, avoiding a stale mock callback race. Phrase Stop now immediately displays 已停止。

## 1.12.3 · Replay and sentence center (2026-11-04)
- Aggregate `npm test`: 264 passed, zero failed (QA-only jsdom from /tmp/cijian-qa; no runtime dependency added).
- New regression suites cover same-scope replay, fresh drafts/answers, unchanged credit and schedules, archived history, reload, repeated clicks, completed reading passage order, and no silent overwrite of pending work from the sentence center.
- Browser QA: task-style sentence center renders, textbook sentence memory starts, five-item round completes with replay next to return action. Replay restarts the same first sentence. Full all-mode behavioral coverage is via DOM/engine tests; no exhaustive audio listening or mobile device test claimed.
- Static build validates 2,242 assets including all 711 canonical word recordings. Public access and project ID preserved.

## 1.12.4 verification
- Latest published source 1.12.3 was opened and synchronized before editing. Current public audience and original Site identity are preserved.
- Existing 264 npm tests passed with QA-only jsdom. New actual-app integration tests exercise all four mastered practice modes, complete >15 queues, scope and sentence exclusion, saved/reloaded progress, pending confirmations, Kokoro completion/error gating, unchanged 100% mastery, and complete schedule pagination with bounds/back/scope and sentence-page isolation.
- Managed browser QA: actual new local lesson introduced 9 scheduled abilities; first page showed 6 and next page 3, previous restored page 1. Verified the sixth card, four mode choices, empty-state disabling, matching visual styles, top/bottom page controls and table containment at 1165×747. Browser QA used isolated local preview, not the user's production learning store.
- Existing 711 canonical audio assets and local Kokoro paths were not edited. No claim of new perceptual audio QA. Preview input came from synthetic local practice only.
- Static build validates all 2242 deployed file copies. Version labels do not clear or migrate learning data.

## 1.12.5: complete learning backup and shared list pagination (2026-11-07)

- Combined command: `WORD_GARDEN_JSDOM=/tmp/mastered-review-qa/node_modules/jsdom/lib/api.js npm test`.
- Result: **346 tests passed, 0 failed** (279 existing tests, 47 backup/validation/UI tests, 20 pagination tests).
- `node build-static.mjs`: 2246 public files verified by SHA-256 source/output comparison, including all 711 canonical word audio assets.
- Backup validation covers version/time/necessary payload fields; known legacy stores in a versioned envelope; absent historical optional fields; unsupported/raw fragments; malformed JSON; unsafe prototype keys; excessive nesting/text/UTF-8 size; nested correction/session/draft shape; invalid phrase IDs; adaptive/word/phrase active reference catalogs.
- Backup behavior covers export/import round trips; stable-ID deduplication; repeated-import idempotence; local content/progress coherence; exact-copy adaptive attempt deduplication without treating question IDs as attempt IDs; no addition of cumulative scheduler, error, mastery, time or star counters; completion/draft/correction preservation; replace confirmation; unrelated localStorage preservation; and stale-tab write refusal.
- Fault injection tests fail each staged write and pointer write for both legacy and already-restored storage. Original live records remain byte-identical on failed staging or pointer commits. Ordinary failures, interrupted cleanup and changes after preview are also covered. Real browser quota exhaustion was not induced; it is covered by deterministic Storage fault injection.
- Actual app DOM integration exports all real saved stores, validates/cancels/rejects files without altering learning records, checks overwrite cancel/accept, reloads imported words/sentences/phrases/settings/drafts, retains real word and phrase corrections/completed sessions, and proves nonempty answer events do not duplicate after repeat import.
- CUA browser QA on the supported local Sites preview: downloaded a real JSON backup; selected that file; saw correct backup timestamp/counts/mode/impact; opened and cancelled the overwrite confirmation; safely merged the same file; observed the post-import reload and explicit no-duplicate result. Visually checked the settings backup section. Following integration, checked the 343-item preparatory list renders 58 pages and changes page 1 to 2 with correct 7–12 range and focus.
- Pagination worker additionally verified preparatory last-page jump, phrase bidirectional controls/focus, independent sentence tracking lists, and cloze 128-passage pagination in CUA. Automated tests cover full list access, boundaries, search/filter resets, page history, independent lists, and no first-10 truncation in daily priorities.
- No application errors were observed in the tested UI flows. The browser's extension emitted unrelated metadata errors. Separate mobile-viewport/device QA was not available through the supported browser API; responsive CSS is retained, but no mobile-device pass is claimed.
- Learning data is localStorage only in this version. No application learning IndexedDB exists. Cache API models/audio are regenerable and intentionally excluded; stable voice assignments are backed up. Import needs spare storage for staging and asks the learner to close other Cijian tabs.

## 1.12.6: optional Supabase cloud sync (2026-11-11)

- Full regression command with isolated QA JSDOM: **351 tests passed, 0 failed**. Static build verified **2,250** copied public files by SHA-256, including 711 canonical word recordings and the pinned Supabase browser client.
- Added browser-safe Supabase email-link authentication and an explicit local-first sync control; anonymous/local learning remains available.
- The production table and RLS policies are user-owned by `auth.uid()`. Source contains only the public project URL and publishable key; no Supabase secret, service-role key or database password is used.
- Sync reuses the validated `cijian-learning-backup` envelope and safe merge rules. It uploads the complete merged snapshot before committing cloud-only records through the existing atomic localStorage generation switch. Timestamp-conditional updates refuse concurrent cloud overwrites.
- Added focused tests for first backup creation, cloud/local union, same-ID local precedence, invalid-cloud fail-closed behavior and concurrent-write refusal before local commit. Existing JSON file backup remains independent.

## 1.12.7: required accounts and cloud-only progress (2026-11-11)

- Full regression command with isolated QA JSDOM: **355 tests passed, 0 failed**.
- Static build verified **2,253** copied public files by SHA-256, including all 711 canonical word recordings, the pinned Supabase browser client, login gate and cloud-only storage adapter.
- New gate coverage proves signed-out visitors see the login screen rather than the learning UI, username/password authentication uses the reserved internal account identity, and only a successful session initializes account storage and loads the application.
- New storage coverage proves initial hydration comes from the authenticated user's RLS row, two accounts remain independent, no browser learning store is shared, successful changes reach the correct account, and failed writes remain visibly retryable without false success.
- Existing JSON tests remain green. Cloud-mode restore now waits for the restored snapshot to reach Supabase before reload. Sign-out similarly flushes pending learning changes before ending the session.
- Production application code has no localStorage learning fallback. A local adapter remains reachable only on `.invalid` QA origins so the established real-app regression harness can exercise the learning UI without a production account.
- Old browser-local records are neither read nor deleted in production. This release does not silently migrate them to the first account.

## 1.12.8: responsive current-device sign-out (2026-11-11)

- Full regression: **357 tests passed, 0 failed**. Static build verified **2,253** copied public files by SHA-256, including all 711 canonical word recordings.
- Account storage ignores byte-identical writes and removal of absent learning keys, preventing settings flushes from manufacturing an unnecessary Supabase update.
- Sign-out keeps the final cloud flush, replaces the settings view with an explicit progress screen, and uses Supabase's local scope. The local `SIGNED_OUT` event releases the page without waiting for the best-effort remote refresh-token revocation request; other devices remain signed in.
- Focused regression coverage verifies redundant writes do not enter a pending/saving state and that current-device sign-out resolves from the local event even when the remote request remains pending.

## 1.12.9: five-minute cloud batches and large-history performance (2026-11-12)

- Full regression: **360 tests passed, 0 failed**. Static build verified **2,253** copied public files by SHA-256, including all 711 canonical word recordings.
- Automatic account uploads are fixed five-minute batches; later mutations do not postpone the first scheduled batch. Backgrounding, page exit, account exit, manual retry and JSON restore retain their immediate flush paths.
- A slow request no longer loops continuously behind per-second effective-time changes. Flush captures a bounded starting revision; changes arriving during that request remain pending for the next batch.
- Account-memory key enumeration is indexed, daily insight snapshots reuse their validated event cache, ordinary cloud writes avoid full backup validation/merge, and the 15-second timer no longer reconstructs the current page.
- Synthetic 20,000-event diagnostics reduced account snapshot enumeration from about 2.7 seconds to about 22 milliseconds, immediate in-memory flush preparation from about 4.3 seconds to about 73 milliseconds, and daily report opening to about 211 milliseconds on this executor. These are diagnostic timings, not guarantees for every device or network.


## 1.13.0 · 单元循环验证（2026-11-17）

- 从 Sites 最新 v46 源码 dc4dc6881e5c6fd8dd2955427947b1ff077ccfb9 打开并修改；未使用旧 GitHub checkout。
- 用户截图已通过 Library 在当前环境读取并检查像素，确认目标为「教材与单元」及第3单元43/43。
- 新增9项实际 app DOM 集成测试，全站369项回归测试通过；最终应用版本标记与导入路径调整后，登录/云端存储/备份/单元循环69项针对性测试通过。
- 验证所有教材与补充单元完整词集；第3单元43词215步骤；100%、未来到期、暂缓词；同单元续练与刷新；切换取消与历史保留；下一轮新ID和同日+10；提示和三轮纠错不加分；重复提交及重复备份导入去重。
- 浏览器检查电脑1180px窗口及390px手机iframe（内容宽375px）：43/43已学单元可进入全43词，下一步和暂停后续练正确；手机任务页与练习页无横向溢出。测试使用隔离的合成进度，不连接或修改真实用户账号。
- 手机导航改为横向滚动，卡片和学习布局响应屏幕尺寸；保留电脑布局。
- 本地QA页面在打包前删除。未验证真实用户账号登录后的线上端到端云保存，既有云端逻辑通过回归测试，未改写真实学习数据。
