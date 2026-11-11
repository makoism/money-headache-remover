// A static server that behaves like the artifact host: it ignores Range and always answers 200 with the whole file.
const http = require('http'), fs = require('fs'), path = require('path');
const root = '/tmp/vsite', port = +process.argv[2] || 8777, mode = process.argv[3] || 'ok';
const types = { '.html': 'text/html', '.mp4': 'video/mp4', '.jpg': 'image/jpeg' };
global.log = [];
http.createServer((req, res) => {
  const u = req.url.split('?')[0], f = path.join(root, u === '/' ? 'index.html' : u);
  if (mode === 'fail' && /\.mp4$/.test(u)) { res.writeHead(404); return res.end('no'); }
  if (!fs.existsSync(f)) { res.writeHead(404); return res.end(); }
  const size = fs.statSync(f).size;
  res.writeHead(200, { 'content-type': types[path.extname(f)] || 'application/octet-stream', 'content-length': size, 'cache-control': 'no-store' });
  if (!/\.mp4$/.test(u) || mode !== 'slow') return fs.createReadStream(f).pipe(res);
  const fd = fs.openSync(f, 'r'); let pos = 0, closed = false; res.on('close', () => { closed = true; if (pos < size) console.log('SERVER: client left at', Math.round(pos / size * 100) + '%'); });
  const tick = () => { if (closed || pos >= size) { if (!closed) res.end(); return; } const b = Buffer.alloc(Math.min(+process.env.CHUNK || 262144, size - pos)); fs.readSync(fd, b, 0, b.length, pos); pos += b.length; res.write(b); setTimeout(tick, +process.env.GAP || 25); };
  tick();
}).listen(port, () => console.log('listening', port, mode));
