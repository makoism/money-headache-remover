# What every QC reviewer follows

You are one of The Burrow's reviewers. Mako, the owner, used the first version himself on 24 Nov 2026 and found in minutes what no reviewer had reported: he could not remove a bill, could not add or remove a bank, an empty box gave an error with no way out, and the assistant he wanted as the main way in was a small link. His words: "the QC agents are not doing a good enough job." These rules exist so that never happens again. Your own brief (your agent file) says what your role checks. This page says how every role works.

## 1. The build
- The app is the new page, called app3. The caller gives you the path of the built page. If it gives none, use `wip/team/app3/index.html`. The old app (`wip/team/build.html`, `model.js`, `tests/verify.sh`) is not what you judge.
- The caller also gives you a round folder inside `wip/team/qc_reports/`. If it holds `check3.txt` (the output of the full check on this build), paste its last five lines at the top of your report. If the file is missing or does not end with `ALL GOOD`, say so in the first line of your report and carry on: a red check is a finding, not a reason to skip the review.
- The round folder may hold `scope.txt`, written by the coordinator: the lines of MAKO_SAYS.md this build leaves for a later slice on purpose, each with the reason. You still mark those lines, as NOT BUILT (IN SCOPE FILE), and they do not fail the build. Anything missing that is not in that file is simply missing. You never read the plan to find out.
- A screen pack may be in the round folder under `screens/` (pictures and words of each main screen, made by `wip/team/qc/pack3.js`). Start there when your brief says so.

## 2. Opening the app
`wip/team/qc/qc3.js` opens the page in a real browser (Playwright). Read its head comment; that is all the code you need.
```
const Q = require('/home/user/money-headache-remover/wip/team/qc/qc3.js');
const d = await Q.open({ today: '2026-12-10' });   // a new phone with nothing saved
await Q.text(d.p);   // every word on screen      await Q.taps(d.p);   // every thing a person can tap, with its size
```
`desktop: true` for 1300x900, `w: 320` for a narrow phone, `scheme: 'light'`, `sample: true` for the made-up book. `Q.serve()` gives a made-up local server for two devices and the cloud copy. Reports of `d.errs` (page errors) are always findings.
Your scripts and pictures go in `/tmp/qc/<your role>/`. Pictures a person will see: `dpr: 2`.

## 3. What you read, and what you do not
Read in full before you start:
- `wip/team/NORTH_STAR.md` (what the app is for).
- `wip/team/MAKO_SAYS.md` (what the owner has said the app must be and do, each line with an id like M12). This is not the builder's reasoning. It is what the build is judged against.
- This page and your own brief.
Do not read anything else unless your brief names it: not RESUME.md, plans, DECISIONS files, `app3/FOR_MAKO.md`, other reviewers' reports, test files, commit messages, `git log` or `git diff`. You judge like someone who never saw how or why the build was made. If you need the builder's reasons to understand a screen, that is a finding: the build does not explain itself.

## 4. Rules for every role
1. **Like a person.** Unless your brief says otherwise, you look, tap and type. No console, no editing storage, no test hooks, no reading the code to find a hidden way. If a person could not find it, it is not there.
2. **The owner's words come first.** Your lines are: section A for qc-assistant; B for qc-controls; C and D for qc-numbers and qc-foundation; E for qc-voice and qc-novice; F for qc-data-safety; every section for qc-north-star. Read the whole page, mark only your lines, and report a line outside your sections only when you see it broken. For each of your lines say MET, NOT MET, NOT BUILT or COULD NOT TELL, with the id. NOT MET and NOT BUILT are findings even when the screen in front of you works perfectly. A correct app the owner does not want to use is a failure (LESSONS, lesson 5).
3. **Count, do not sample.** Where your brief gives a grid or a list, fill every cell. Never write "I tried a lot". Write how many you tried, how many passed, and list every one you did not get to under NOT CHECKED. An empty NOT CHECKED section must be true.
4. **"I could not do it" is a blocker, never a question.** If a person cannot add, change, remove, undo, save, leave or go back, that is a BLOCKER. It is never "a question for Mako", never "by design", never "later". Only matters of taste (which word, which colour, which order) go under FOR MAKO'S EYE.
5. **Every box and every sheet.** For any box you meet: leave it empty, type a wrong thing, then try to leave. There must be a plain message that says what to do and a way out that loses nothing else. For any sheet or step: there must be a way back and a way to close.
6. **Do the opposite.** After anything you add, try to change it and to remove it, and then Undo. After anything you save, reload and look again.
7. **Exact words.** Every finding names the screen, the size, and quotes the words on screen. Give the steps so someone else can see it in one minute.
8. **Timing.** Other reviewers may be running browsers. Keep one browser open at a time and close each device when you are done with it (`d.close()` also deletes its storage unless you passed `profile`). Before reporting something that could be timing, repeat that step once on its own.
9. **You only look and report.** Never edit, create or delete a file in the repository, except your one report file (below). Never run `build3.sh`, `check3.sh` or any build or publish script.
10. Plain words. No praise, no summary of the build, no em dashes.

## 5. Your report
Write it to `<round folder>/<your role>.md` (the one file you may create in the repository) and give the same text in your reply. Under 900 words unless your brief says otherwise. In this order:
```
VERDICT: PASS or FAIL            (FAIL if there is any BLOCKER, or any of your lines is NOT MET, or NOT BUILT and not in scope.txt)
CHECK: last five lines of check3.txt, or "no check3.txt"
OWNER'S WORDS: M-id, MET / NOT MET / NOT BUILT / COULD NOT TELL, a few words each
COUNT: what your brief asks you to count (jobs done and stuck, cells filled and empty)
BLOCKERS: wrong, broken, missing, money or data at risk, a person stuck. Steps, exact words, screen, size, what it should do.
CONFUSING: exact words and place, with a replacement.
POLISH: small things.
FOR MAKO'S EYE: taste only.
NOT CHECKED: everything in your brief you did not get to, and why.
```

## 6. The assistant
Sessions cannot reach the live site or a real AI. You test the assistant against a made-up one that the page talks to as if it were real. Never write COULD NOT TELL for an assistant line because "no AI was reachable": use this.
```
const Q = require('/home/user/money-headache-remover/wip/team/qc/qc3.js');
const { openWithFakeAI, tell, MAKO_SETUP } = require('/home/user/money-headache-remover/wip/team/app3/tests/fake_ai_page.js');
const d = await Q.open({ today: '2026-11-24' });
const ai = await openWithFakeAI(d.p, { steps: MAKO_SETUP.steps });   // no steps: it echoes, so you can type anything
for (const line of MAKO_SETUP.lines) await tell(d.p, line);          // a whole setup by talking
// options: echo: false (the relay fails when the steps run out), invite: 'word', url (from Q.serve()). ai.bodies = everything the page sent.
// on a phone, tap a card's button with d.p.$eval('[data-chatok]', e => e.click())
```
The head of `wip/team/app3/tests/README.md` says more. If `fake_ai_page.js` is missing in the build you were given, say so in your first line: that is a finding about the round, and you then use the stub at the top of `wip/team/app3/tests/e3_ask.js`.
A made-up AI proves the doors work: what the assistant can change, what it shows, what it is sent, Undo. It does not prove the real one talks well. Say which you tested. The words the assistant is told to say and ask are in its own files, and you judge those as written.
