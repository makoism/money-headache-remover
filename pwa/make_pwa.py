import os, shutil, zipfile, re, json
SRC=os.environ.get('PWA_SRC','/home/claude/work/money-map-team.html')   # the test tests/qc/phone_update.js builds into its own folders
OUT=os.environ.get('PWA_OUT','/home/claude/work/pwa/dist')
ART=os.environ.get('PWA_ART','/home/claude/work/pwa')   # where the zip and the single .html go
shutil.rmtree(OUT, ignore_errors=True); os.makedirs(OUT+'/icons')
html=open(SRC,encoding='utf8').read()
assert '<title>the burrow</title>' in html
# The app folder carries the small welcome video (hello.mp4 and its cover hello.jpg) next to index.html, so it plays on its screen.
# The single downloaded .html file has no such neighbours, so it uses the Google Drive card instead.
assert html.count("const HELLO_FILE = 'hello.mp4';") == 1
INLINE_HTML=html.replace("const HELLO_FILE = 'hello.mp4';","const HELLO_FILE = '';")
head='''<link rel="manifest" href="manifest.webmanifest">
<meta name="theme-color" content="#eef4ef" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#0c1a15" media="(prefers-color-scheme: dark)">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-title" content="the burrow">
<link rel="apple-touch-icon" href="icons/apple-touch-icon.png">
<link rel="icon" type="image/svg+xml" href="icons/favicon.svg">
<link rel="icon" type="image/png" sizes="32x32" href="icons/favicon-32.png">
<link rel="icon" href="favicon.ico" sizes="any">
<link rel="preload" as="font" type="font/woff2" crossorigin href="fonts/nunito-sans-latin.woff2">
<link rel="preload" as="font" type="font/woff2" crossorigin href="fonts/fraunces-latin.woff2">
'''
assert html.count('</head>')==1
html=html.replace('</head>', head+'</head>')
reg='''<script>
/* Lets the page work offline once it has been opened. Skipped when the file is opened straight from a folder. */
if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {
  window.addEventListener('load', function () {
    var had = !!navigator.serviceWorker.controller;
    navigator.serviceWorker.register('sw.js').then(function (reg) {
      /* a page kept open for days: look for a newer version each time it comes back into view */
      document.addEventListener('visibilitychange', function () { if (!document.hidden && reg.update) reg.update().catch(function () {}); });
    }).catch(function () {});
    /* a newer version took over while this page was open: the page offers a reload (never forces one).
       Not when this page already is that version: an app opened after a deploy loads the new page from the network, then the new service worker
       takes over a moment later. The page knows its own build (BUILD, the cache name in sw.js) and asks sw.js which build is live. */
    var BUILD = '@@CACHE@@', offer = function () { window.dispatchEvent(new CustomEvent('mhr:update')); };
    navigator.serviceWorker.addEventListener('controllerchange', function () {
      if (!had) { had = true; return; }
      fetch('sw.js', { cache: 'no-store' }).then(function (r) { return r.text(); }).then(function (t) { var m = t.match(/const CACHE = '([^']+)'/); if (!m || m[1] !== BUILD) offer(); }).catch(offer);
    });
  });
}
</script>
'''
assert html.count('</body>')==1
html=html.replace('</body>', reg+'</body>')
manifest={
 "name":"the burrow","short_name":"the burrow","description":"A calm budget page that shows what you can really spend. Your numbers stay on your device.",
 "start_url":"./","scope":"./","display":"standalone","orientation":"any","background_color":"#0c1a15","theme_color":"#0c1a15",
 "icons":[{"src":"icons/icon-192.png","sizes":"192x192","type":"image/png","purpose":"any"},{"src":"icons/icon-512.png","sizes":"512x512","type":"image/png","purpose":"any"},{"src":"icons/icon-maskable-512.png","sizes":"512x512","type":"image/png","purpose":"maskable"}]}
open(OUT+'/manifest.webmanifest','w').write(json.dumps(manifest,indent=2))
sw='''/* Offline support. Your numbers are not stored here, they live in the browser's own storage, so updating this file never touches them.
   When you change any file in this folder, the CACHE name changes with every build so everyone gets the new version. */
const CACHE = 'money-headache-@@HASH@@';
const FILES = ['./', 'index.html', 'manifest.webmanifest', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/icon-maskable-512.png', 'icons/apple-touch-icon.png', 'fonts/nunito-sans-latin.woff2', 'fonts/nunito-sans-latin-ext.woff2', 'fonts/fraunces-latin.woff2', 'fonts/fraunces-latin-ext.woff2', 'fonts/caveat-latin.woff2'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting())); });
/* older caches go, and with them any /api/ answer a worker before 38.31 stored; the current cache is cleared of /api/ answers too */
const noApi = c => c.keys().then(rs => Promise.all(rs.filter(r => new URL(r.url).pathname.startsWith('/api/')).map(r => c.delete(r))));
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => caches.open(CACHE)).then(noApi).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const r = e.request, u = new URL(r.url);
  /* /api/ (cloud copies, health) always goes to the network and is never stored or replayed: an old cloud copy must never load over current numbers */
  if (r.method !== 'GET' || u.origin !== location.origin || u.pathname.startsWith('/api/') || /\\.mp4$/.test(u.pathname)) return;
  e.respondWith(fetch(r).then(res => { const copy = res.clone(); if (res.ok) caches.open(CACHE).then(c => c.put(r, copy)); return res; }).catch(() => caches.match(r, { ignoreSearch: true }).then(m => m || caches.match('index.html'))));
});
'''
import hashlib
# one name for this build, in sw.js and in the page (the page compares it with the live sw.js); the hash is taken before the name is written in
CACHE_NAME='money-headache-'+hashlib.sha256(html.encode('utf8')).hexdigest()[:10]
assert html.count("'@@CACHE@@'")==1
html=html.replace("'@@CACHE@@'", "'"+CACHE_NAME+"'")
open(OUT+'/index.html','w',encoding='utf8').write(html)
sw=sw.replace("'money-headache-@@HASH@@'", "'"+CACHE_NAME+"'")
assert CACHE_NAME in sw
open(OUT+'/sw.js','w').write(sw)
for f in ['hello.mp4','hello-av1.mp4','hello.jpg']:
    shutil.copy('/home/claude/work/hello/'+f, OUT+'/'+f)
for f in ['icon-192.png','icon-512.png','icon-maskable-512.png','apple-touch-icon.png','favicon-32.png','favicon.svg']:
    shutil.copy('/home/claude/work/pwa/'+f, OUT+'/icons/'+f)
shutil.copy('/home/claude/work/pwa/favicon.ico', OUT+'/favicon.ico')
# the two typefaces (Nunito Sans for reading, Fraunces for titles), latin and latin-ext subsets, OFL licences alongside
os.makedirs(OUT+'/fonts', exist_ok=True)
for f in os.listdir('/home/claude/work/fonts'):
    shutil.copy('/home/claude/work/fonts/'+f, OUT+'/fonts/'+f)
open(OUT+'/README.md','w').write('# The Burrow: app version\n\nThis folder is the same page you use inside Claude, packaged so it can live on a phone or computer like an app.\nYour numbers are saved on the device and browser you use. Nothing is sent anywhere.\n\n## Quickest way: just open it\nDouble-click `index.html`. It opens in your browser and works right away. Your numbers are saved in that browser.\nBookmark it, or keep the file somewhere easy to find.\n\n## To get a real app icon (install it)\nAn installed app needs the folder to live at a web address. Any free static host does this. The easiest is Netlify Drop:\n\n1. Go to app.netlify.com/drop and drag this whole folder onto the page.\n2. You get a web address. Open it.\n3. On a phone: in Safari tap Share, then Add to Home Screen. In Chrome tap the menu, then Install app.\n   On a computer: in Chrome or Edge, click the install icon at the right end of the address bar.\n\nGitHub Pages and Cloudflare Pages work the same way: upload these files, switch hosting on, open the address.\nAfter the first visit the app also opens with no internet.\n\n## Good to know\n- The short hello video plays right on its screen in the tour, with speeds up to 3x. It is the files `hello-av1.mp4` (sharper, used by browsers that can play it) and `hello.mp4` (the standard copy) in this folder, with the cover `hello.jpg`, so keep all three next to `index.html`. It is not saved for offline use. If it does not load, the tour shows a link to the full version on Google Drive. The single .html file has no video file beside it, so there the tour shows the Google Drive link.\n- Your numbers belong to one browser on one device. A phone and a laptop each keep their own copy. To move your numbers, open Basics and find Backup: tap Copy my numbers on one device, paste them into a note or message to yourself, then paste them into the Backup box on the other device and tap Load pasted numbers.\n- Clearing the site data in a browser clears your numbers. Take a backup first.\n- The Ask Claude help button only appears when the page is opened inside Claude. In this app version you still get the guided tour and every tool on the page.\n- When you put a newer version online, installed copies pick it up the next time they open with internet (the name in `sw.js` changes with every build). Your saved numbers are not affected by updates.\n')
import zipfile
z=zipfile.ZipFile(ART+'/money-headache-remover-2000-app.zip','w',zipfile.ZIP_DEFLATED)
for root,_,fs in os.walk(OUT):
    for f in fs:
        full=os.path.join(root,f); z.write(full, os.path.join('money-headache-remover-2000', os.path.relpath(full,OUT)))
z.close()
open(ART+'/money-headache-remover-2000.html','w',encoding='utf8').write(INLINE_HTML)
print(sorted(os.listdir(OUT)), os.path.getsize(OUT+'/index.html'))
