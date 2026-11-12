# More line art, same pen as /tmp/v30/mkart.py: fern, twig, flower, and the corner vine that frames the hello video.
import math, random, json, subprocess, sys
random.seed(11)
def fmt(v): return ('%.1f' % v).rstrip('0').rstrip('.')
def bez(p0, p1, p2, p3, t):
    u = 1 - t
    x = u**3*p0[0] + 3*u*u*t*p1[0] + 3*u*t*t*p2[0] + t**3*p3[0]
    y = u**3*p0[1] + 3*u*u*t*p1[1] + 3*u*t*t*p2[1] + t**3*p3[1]
    dx = 3*u*u*(p1[0]-p0[0]) + 6*u*t*(p2[0]-p1[0]) + 3*t*t*(p3[0]-p2[0])
    dy = 3*u*u*(p1[1]-p0[1]) + 6*u*t*(p2[1]-p1[1]) + 3*t*t*(p3[1]-p2[1])
    return x, y, math.degrees(math.atan2(dy, dx))
def leaf(x, y, ang, L, W, rib=True):
    d = f'M0 0Q{fmt(L*0.5)} {fmt(-W)} {fmt(L)} 0Q{fmt(L*0.5)} {fmt(W)} 0 0Z' + (f'M{fmt(L*0.15)} 0H{fmt(L*0.72)}' if rib else '')
    return f'<path transform="translate({fmt(x)} {fmt(y)}) rotate({fmt(ang)})" d="{d}"/>'
def stem(p0, p1, p2, p3): return f'M{fmt(p0[0])} {fmt(p0[1])}C{fmt(p1[0])} {fmt(p1[1])} {fmt(p2[0])} {fmt(p2[1])} {fmt(p3[0])} {fmt(p3[1])}'
def leaves_along(P, ts, L, W, spread=42, start_side=1, shrink=True):
    out = []; side = start_side
    for i, t in enumerate(ts):
        x, y, a = bez(*P, t); k = (1 - 0.35 * (i / max(1, len(ts) - 1))) if shrink else 1
        out.append(leaf(x, y, a - side * spread, L * k, W * k)); side = -side
    return ''.join(out)
def pairs_along(P, ts, L, W, spread=62, shrink=0.55):
    # fern pinnae: a pair at each t, both sides, getting smaller toward the tip
    out = []
    for i, t in enumerate(ts):
        x, y, a = bez(*P, t); k = 1 - shrink * (i / max(1, len(ts) - 1))
        out.append(leaf(x, y, a - spread, L * k, W * k, False)); out.append(leaf(x, y, a + spread, L * k, W * k, False))
    return ''.join(out)
def flower_head(x, y, r, n=5, rot=0):
    # petals as small leaf shapes pointing out from the centre, a dot in the middle
    out = []
    for i in range(n):
        a = rot + i * 360 / n
        out.append(leaf(x + math.cos(math.radians(a)) * r * .28, y + math.sin(math.radians(a)) * r * .28, a, r, r * .42, False))
    out.append(f'<circle cx="{fmt(x)}" cy="{fmt(y)}" r="{fmt(r * .26)}"/>')
    return ''.join(out)
S = 'fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"'
# fern: a frond leaning right, eight pairs of pinnae, a small tip
P = ((14, 150), (40, 112), (36, 60), (104, 14))
tx, ty, ta = bez(*P, 1.0)
fern = f'<svg viewBox="0 0 130 160" {S}><path d="{stem(*P)}"/>{pairs_along(P, [0.1, 0.21, 0.32, 0.43, 0.54, 0.65, 0.76, 0.87], 26, 6.5)}{leaf(tx, ty, ta, 10, 3.5, False)}</svg>'
# twig: a short stem with two opposite leaves and one at the tip
P = ((6, 64), (30, 56), (56, 40), (92, 12))
tx, ty, ta = bez(*P, 1.0)
twig = f'<svg viewBox="0 0 100 70" {S}><path d="{stem(*P)}"/>{leaf(*bez(*P, .45)[:2], bez(*P, .45)[2] - 58, 26, 8)}{leaf(*bez(*P, .5)[:2], bez(*P, .5)[2] + 58, 24, 7.5)}{leaf(tx, ty, ta - 8, 20, 6.5)}</svg>'
# flower: a stem with two leaves and a five-petal head
P = ((30, 96), (24, 70), (36, 48), (30, 22))
fl = f'<svg viewBox="0 0 60 100" {S}><path d="{stem(*P)}"/>{leaf(*bez(*P, .35)[:2], bez(*P, .35)[2] - 62, 20, 6.5)}{leaf(*bez(*P, .55)[:2], bez(*P, .55)[2] + 62, 18, 6)}{flower_head(30, 18, 13, 5, -90)}</svg>'
# corner: two vines leaving the top-left corner, one along the top edge, one down the left edge: wavy stems, leaves both sides,
# two small flowers and a tendril on each, so four of them around the video read as one garland
top = ((8, 12), (60, -6), (140, 30), (212, 6))
left = ((12, 8), (-6, 60), (30, 140), (6, 212))
def vine(P, side0, flowers):
    out = [f'<path d="{stem(*P)}"/>']
    out.append(leaves_along(P, [0.08, 0.17, 0.26, 0.36, 0.46, 0.56, 0.66, 0.76, 0.86], 20, 6.5, 54, side0, False))
    for t, r in flowers:
        x, y, a = bez(*P, t); nx, ny = -math.sin(math.radians(a)), math.cos(math.radians(a))
        k = -side0
        out.append(f'<path d="M{fmt(x)} {fmt(y)}q{fmt(nx * 6 * k)} {fmt(ny * 6 * k)} {fmt(nx * 13 * k)} {fmt(ny * 13 * k)}"/>')
        out.append(flower_head(x + nx * 20 * k, y + ny * 20 * k, r, 5, a))
    tx, ty, ta = bez(*P, 1.0)
    out.append(f'<path transform="translate({fmt(tx)} {fmt(ty)}) rotate({fmt(ta)})" d="M0 0c8-1 13 4 10 9s-9 3-8-2"/>')
    return ''.join(out)
corner = f'<svg viewBox="0 0 220 220" {S}>{vine(top, -1, [(0.4, 10), (0.82, 8)])}{vine(left, 1, [(0.4, 10), (0.82, 8)])}</svg>'
art = {'fern': fern, 'twig': twig, 'flower': fl, 'corner': corner}
open('/tmp/v30/art_raw.json', 'w').write(json.dumps(art))
subprocess.run(['node', '/tmp/v30/fitbox.js'], check=True)
art = json.loads(open('/tmp/v30/art_fit.json').read())
js = open('/home/claude/work/team/art.js').read()
a = js.index('const ART = {'); b = js.index('};', a)
block = js[a:b]
for k, v in art.items():
    if f'  {k}: `' in block: continue
    block += f'  {k}: `{v}`,\n'
js = js[:a] + block + js[b:]
open('/home/claude/work/team/art.js', 'w').write(js)
old = json.loads(open('/tmp/v30/art_fit.json').read())
cells = ''.join(f'<div class=c><div class=i>{v}</div><div class=l>{k}</div></div>' for k, v in art.items())
open('/tmp/v35/art2.html', 'w').write('<!doctype html><style>body{margin:0;background:#0c1a15;color:rgba(143,217,176,.75);font-family:-apple-system,Helvetica,Arial}.g{display:flex;gap:30px;padding:24px;align-items:flex-end;flex-wrap:wrap}.c{text-align:center}.i svg{height:200px;width:auto;display:block}.l{color:#a9c4b7;margin-top:10px;font-size:15px}</style><div class=g>' + cells + '</div>')
print('ok', list(art))
