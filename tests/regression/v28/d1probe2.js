import { ensureSchema } from '/home/claude/work/site/functions/_lib.js';
export default { async fetch(req, env) {
  try { await ensureSchema(env.DB); const r = await env.DB.prepare('SELECT count(*) AS n FROM usage').first(); return new Response(JSON.stringify({ ok: true, r })); }
  catch (e) { return new Response(JSON.stringify({ ok: false, err: String(e && e.message || e), cause: String(e && e.cause && e.cause.message || '') })); }
} };
