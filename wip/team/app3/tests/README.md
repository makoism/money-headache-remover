# app3 tests: notes for reviewers

## The assistant with the fake AI (for QC)

A plain copy of the built page has no AI, so the assistant's panel only says it is off. To review the assistant, open the page with `wip/team/qc/qc3.js` as usual, then hand the page to `openWithFakeAI` from `fake_ai_page.js`. It puts the fake model (`fake_ai.js`) behind a made-up relay address (`https://relay.example`) and reloads the page, so the page's own requests, the assistant's core and the panel all run for real. Nothing leaves the machine. There is no real AI and there are no real figures.

```js
const Q = require('<repo>/wip/team/qc/qc3.js');
const { openWithFakeAI, tell, MAKO_SETUP } = require('<repo>/wip/team/app3/tests/fake_ai_page.js');

const d = await Q.open({ today: '2026-11-24' });
const ai = await openWithFakeAI(d.p, { steps: MAKO_SETUP.steps });
for (const line of MAKO_SETUP.lines) await tell(d.p, line);   // Mako's made-up setup, by chat
// Home: safe to spend 201,400, Main bank 286,000. ai.bodies holds every request the page sent.
await d.close();
```

- With no `steps`, every message gets the reply "(made-up AI) I heard: ...", so you can type anything and look at the panel.
- `steps` are recorded replies, one per call to the AI (see the top of `fake_ai.js`). When they run out, the echo takes over. Pass `echo: false` to make the relay fail instead.
- `invite: 'word'` makes the made-up relay ask for that code word.
- `url` goes to a served address (from `Q.serve()`) instead of reloading the page.
- `tell(page, words)` types into the panel, sends, and waits for the answer.
- On a phone the panel's sheet can close after an answer. To tap a card's button, open it first (focus `#a3ChatIn`), or use `d.p.$eval('[data-chatok]', e => e.click())`.

The test that uses it is `e3_fakeai_page.js`.
