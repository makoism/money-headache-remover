# M.H.R.2000 (The Money Headache Remover 2000): how it is built

One page. No framework, no libraries, no outside requests from the page itself. The source is a set of small files in this folder; `build.sh` joins them into one HTML file (`../money-map-team.html`). The same page is published two ways: as the Claude artifact (a mirror where AI runs on the viewer's own Claude account) and as the site on Cloudflare Pages (`../site`, the main address: the owner's relay answers AI requests, and an encrypted cloud copy is available).

## Layers
```
model.js      pure arithmetic and the small mutation primitives (no page, no clock, no storage)
actions.js    ACT: named, checked, undoable changes; the only door the setup, import, assistant and screens should use
ui*.js        screens and flows; they read S, call ACT or the model, and draw
ui41/ui42     adapters to the outside: the AI route (relay or viewer's Claude) and the cloud copy
../site/functions   the server: /api/ai (relay with caps), /api/vault (encrypted copies), /api/health
```

## Why it is built this way (research, Nov 2026)
- **Functional core, imperative shell.** All money maths lives in `model.js` as pure functions (no page, no clock, no storage). The other files read the state, call the model and draw. Pure maths can be checked by script against an independent calculation, which is how the number checks work.
- **Idle must cost nothing.** WebKit's power guidance: finish work fast, then return to idle; avoid timers and script-driven animation; use CSS transitions. Google's INP guidance: audit what runs while the page sits idle, and keep every task under about 50 ms. The guard test (`tests/guard.js`) enforces both.
- **Measure, do not guess.** The first measurement found a loop in the date-picker label sync that rewrote the same text at screen speed (3% CPU idle, 9% on Receipts). Fixed by writing only when the text changed.
- **Single file, modular source.** One file means no network waterfall and it works offline. The source is split so a change touches one small file.
- No minifying: startup scripting is about 60 ms, so the cost of unreadable code is not worth it.

## Files
| File | What it holds |
|---|---|
| `model.js` | The money model: `calcAll`, `goalInfo`, `jarsOf`, `viewOf`, `statusOf`, `receiptStats`. Pure. Never change without the number checks. |
| `ui0.js` | State `S`, normalising saved data, saving (`persist`, `flush`), small helpers |
| `actions.js` | `ACT`: transactions with undo (`ACT.tx`, `ACT.undo`), setters for pay, lines, goals, jars, receipts, name, currency, Home layout; `ACT.summary()` reads the key numbers |
| `ui1.js` to `ui4.js` | The Plan tab (lines, ledger), bar and legend, road chart, tooltips, Receipts |
| `art.js` | The nature art: `ART` (inline SVG for grass, sprig, vine, sprout, branch, drawn in `--leaf`), `art(kind)`, `placeArt()` (Scan, hero, goals card). Regenerate with `/tmp/v30/mkart.py` |
| `ui44.js` | The celebration: falling leaves on the `#confetti` canvas and the one-line cheer toast |
| `stmt.js` | Statements to numbers, pure: `stmtCleanRows` (one file's rows, checked), `stmtGroups` (files of one account, told apart by the transaction dates and printed periods, never file names; periods joined end to end), `stmtMerge` (duplicates once, within an account), `stmtMerchants`, `stmtNumbers` (pay, balance, bills, subs, loans, card, questions, the months line), `stmtReceipts`. Unit test: `node /tmp/v29/stmt_test.js` (42) |
| `ui45s.js` | Setup screens (the typed money screen, bills, jars fold and split, goals, reveal), `SUBS` (subscription list and price hints by country) |
| `ui45u.js` | Setup from statements: the Your statements screen (upload; the any-AI route where Claude cannot be reached; Type the numbers instead), the review screen, `importApply`. `IMP_FORMAT` + `importClean` are the pasted-answer contract |
| `ui45v.js` | The statement reader: one fixed-shape job per file (`STMT_ROWS_SCHEMA`; a text file over 120 lines goes in parts that come back as one read), four at a time, then one category job per new merchant (`STMT_CATS_SCHEMA`, `STMT_CAT_GUIDE`); progress lines, `stmtReviewHTML` (what was read, categories with a tap for the rows behind each merchant), `stmtRecat`, `stmtAfterApply` (receipts with `src:'stmt'`, learned categories in `S.ui.cats`). The tool is offered with `tool_choice` auto and asked for in the prompt: Sonnet 5.5 refuses a forced tool |
| `ui45x.js` | Setup extras (card calculator, subscriptions, goals add-another, `JAR_LINES`), **sound effects** (`SFXD` recipes, levels, routing) |
| `music.js` | `MUSIC`: the setup's background piece (original, generative: pad, bell melody with echoes, wind, drops), started on the first tap in the setup, quiet while the hello video plays, off with Music off or Sound off, stopped when the setup closes. `MUSIC.render(ctx, out, seconds)` schedules it into an offline context for checks |
| `ui45t.js` | Hello-video transcript (Mako's words, timed) |
| `ui45.js` | The tour engine: `TOUR` order (video and welcome, currency, statements, review, typed money, bills, split, goals, play money, done), open, close, next, back, autosave, hello video, the hill scene (`homeScene`, drawn in the look's accent) |
| `ui46.js` | Help menu, Ask Claude (viewer's own Claude account), copy-for-any-AI route |
| `ui47.js` | Date and month pickers |
| `ui48.js` | Coach marks (spotlight tour of a tab, only from Help: Explain this tab) |
| `ui41.js` | The AI route: `relayFn()` mirrors Claude's `sample` surface over the site's `/api/ai`; `relayHealth`, anon id, invite code |
| `ui42.js` | The cloud copy: recovery code, keys (PBKDF2 + HKDF), AES-GCM, push after each save, restore, conflict notice |
| `ui43.js` | Saving safety: IndexedDB second copy with automatic restore, backup reminder cards on Home |
| `ui49.js` | Scan receipts card |
| `ui6.js` | Home: status, next step, hero goal, play money, streak, badges, add-a-goal wizard |
| `ui5.js` | Wiring all events, Settings backup/restore, startup |
| `style.css`, `body.html` | Look and static markup (`@font-face` first, then the two palettes). `body.html` has `@@VER@@` and `@@STAMP@@` placeholders |
| `VERSION` | Line 1: version number. Line 2: date and time shown at the bottom and in Help. |
| `RELAY` | One line: the site's address, used only by copies opened as a file. Empty until the site exists. |
| `test_team.js`, `tests/` | Main suite and guard tests. More regression scripts live in `/tmp/v22`, `/tmp/v25`, `/tmp/v27`. |

All `ui*.js` files share one scope (one IIFE) in the order set in `build.sh`. Function declarations can be used before the file they are in; `const`/`let` values must be defined earlier in the build order than their first call at startup.

## Where to make common changes
| Change | Where |
|---|---|
| A subscription price or country hint | `SUBS` in `ui45s.js` (`[id, name, US, Japan, Philippines]`) |
| A sound, its level or character | `SFXD` in `ui45x.js`: `air` (wind), `rustle` (leaves), `drop` (water), `bird`, `hum`; `trim` sets the family levels; leaves, drops and the bird go to the bright output (`o.hi`) |
| The setup music (notes, chords, pace, level) | `music.js`: `DEG` and `CHORDS` (F major pentatonic plus the seventh), `LEVEL`, `PAD`, the timings in `changeChord`, `nextNote`, `step` |
| The typefaces | `@font-face` at the top of `style.css` (Nunito Sans for reading, Fraunces for titles and big numbers; files in `../fonts`, copied next to the page by `../pwa/make_pwa.py`); `--f` and `--fd` |
| The look (greens, glass, aurora) | the two palettes at the top of `style.css` (Day = light root, Forest = dark), `--aurora`, the glass rule and `.art-*` placements; the streak colour is `--streak`; PWA colours in `../pwa/make_pwa.py` and the icons |
| A celebration (leaves, sparks) | `celebrate`, `leafColors`, `leafFrame` in `ui44.js`; `sparkBurst` (small leaves on switches and sliders) in `ui45x.js` |
| The split sliders (jars, goals) | `moveShare`, `spreadFree` in `ui45s.js` (a slider changes only its own share; the rest is unassigned), `spPaint`, `splitApply`, `splitSpread`, `splitGive` in `ui45x.js` |
| The statement account boxes | `impAccts`, `acctNew`, `acctHTML`, `paintAccts` in `ui45u.js`; a job carries `acct` and `stmtTagRead` stamps each read; `stmtGroups` groups boxed reads by box; receipts carry the account as `s`; `S.ui.accts` remembers the names |
| The computer camera | `camOpen`, `camShot`, `camClose` in `ui49.js` (phones keep the native capture input) |
| Setup wording or order | the step definitions in `ui45s.js`, `ui45u.js` and `ui45.js`; the order is the `TOUR` array in `ui45.js` (`skipIf` drops the typed screens once statements gave the numbers) |
| A Home card | its `render…` function in `ui6.js`; markup slot in `body.html`; order and visibility via `HOME_SECTIONS` and `ACT.setHome` |
| What the statement reader asks Claude for | `STMT_ROWS_SCHEMA`, `STMT_CATS_SCHEMA` and `STMT_CAT_GUIDE` in `ui45v.js`; the arithmetic that turns rows into numbers is `stmtNumbers` in `stmt.js` (change the unit test with it). The pasted-answer route keeps `importRules` and `IMP_FORMAT` in `ui45u.js`, with `importClean` to match |
| The category words | `STMT_CATS`, `STMT_BILL_CATS`, `STMT_LINE` in `stmt.js`; the stub's keyword map in `../site/tests/stub_anthropic.js` for the tests |
| Which files the AI can read | `IMG_TYPES` and `DOC_LIMITS` in `ui41.js` (PDFs go up as document blocks on the relay route only; `askDoc` in `ui46.js` is null elsewhere), mirrored by `MAX_DOCS` in `../site/functions/api/ai.js` |
| What the assistant may do | `ASST_GUIDE` (the list Claude reads) and `asstCheck` (the checked actions) in `ui4a.js`; both must agree; `asstPicture` is what it knows |
| The Home "Next" card and the finish-last-month nudge | `renderNext` and `monthToClose` in `ui6.js` |
| AI limits, models, the code word | the Cloudflare project's Variables (see `../site/SETUP.md`) |
| Colours, spacing | variables at the top of `style.css` |
| Sample numbers per currency | `presetState` in `model.js` |
| The version | `VERSION` |

## Contracts: do not edit casually
- `askExtractPrompt` and `scanMessage` in `ui46.js`, `IMP_FORMAT` / `importClean` in `ui45u.js`, and the two schemas in `ui45v.js` are read by machines (Claude and other AIs). Changing a field name breaks reading photos, statements and pasted setups.
- The relay request shape (`functions/api/ai.js` validate) and `relayFn` in `ui41.js` must agree. The vault record shape (`functions/api/vault`) and `ui42.js` must agree.
- Storage key `money-map-template-v2` and the shape of `S`: only add fields; `normalize` fills defaults, so older saved copies keep loading.
- `model.js` outputs feed every screen; any change must pass the full number checks.

## Rules for new code
1. **Idle is zero.** No `setInterval`, no polling, no `requestAnimationFrame` loops except while an animation is visibly running. A MutationObserver callback must never write to the DOM unconditionally (it would re-trigger itself).
2. **Write the DOM only when something changed** (`put()` in `ui6.js`, `dpSet` in `ui47.js`).
3. **Animate only `transform` and `opacity`** with CSS, not script.
4. **Do work after the first paint**: sound engine, video and Ask Claude start on first use, never at load.
5. **No outside requests** (fonts, scripts, analytics). The guard fails if one appears.
6. **Keep tasks short** (under 50 ms); split work and let the browser paint between parts.
7. **Content is data**: lists of prices, categories, wording go in a table at the top of a file, not inside logic.

## Checks and release
```
./check.sh          # about 1 minute: build, syntax, main suite, safety tests, idle and speed guard
./check.sh full     # adds all regression scripts and the number checks (about 10 minutes)
cd ../site && ./tests/dev.sh && node tests/relay.test.js && node tests/page_relay.js && node tests/page_vault.js && node tests/page_import.js   # the server and the hosted page
```
Site release: `cd ../site && ./build_site.sh`, copy into the GitHub clone (`/home/claude/money-headache-remover`), commit, push `main`; Cloudflare deploys within a minute; check `/api/health` and the Version stamp on the live address.
Release: edit source, update `VERSION`, `./check.sh full`, rebuild the app package (`cd ../pwa && python3 make_pwa.py`, test with `node /tmp/team_pwa.js`, 8 PASS expected), publish (`list_files`, `get_artifact`, `publish_files` with `mode: patch` and the current live version), check the live page, add a dated entry to the Project doc.

## Known limits
- In the artifact, data lives in the browser (localStorage plus a second copy in IndexedDB); clearing site data removes both; only a backup file survives. On the site, the optional cloud copy survives anything as long as the person keeps the recovery code. The artifact cannot reach the relay or the vault (its pages may not call other hosts).
- Sounds were only measured offline, never heard on a real speaker. Not tested on a real phone or iPhone Safari.
