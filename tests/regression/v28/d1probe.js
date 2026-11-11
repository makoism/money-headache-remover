export default { async fetch(req, env) {
  try { const r = await env.DB.prepare('SELECT 1 AS one').first(); return new Response(JSON.stringify({ ok: true, r })); }
  catch (e) { return new Response(JSON.stringify({ ok: false, err: String(e && e.message || e), stack: String(e && e.stack || '').slice(0, 300) })); }
} };
