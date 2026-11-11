/* GET /api/health: tells the page what this server offers. No secrets, no counters. */
import { json, preflight } from '../_lib.js';
export const onRequestOptions = () => preflight();
export const onRequestGet = ({ env }) => json({
  ok: true,
  ai: !!env.ANTHROPIC_API_KEY,
  vault: !!env.DB,
  invite: !!String(env.INVITE_CODES || '').trim(),
  version: env.SITE_VERSION || '',
});
