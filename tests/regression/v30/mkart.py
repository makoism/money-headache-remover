import math, random
random.seed(7)
def fmt(v): return ('%.1f' % v).rstrip('0').rstrip('.')
def bez(p0, p1, p2, p3, t):
    u = 1 - t
    x = u**3*p0[0] + 3*u*u*t*p1[0] + 3*u*t*t*p2[0] + t**3*p3[0]
    y = u**3*p0[1] + 3*u*u*t*p1[1] + 3*u*t*t*p2[1] + t**3*p3[1]
    dx = 3*u*u*(p1[0]-p0[0]) + 6*u*t*(p2[0]-p1[0]) + 3*t*t*(p3[0]-p2[0])
    dy = 3*u*u*(p1[1]-p0[1]) + 6*u*t*(p2[1]-p1[1]) + 3*t*t*(p3[1]-p2[1])
    return x, y, math.degrees(math.atan2(dy, dx))
def leaf(x, y, ang, L, W, rib=True):
    # a leaf pointing along +x in local space: base at 0,0 tip at L,0; two curves bulging +-W
    d = f'M0 0Q{fmt(L*0.5)} {fmt(-W)} {fmt(L)} 0Q{fmt(L*0.5)} {fmt(W)} 0 0Z' + (f'M{fmt(L*0.15)} 0H{fmt(L*0.72)}' if rib else '')
    return f'<path transform="translate({fmt(x)} {fmt(y)}) rotate({fmt(ang)})" d="{d}"/>'
def stem_path(p0, p1, p2, p3): return f'M{fmt(p0[0])} {fmt(p0[1])}C{fmt(p1[0])} {fmt(p1[1])} {fmt(p2[0])} {fmt(p2[1])} {fmt(p3[0])} {fmt(p3[1])}'
def leaves_along(p0, p1, p2, p3, ts, L, W, spread=42, start_side=1, shrink=True):
    out = []; side = start_side
    for i, t in enumerate(ts):
        x, y, a = bez(p0, p1, p2, p3, t)
        k = (1 - 0.35 * (i / max(1, len(ts) - 1))) if shrink else 1
        out.append(leaf(x, y, a - side * spread, L * k, W * k)); side = -side
    return ''.join(out)
S = 'fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"'
# sprig: a gentle stem rising to the right, five leaves alternating, a small end leaf
p = ((4, 60), (40, 56), (76, 36), (116, 10))
sprig = f'<svg viewBox="0 0 122 66" {S}><path d="{stem_path(*p)}"/>{leaves_along(*p, [0.22, 0.4, 0.57, 0.73, 0.87], 24, 7.5)}{leaf(116, 10, -40, 13, 4.5, False)}</svg>'
# branch: a long arch, seven leaves, used over a big number
p = ((4, 72), (50, 40), (100, 22), (168, 6))
branch = f'<svg viewBox="0 0 172 78" {S}><path d="{stem_path(*p)}"/>{leaves_along(*p, [0.16, 0.3, 0.44, 0.58, 0.71, 0.84], 26, 8, 46, -1)}{leaf(168, 6, -30, 14, 5, False)}</svg>'
# vine: climbs from the bottom with a wave, leaves alternate, a curl at the top
p = ((44, 228), (-30, 170), (110, 90), (30, 10))
vine_leaves = leaves_along(*p, [0.12, 0.26, 0.4, 0.54, 0.68, 0.82], 22, 7, 70, 1, False)
tx, ty, ta = bez(*p, 1.0)
vine = f'<svg viewBox="0 0 90 232" {S}><path d="{stem_path(*p)}"/>{vine_leaves}{leaf(tx, ty, ta, 14, 4.5, False)}</svg>'
# sprout: a short stem, two leaves opening, a bud
sprout = f'<svg viewBox="0 0 76 76" {S}><path d="M38 72V38"/>{leaf(38, 44, -150, 30, 9)}{leaf(38, 40, -32, 30, 9)}<path d="M38 38c-2-6 0-10 4-12 2 4 1 8-4 12z"/></svg>'
# grass: eleven thin blades, each a quadratic curve, varied height and lean
blades = []
xs = [6, 17, 27, 36, 48, 58, 69, 80, 90, 101, 113, 124]
for i, x in enumerate(xs):
    h = random.uniform(16, 40); lean = random.uniform(-9, 11)
    tipx = x + lean; tipy = 48 - h; cx = x + lean * 0.25; cy = 48 - h * 0.55
    blades.append(f'M{fmt(x)} 48Q{fmt(cx)} {fmt(cy)} {fmt(tipx)} {fmt(tipy)}')
grass = f'<svg viewBox="0 0 132 50" {S.replace("1.4", "1.3")}><path d="{"".join(blades)}"/></svg>'
art = {'grass': grass, 'sprig': sprig, 'vine': vine, 'sprout': sprout, 'branch': branch}
# fit each viewBox to its drawing with a margin, so no leaf is cut at the edge of the box (the bounds come from a headless browser)
import json, subprocess
open('/tmp/v30/art_raw.json', 'w').write(json.dumps(art))
subprocess.run(['node', '/tmp/v30/fitbox.js'], check=True)
art = json.loads(open('/tmp/v30/art_fit.json').read())
js = open('/home/claude/work/team/art.js').read()
a = js.index('const ART = {'); b = js.index('};', a) + 2
body = 'const ART = {\n' + ''.join(f'  {k}: `{v}`,\n' for k, v in art.items()) + '};'
js = js[:a] + body + js[b:]
js = js.replace("""const ART_STROKE = 'fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"';\n""", "")
open('/home/claude/work/team/art.js', 'w').write(js)
cells = ''.join(f'<div class=c><div class=i>{v}</div><div class=l>{k}</div></div>' for k, v in art.items())
open('/tmp/v30/art.html', 'w').write('<!doctype html><style>body{margin:0;background:#0c1a15;color:rgba(143,217,176,.75);font-family:-apple-system,Helvetica,Arial}.g{display:flex;gap:30px;padding:24px;align-items:flex-end;flex-wrap:wrap}.c{text-align:center}.i svg{height:180px;width:auto;display:block}.l{color:#a9c4b7;margin-top:10px;font-size:15px}</style><div class=g>' + cells + '</div>')
print('ok')
