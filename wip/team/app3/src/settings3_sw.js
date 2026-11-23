/* ---------- the service worker from the page (DECISIONS_ROUND2 D6, BD5) ----------
   Only when the page is served (http or https): a page opened as a file has no worker and needs none. A new build's worker
   takes over by itself; this page then reloads the next time it goes to the background (the money is saved on every
   change, so nothing is lost), or says so if it stays open in view. A page kept open for days looks for a new build each
   time it comes back into view. */
if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {
  addEventListener('load', () => {
    let had = !!navigator.serviceWorker.controller, fresh = false;
    navigator.serviceWorker.register('sw3.js').then(reg => {
      document.addEventListener('visibilitychange', () => { if (!document.hidden && reg.update) reg.update().catch(() => {}); });
    }).catch(() => { /* no worker: the page still works while online */ });
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!had) { had = true; return; }
      if (fresh) return;
      fresh = true;
      msg3('A new version of the app is ready. It opens the next time you come back to the app.');
      document.addEventListener('visibilitychange', () => { if (document.hidden) location.reload(); });
    });
  });
}
