// The storage lane's tests, run in Chromium through Playwright.
//   node wip/team/store/test/run.js            every test file
//   node wip/team/store/test/run.js pack clock  only t_pack.js and t_clock.js
// Each t_*.js file exports a list of { name, run(t) }. Every test gets its own browser context (its own storage),
// served from a small local server so IndexedDB, BroadcastChannel and storage quotas behave as on a real site.
// The exit code is 0 only when every test passed. All amounts in the tests are made up.
'use strict';
const http = require('http'), fs = require('fs'), path = require('path');
const { chromium } = require('playwright');

const ROOT = path.join(__dirname, '..');
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json' };

function serve() {
  return new Promise(resolve => {
    const s = http.createServer((req, res) => {
      let p = decodeURIComponent(req.url.split('?')[0]);
      if (p === '/') p = '/test/page.html';
      const f = path.join(ROOT, p);
      if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end(); }
      res.writeHead(200, { 'content-type': TYPES[path.extname(f)] || 'application/octet-stream', 'cache-control': 'no-store' });
      fs.createReadStream(f).pipe(res);
    });
    s.listen(0, '127.0.0.1', () => resolve(s));
  });
}

function assert(ok, what, got) {
  if (!ok) throw new Error(what + (got === undefined ? '' : ' (got ' + JSON.stringify(got).slice(0, 400) + ')'));
}
assert.eq = (got, want, what) => {
  const a = JSON.stringify(got), b = JSON.stringify(want);
  if (a !== b) throw new Error(what + ': want ' + b.slice(0, 400) + ', got ' + a.slice(0, 400));
};

// The same data whatever the order of object keys (a copy read back from IndexedDB lists its fields in another order).
const canon = x => JSON.stringify(x, (k, v) => (v && typeof v === 'object' && !Array.isArray(v) ? Object.keys(v).sort().reduce((o, key) => { o[key] = v[key]; return o; }, {}) : v));
assert.same = (got, want, what) => {
  const a = canon(got), b = canon(want);
  if (a !== b) throw new Error(what + ': want ' + b.slice(0, 400) + ', got ' + a.slice(0, 400));
};

async function main() {
  const only = process.argv.slice(2);
  const files = fs.readdirSync(__dirname).filter(f => /^t_.*\.js$/.test(f)).sort()
    .filter(f => !only.length || only.some(o => f === 't_' + o + '.js'));
  const server = await serve();
  const url = 'http://127.0.0.1:' + server.address().port + '/';
  const browser = await chromium.launch();
  let pass = 0, fail = 0;
  const lines = [];
  for (const f of files) {
    for (const test of require(path.join(__dirname, f))) {
      const contexts = [];
      const t = {
        url, assert, browser,
        log: s => lines.push('    ' + s),
        // A fresh context: its own storage. opts go to browser.newContext (timezoneId and the like).
        context: async opts => { const c = await browser.newContext(opts); contexts.push(c); return c; },
        // A page of the test page in the given context (or a fresh one), with the store scripts loaded.
        page: async (ctx, before) => {
          ctx = ctx || await t.context();
          const p = await ctx.newPage();
          p.on('pageerror', e => lines.push('    page error: ' + e.message));
          if (before) await before(p);
          await p.goto(url);
          await p.waitForFunction(() => window.STORE_READY === true);
          return p;
        },
      };
      const t0 = Date.now();
      try {
        await test.run(t);
        pass++; lines.push('  ok   ' + f.replace(/\.js$/, '') + ': ' + test.name + ' (' + (Date.now() - t0) + ' ms)');
      } catch (e) {
        fail++; lines.push('  FAIL ' + f.replace(/\.js$/, '') + ': ' + test.name + ': ' + (e && e.stack || e));
      }
      for (const c of contexts) await c.close().catch(() => {});
      process.stdout.write(lines.splice(0).join('\n') + '\n');
    }
  }
  await browser.close();
  server.close();
  console.log((fail ? 'STORE TESTS FAIL' : 'STORE TESTS PASS') + ': ' + pass + ' passed, ' + fail + ' failed');
  process.exit(fail || !pass ? 1 : 0);
}
main().catch(e => { console.error(e); process.exit(1); });
