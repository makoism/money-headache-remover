/* The Worker entry: serves the page from the assets binding and routes /api/* to the same handlers Pages Functions use.
   Cloudflare's Workers Builds runs `npx wrangler deploy` on every push; wrangler.toml names this file and the public folder. */
import * as ai from '../functions/api/ai.js';
import * as health from '../functions/api/health.js';
import * as vault from '../functions/api/vault/[id].js';

const routes = [
  { re: /^\/api\/ai\/?$/, mod: ai },
  { re: /^\/api\/health\/?$/, mod: health },
  { re: /^\/api\/vault\/([^/]+)\/?$/, mod: vault, params: m => ({ id: m[1] }) },
];
const METHOD = { GET: 'onRequestGet', POST: 'onRequestPost', PUT: 'onRequestPut', DELETE: 'onRequestDelete', OPTIONS: 'onRequestOptions' };

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (url.pathname.startsWith('/api/')) {
      for (const r of routes) {
        const m = url.pathname.match(r.re); if (!m) continue;
        const fn = r.mod[METHOD[request.method]] || r.mod.onRequest;
        if (!fn) return new Response(JSON.stringify({ error: { code: 'method_not_allowed', message: request.method + ' is not allowed here.' } }), { status: 405, headers: { 'content-type': 'application/json', allow: Object.keys(METHOD).filter(k => r.mod[METHOD[k]]).join(', ') } });
        try { return await fn({ request, env, params: r.params ? r.params(m) : {}, waitUntil: p => ctx.waitUntil(p) }); }
        catch (e) { return new Response(JSON.stringify({ error: { code: 'server_error', message: 'Something broke on the server.' } }), { status: 500, headers: { 'content-type': 'application/json' } }); }
      }
      return new Response(JSON.stringify({ error: { code: 'not_found', message: 'No such API path.' } }), { status: 404, headers: { 'content-type': 'application/json' } });
    }
    return env.ASSETS.fetch(request);
  },
};
