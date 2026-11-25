/* A fake model for the assistant's tests (AI_FIRST_PLAN section 5, BU1 lane A). It answers in the relay's shape
   (functions/api/ai.js: { content: [text and tool_use blocks], stop_reason }) with recorded replies, one per call, and
   keeps every request it was sent so a test can check what was sent (no ids, no notes, max_tokens, invite, the tools).
     const F = FAKE.make([step, step, ...])
       a step is a recorded reply { words?, calls?: [{ name, input }] }, or a function (body, F) -> such a reply that
       reads the request first (which tool results came back, what the person said last). A step may also be
       { error: 'words' } (the relay failed: send throws Error(words)).
     F.send(body)        the core's deps.send
     F.bodies            every request sent;  F.left()  steps not used yet
     FAKE.results(body)  the tool results in the last message: [{ id, text }]
     FAKE.said(body)     the person's words in this turn
     FAKE.handler(steps) (postData string) -> response JSON string, for a Playwright route at /api/ai (lane B)
   No network, no real AI. Node and the page. */
(function (root) {
  'use strict';
  let n = 0;
  function reply(r) {
    const content = [];
    if (r.words) content.push({ type: 'text', text: r.words });
    for (const c of r.calls || []) content.push({ type: 'tool_use', id: 'toolu_fake' + (++n), name: c.name, input: c.input || {} });
    return { text: r.words || '', content, stop_reason: (r.calls || []).length ? 'tool_use' : 'end_turn', usage: { input: 0, output: 0 }, model: 'fake' };
  }
  function make(steps) {
    const queue = steps.slice(), F = { bodies: [] };
    F.left = () => queue.length;
    F.send = async body => {
      F.bodies.push(JSON.parse(JSON.stringify(body)));
      if (!queue.length) throw new Error('the fake AI has no recorded reply left');
      let s = queue.shift();
      if (typeof s === 'function') s = s(body, F);
      if (s && s.error) throw new Error(s.error);
      return reply(s);
    };
    return F;
  }
  function results(body) {
    const last = body.messages[body.messages.length - 1];
    return (Array.isArray(last.content) ? last.content : []).filter(c => c.type === 'tool_result').map(c => ({ id: c.tool_use_id, text: c.content }));
  }
  function said(body) {
    for (const m of body.messages.slice().reverse()) {
      if (m.role !== 'user') continue;
      const t = (m.content || []).map(c => c.text || '').join('\n'), i = t.indexOf('THE PERSON SAYS\n');
      if (i >= 0) return t.slice(i + 16).split('\n\n')[0];
    }
    return '';
  }
  function handler(steps) {
    const F = make(steps);
    return async postData => JSON.stringify(await F.send(JSON.parse(postData)));
  }
  const api = { make, results, said, handler };
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.FAKE_AI = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
