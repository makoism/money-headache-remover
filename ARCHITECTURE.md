# The Money Headache Remover 2000: how it is built

One page. No framework, no libraries, no outside requests. The source is a set of small files in this folder; `build.sh` joins them into one HTML file (`../money-map-team.html`) that is published as the artifact.

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
| `ui1.js` to `ui4.js` | The Plan tab (lines, ledger), bar and legend, road chart, tooltips, Receipts |
| `ui44.js` | Confetti and the one-line cheer toast |
| `ui45s.js` | Setup screens (questions), `SUBS` (subscription list and price hints by country) |
| `ui45x.js` | Welcome extras, the shrine, **sound effects** (`SFXD` recipes, levels, routing) |
| `ui45t.js` | Hello-video transcript (Mako's words, timed) |
| `ui45.js` | The tour engine: open, close, next, back, autosave, welcome house drawing |
| `ui46.js` | Help menu, Ask Claude (viewer's own Claude account), copy-for-any-AI route |
| `ui47.js` | Date and month pickers |
| `ui48.js` | Coach marks (spotlight tours of each tab) |
| `ui49.js` | Scan receipts card |
| `ui6.js` | Home: status, next step, hero goal, play money, streak, badges, add-a-goal wizard |
| `ui5.js` | Wiring all events, Settings backup/restore, the copy-for-AI prompt, startup |
| `style.css`, `body.html` | Look and static markup. `body.html` has `@@VER@@` and `@@STAMP@@` placeholders |
| `VERSION` | Line 1: version number. Line 2: date and time shown at the bottom and in Help. |
| `test_team.js`, `tests/` | Main suite and guard tests. More regression scripts live in `/tmp/v22`, `/tmp/v25`, `/tmp/v27`. |

All `ui*.js` files share one scope (one IIFE) in the order set in `build.sh`. Function declarations can be used before the file they are in; `const`/`let` values must be defined earlier in the build order than their first call at startup.

## Where to make common changes
| Change | Where |
|---|---|
| A subscription price or country hint | `SUBS` in `ui45s.js` (`[id, name, US, Japan, Philippines]`) |
| A sound, its level or character | `SFXD`, `CLICK`, `trim` in `ui45x.js` |
| Setup wording | the step definitions in `ui45s.js` and `ui45.js` |
| A Home card | its `render…` function in `ui6.js`; markup slot in `body.html` |
| Colours, spacing | variables at the top of `style.css` |
| Sample numbers per currency | `presetState` in `model.js` |
| The version | `VERSION` |

## Contracts: do not edit casually
- `askExtractPrompt`, `scanMessage` and the AI-prompt JSON format in `ui46.js` / `ui5.js` are read by machines (Claude and other AIs). Changing a field name breaks reading photos and pasted setups.
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
./check.sh          # about 1 minute: build, syntax, main suite, idle and speed guard
./check.sh full     # adds all regression scripts and the number checks (about 10 minutes)
```
Release: edit source, update `VERSION`, `./check.sh full`, rebuild the app package (`cd ../pwa && python3 make_pwa.py`, test with `node /tmp/team_pwa.js`, 8 PASS expected), publish (`list_files`, `get_artifact`, `publish_files` with `mode: patch` and the current live version), check the live page, add a dated entry to the Project doc.

## Known limits
- Data lives in the browser (localStorage plus a second copy in IndexedDB). Clearing site data removes both; only a backup file survives. The private cloud copy needs public sharing switched off for the artifact once, so the `db` capability can be declared.
- Sounds were only measured offline, never heard on a real speaker. Not tested on a real phone or iPhone Safari.
