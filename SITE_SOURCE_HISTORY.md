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

The four context modules now have an original finite 512-question bank (128 per module), immediate per-option feedback, taxonomy-based remediation and device-local persistence. Each module has four concepts and 32 variants per concept. Reading contains 32 passages with four consecutive questions each; cloze contains 128 independent single-gap passages. Reading finishes a complete passage before addressing the same concept in another new passage. Retired single-question reading supplements remain available only for history and unfinished legacy sessions. A failed concept needs two consecutive first-attempt correct answers on unseen questions to complete this round's remediation. Replaying a previously seen question never counts as independent verification. All-new questions are exhausted before explicit old-question review is offered; unresolved concepts remain unresolved when variants run out. The learner can pause, navigate away, reload or stop. Existing skill schedules are not inflated by these content checks.

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

### Custom expressions ready for practice (1.11.4)
Fixed collocations now accepts a whole collocation, phrase or advanced single word in the existing local manager. The primary action saves and immediately opens that entry in the existing lesson; a secondary action only saves. The existing textbook/ECDICT lookup can fill Chinese meanings, with manual corrections protected against stale asynchronous results. New entries require English and Chinese; legacy entries without Chinese still load without migration. Duplicate checks use normalized English.

The existing study, meaning, spelling, listening, three-round correction, history, memory-strength and scheduled-review flows are reused. Optional learner-supplied examples enable the existing finite context exercise only when the target expression occurs as a complete expression in the example. No missing example or unseen transfer scene is invented or represented as verified content; the interface states this limit. Custom speech remains device English synthesis.

The Site remains the original public project and URL. No login or cross-device sync has been introduced: personal expressions and learning state remain isolated by browser profile/origin under the unchanged storage keys. No personal learning data is included in source or deployment artifacts. Failed local persistence does not report a successful save. The release number never controls storage migration or clears progress.

### Direct phrase-page entry (1.11.5)
The fixed-collocation landing page now exposes the custom expression form directly above the filters and learning lists. Learners can enter English and Chinese, look up a meaning, and save or start learning without opening the manager first. The homepage and management/edit screen share the same form validation and persistence path. Existing records, practice state, storage keys and the production URL are unchanged.

## 今日学情（1.11.6）

左侧“今日学情”（`#daily-insights`）汇总本机自然日的有效练习时长、已记录作答题次、无提示首答正确率、当前到期能力，以及各模式的首答、错误、提示、自评和订正。易错清单只依据实际错误事件生成，可进入原学习入口；点击不会改变成绩或替换未完成练习。

逐题统计从首次使用本版开始。原有单词仅保留有限强度事件，句子仅保留最近结果，订正没有完整日历史，因此不回填旧首答率。已有每日活动时长继续显示，但不能拆成各模式时长；未记录显示“未记录”。听音次数不代表听力掌握率，小样本不作能力判断。

新增 `word-garden.daily-insights.v1` 元信息与 `word-garden.learning-event.v1:` 独立事件键，原进度键、词条 ID、成绩、学习模式和 Sites 托管项目保持兼容。事件按本机作答日期持久化，提交去重，多标签页采用独立事件键；读取、格式或存储失败会明确显示统计不可用，不覆盖异常旧数据。无远程上传、外部 AI/API，也没有新增账号同步：学习空间仍按浏览器配置和站点来源隔离。

测试可用 `WORD_GARDEN_JSDOM` 指定 QA 专用 JSDOM 路径后运行 `npm test`。真实浏览器回归使用 `TEST_URL` 和 `CHROME_PATH` 运行 `node tests/browser-daily-insights.mjs`，每次新建隔离测试配置。构建命令为 `npm run build`。

## Custom word and sentence learning (1.11.7)

The 自定义单词 page now lists custom words plus existing custom sentences without copying or renaming their stored IDs. Each item and filtered group offers memory, meaning translation, listening, dictation and written recall. Sentence adapters use the same scheduler, mastery scoring, correction flow and tracking cooldown as canonical words (currently +10 per clean success, cap 100, no loss on an error; guided correction never earns new strength). Existing sentence-only dictation history remains intact; it is not retroactively converted into word mastery. English edits archive that sentence's learning state and invalidate the old active session; Chinese/group edits retain it. Missing legacy Chinese must be filled before meaning-dependent modes become available. Storage keys and public audience are unchanged; this remains browser-local, not an account-sync service.

Custom audio requires an actual `en-US` device voice. Playback starts and completion are confirmed by speech events; missing voice, start/end timeout, failed speech, cancellation and stale callbacks cannot unlock listening answers. No remote TTS request, payment or API key was added. Voice availability depends on the browser/OS; this release does not promise downloadable recordings for arbitrary text. Sentence spelling accepts the existing sentence normalization (case, punctuation, spaces and explicit contractions); different words/order still fail.

Run tests with an existing QA-only JSDOM via `WORD_GARDEN_JSDOM=/path/to/jsdom/lib/api.js npm test`, then `npm run build`. The Site itself remains dependency-free.

## Direct custom sentence workspace (1.11.8)

“自定义句子” is now a permanent sidebar route (`#custom-sentences`), with its own add/edit form. Existing and newly saved sentences expose all five practice modes plus en-US playback directly in that page, without navigating through custom words. Refresh/deep links reopen the same workspace. The existing sentence store and IDs are reused; no sentence is split into invented vocabulary. The sentence-book page also links directly to this workspace.

## Independent sentence memory tracker (1.11.9)

Adds a permanent `#sentence-track` module alongside, not in place of, the existing word tracker. It reuses the 50 existing textbook-selected/original-extension sentences plus browser-local custom sentences, without duplicating authoring IDs or rewriting the legacy sentence-dictation results. Built-in sentences do not enter word curricula. Custom sentences share their previously established learning records with their existing practice entry points.

The tracker exposes range/search, per-sentence strength and five manual learning modes, independent translation/listening/dictation/spelling due queues, review-all/quick review, next schedules, pause/resume and mastered manual practice. It calls the same scheduler/mastery/correction code as words: +10 for clean success, no loss on error, no credit for hints/corrections/repeated submission, 100% excludes automatic review, tracking-only same-item 30-minute cooldown, 1/5-minute short steps and 1/3/7/14/30/60-day ladder. Sentence practice never scores component words. Original sentence MP3s and custom en-US device speech are reused.

Existing storage keys, word routes, public audience and Site identity remain unchanged. No historical dictation answers are converted to new mastery. No network AI, generated sentences, paid speech or account synchronization is added.

## Custom Kokoro speech (1.12.0)

Custom words and sentences now use genuine Kokoro-82M v1.0 q8 synthesis in a dedicated browser worker. The existing `af_heart` / `am_michael` American voices alternate for new local entries and remain stable by ID; speed is 0.9. Canonical recordings remain untouched. Learning, tracker, sentence manager, sentence dictation and corrective playback route custom content through this engine, retaining actual audio-ended grading gates and cancellation on navigation.

All runtime/model/voice assets are pinned and self-hosted under `vendor/kokoro/`; the first custom playback downloads approximately 112 MiB, then browser caches reuse model and voice assets. No custom text is sent to a synthesis server. Generated WAVs use a separate bounded local Cache Storage (64 entries) keyed by model, text, voice and speed; English edits generate new audio, without changing the stable voice. Cache failures only remove reuse, not learning records. Unsupported browsers, network/model failures and synthesis timeouts are explicit; browser en-US speech is only a clearly labeled manual fallback, never silently substituted for Kokoro.

This requires a capable modern browser and enough memory for the local model. First-load and generation latency depend on device/network; the q8 browser model is the same Kokoro model family/voices, not bit-identical to old full-precision offline MP3 rendering. See `vendor/kokoro/PROVENANCE.md` and included licenses for exact sources and hashes. Release versions do not migrate or clear existing learning stores.

## Kokoro-only playback (1.12.1)

Every learner-facing playback route now uses Kokoro American English: words, sentences, phrase/collocation entries and examples, generated/custom context examples, reading and cloze passages, explanation text, correction and available syllable clips. Existing Kokoro MP3s and their voices are preserved. Text without a recording uses the same self-hosted local Kokoro worker. Custom phrase/example playback shares a stable entry voice; other generated text has a stable text identity. New identities alternate af_heart and am_michael, preserving saved voice assignments.

Device-speech fallback buttons and application device-voice initialization have been removed. Errors offer Kokoro retry, not a different engine. Loading or synthesis alone never unlocks listening answers; actual playback completion remains required. Stop/navigation invalidates pending results. First dynamic playback still requires the approximately 112 MiB model download and a capable modern browser. Network, memory, unsupported browser or model errors remain explicit. No new service, API key, payment, text upload, learning-store migration or sharing change is introduced.

### 1.12.3 · Replay and sentence center
Sentence center reuses the task-center metrics, task steps, unit tiles and rail. It opens existing five sentence practice modes for textbook units and all custom sentences, with separate sentence due review and the original dictation entry. Pending sessions are resumed rather than silently replaced.
Completion screens for word/custom-sentence sessions, textbook sentence dictation, adaptive context/reading/cloze/analysis and phrases now offer 再学一遍. Replays preserve the completed scope and order, hide transient answers, retain records/history, and do not award independent credit for immediately repeated material. Word usage questions retain their per-item question ID. Existing storage keys and Site audience remain unchanged.

### 1.12.4 · Mastered-word review and complete schedule pages
The sixth card in word memory tracking opens 掌握词复习 with four real existing practice modes: 翻译辨义, 听力辨义, 听写 and 默写. Queues include all 100%-mastered words in the selected scope, exclude sentence entries, and bypass only automatic due/cooldown filtering. Empty scopes are explicit. Pending matching review resumes; replacing another unfinished session asks before preserving its snapshot. Existing score, correction, effective-time, answer/audio gating and Kokoro pathways remain intact. Mastery stays at 100 and does not re-enter automatic review.
The upcoming schedule no longer silently truncates at 15 items. Word, preparatory and sentence trackers share independent six-row schedule pages with total count, top/bottom previous and next buttons, clamped bounds, scope reset, and saved navigation context. The bounded table scrolls when needed and keeps its heading visible. Sentence-list pagination remains separate. No storage keys, word IDs, original audio assets, Site URL or audience change.

### Learning backup and restore (1.12.5)

Settings exports and imports a versioned `cijian-learning-backup` JSON envelope with an ISO export time and app version. The backup includes all persisted learning stores: workspace (custom sentences, word/sentence schedules and mastery, mistakes, active/replayed/completed sessions, correction and dictation drafts, adaptive history and novelty, settings), custom words, phrase entries/progress/history/sessions, per-answer daily evidence, effective-time daily totals, stable Kokoro voice choices, and retained legacy progress/game data. No application learning records are in IndexedDB. Cache API audio/model and downloadable static assets are excluded; voice assignments are retained.

`backup-validation.js` independently checks every known payload, nested session shape, versions, required fields, ID catalogs, poison properties and bounded input. Unknown backup formats/future versions and damaged local records fail closed. This is the first backup envelope version; raw pre-feature progress fragments are not advertised as complete backups.

Safe merge is the default. Stable authoring IDs and event IDs deduplicate. Local content and its linked scheduling/mastery/counters are retained together on conflict. Same-day effective time, scheduler/phrase counters and stars are never added. Adaptive attempt history does not have unique attempt IDs (its id is a question ID), so only byte-equivalent normalized objects are deduplicated; no lifetime score is reconstructed from these records. Novelty sets are unioned. Local sessions, including completed sessions, win over conflicting imported sessions; rejected incoming sessions are retained in history, not resumed as fresh work. For an exact backup-time state, the explicit overwrite mode replaces the entire recognized learning scope and requires an additional confirmation.

All learning code uses a storage adapter. Import stages a fresh localStorage generation, verifies the preview snapshot again, then atomically changes one pointer. Quota/staging/pointer failures preserve the original live generation; only the new staging keys are removed. Old generations are cleaned only after commit. A stale tab is prevented from writing old in-memory state after restoration. Audio/timers are paused before snapshot and stopped before commit, and the app reloads after success. Close other open Cijian tabs before importing. The origin needs temporary space for both current and incoming data; a lack of space safely refuses import rather than deleting the current records.

The same release adds consistent, bounded pagination for long word and sentence lists, preparatory vocabulary, schedules, custom content, phrase lists/records, adaptive attempt history, daily review priorities, and cloze/reference selection. Lists have counts, previous/next and page input controls where appropriate; independent sections keep separate positions, filtering clamps/reset pages, and existing learning sessions/scoring rules are unchanged. Daily priorities are no longer permanently truncated to ten entries.

### Optional Supabase cloud sync (1.12.6)

The app remains local-first and fully usable without an account. Settings now offers Supabase email-link sign-in and one explicit “立即同步” action. Sync reads the learner's RLS-protected backup, validates the same versioned envelope used by file restore, safely merges stable identities and event IDs with the local snapshot, writes the complete union using an optimistic timestamp check, and only then atomically commits any cloud-only records locally. A concurrent device update refuses the write and asks for a retry instead of overwriting it.

Only the public Supabase project URL and publishable key are shipped to the browser. The `learning_backups` table uses `auth.uid() = user_id` Row Level Security policies; no secret/service-role/database credential is present in source or artifacts. Learning records are uploaded only after sign-in and an explicit sync click. Kokoro models, generated audio cache, dictionary files and other downloadable static assets remain local/excluded. Existing JSON export/import remains available as a separate recovery path, and the Site project, URL, public audience, storage keys and authoring IDs are unchanged.

### Required accounts and cloud-only progress (1.12.7)

Visitors must sign in with an administrator-created username and password before the learning application loads. Usernames are normalized to lowercase and mapped to a reserved internal Supabase Auth email; there is no public sign-up path. After authentication, the app reads that user's RLS-protected `learning_backups` row into an in-memory adapter. Learning progress is not read from or written to browser localStorage. Supabase's own persisted authentication session remains in the browser so the learner can stay signed in.

Every learning mutation schedules an optimistic cloud write. The header distinguishes saving, saved and failed states; failed writes remain retryable and are never reported as successful. A second-device timestamp conflict re-reads the latest cloud payload and preserves the safe stable-ID union before retrying. Leaving the page, hiding the tab, JSON restore and sign-out request a final flush; sign-out is refused when pending learning data cannot be saved. JSON export/restore remains the manual recovery path, and a restored snapshot is written to the account before reload.

The previous browser-local progress is intentionally ignored by this release and is not deleted. This avoids a destructive migration or accidental assignment to the wrong new account. The Site remains public at the hosting layer so visitors can reach the login screen; the learning UI and data require Supabase authentication. Source and static artifacts contain the public Supabase URL/publishable key only—never an account password, secret key, service-role key or database password.

### Fast, explicit account exit (1.12.8)

Sign-out still protects any genuinely pending learning change with a final cloud flush, but identical workspace/phrase writes and deletion of absent keys no longer create redundant Supabase updates. The exit control immediately shows a dedicated progress screen instead of leaving the settings dialog looking frozen. Once the final data write succeeds, Supabase clears this browser's local session first and the app reloads on the local `SIGNED_OUT` event; it no longer waits for the default global all-device revocation request. Other signed-in devices are not logged out.

### Five-minute cloud batches and large-history performance (1.12.9)

Learning mutations stay in the authenticated page's memory and are uploaded as one complete account snapshot at most once per five-minute batch. Hiding or closing the page, signing out, manually retrying, and JSON restore still request an immediate flush. A slow upload saves one captured revision and schedules later activity for the next batch instead of chasing per-second timer updates in an endless write loop.

The account-memory key index is now constant-time, scheduled uploads parse the current snapshot without repeating full backup validation and normal writes avoid a redundant local/cloud merge. Daily insights uses the already validated in-memory event cache instead of enumerating every event key again on each render. The 15-second refresh now updates navigation counters and due controls in place rather than rebuilding the whole current page.


## 1.13.0 · 单元循环学习（2026-11-17）

任务中心「教材与单元」每张卡片提供独立循环学习入口，覆盖该单元全部词项（包括已学、100%、未到期及记忆追踪暂缓词）。每5词一组完成记忆、翻译、听力、听写和默写，整单元完成后可开始下一轮。新课范围选择仍单独保留。

单元循环复用原有手动作答、纠错、能力排期和学情记录。每轮使用独立会话 ID，正常无提示答对仍 +10（最高100）；提示、纠错、重复提交不会重复加分。提前答对不推进原能力排期。相同单元未完成时继续原题；切换练习需确认并保留旧会话历史。已有账号云端存储和 JSON 备份格式保持不变，应用版本更新为1.13.0。

## 1.13.1 · 听写按字母播报（2026-11-19）

单词和句子听写中，每次键入一个英文字母时播放 Kokoro 美式字母名（不读出答案，也不改变评分）。快速输入时按顺序播报重复字母，删除、标点、空格、粘贴和输入法组字不发声。离开题目、核对或重播完整题目时取消剩余播报。内置的 26 段短音频不需要运行时下载语音模型。

## 1.13.2 · 学习卡切词自动朗读（2026-11-19）

单词学习的「记忆与拼读」卡片每次切到新词时自动播放一次 Kokoro 美音；「整词朗读」仍可手动重播。独立回忆、翻译辨义和默写不会因本次改动自动泄露答案，已有听写自动播放规则不变。

## 1.13.3 · 单词答对后自动继续（2026-11-19）

翻译辨义、听力辨义、单词听写和默写答对后，短暂显示确认反馈，再进入下一题；最后一题答对进入本轮完成页。答错、跳过和需要阅读讲解的练习保留原来的操作。手动点「下一步」或按回车提前继续时，不会再跳过一题。

## 1.13.4 · 听写完整字母读音（2026-11-19）

单词及句子听写的 A–Z 按键音替换为试听确认的 Kokoro 美式男声：直接使用美式字母名音标独立合成，保留每段完整素材及自然收尾。整词、整句朗读和作答规则不变。


## 1.13.5 · 听写关闭按键播报（2026-11-20）

- 单词、句子听写和听写订正输入 A–Z 不再播放字母名。题目朗读、重播、作答与学习记录不变。

## 1.13.6 · 小学词汇按教材单元学习（2026-11-21）

- 经核对的印刷页 121–125 共 246 个已有小学词条加入教材起始单元 3 和第 1–7 单元，使用同一个词条 ID、已有进度及 Kokoro 音频。
- 「预备单元」仍有全部 343 个小学词条。任务中心的单元循环和新课均可学习本单元所属词条；不改变全局常规复习汇总范围。

## 1.13.7 · 分开学习教材单词和小学词汇（2026-11-21）

- 有小学补充词的教材卡片显示两个独立入口和进度。「开始新课」仍只用教材单词；旧版混合会话可从继续入口保留进度，新一轮不会混排。
