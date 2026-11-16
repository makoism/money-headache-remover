# The Burrow icon: a grassy burrow hill with a round door and a little gold inside, a few flowers, sparkles in a lavender sky.
# Drawn once here as a 16 x 16 pixel picture (big pixels, so it still reads at 16 px), then written as the SVGs, PNGs and favicon.ico.
from PIL import Image, ImageDraw
ART = [
 "aaaaaaaaaaaaaaaa",
 "aaaWaaaaaaaaaaaa",
 "aaWYWaaaaaaaWaaa",
 "mmmWmmmmmmmWYWmm",
 "ssssssssssssWsss",
 "sssssGGhhhGGssss",
 "ssssGhhgggghGsss",
 "sssGhgggFgggghGs",
 "ssGgggBBBBgggGss",
 "sGgggBKKKKBgggGs",
 "GgggBKKKKKKBgggG",
 "GgFgBKKCCKKBggfG",
 "GgggBKCCCCKBgggG",
 "GGggBBBBBBBBggGG",
 "DDDDDDDDDDDDDDDD",
 "DDDDDDDDDDDDDDDD",
]
PAL = {'a':'#c8c0f0','m':'#c2d6ee','s':'#bfe6ee','W':'#ffffff','Y':'#ffe27a','G':'#1f6a3a','g':'#3a9e52','h':'#7ad07a','F':'#ff8fb8','f':'#ffd84a',
       'B':'#6e4529','K':'#120a05','C':'#f6c945','D':'#4a3320'}
N = 16
def hx(h): return tuple(int(h[i:i+2], 16) for i in (1, 3, 5))
def rects(cell):
    out = []
    for j, row in enumerate(ART):
        assert len(row) == N, (j, row)
        i = 0
        while i < N:
            ch = row[i]; k = i
            while k + 1 < N and row[k + 1] == ch: k += 1
            out.append(f'<rect x="{i*cell}" y="{j*cell}" width="{(k-i+1)*cell}" height="{cell}" fill="{PAL[ch]}"/>')
            i = k + 1
    return ''.join(out)
head = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512" shape-rendering="crispEdges">'
def rounded(inner, rx):
    return head + f'<defs><clipPath id="r"><rect width="512" height="512" rx="{rx}"/></clipPath></defs><g clip-path="url(#r)">' + inner + '</g></svg>'
open('icon.svg', 'w').write(rounded(rects(32), 104))
open('favicon.svg', 'w').write(rounded(rects(32), 104))
open('icon-maskable.svg', 'w').write(head + f'<rect width="512" height="512" fill="{PAL["a"]}"/><g transform="translate(64 64) scale(.75)">' + rects(32) + '</g></svg>')
im = Image.new('RGBA', (N, N))
for y, row in enumerate(ART):
    for x, ch in enumerate(row): im.putpixel((x, y), hx(PAL[ch]) + (255,))
def rmask(size, frac=.2):
    m = Image.new('L', (size * 4, size * 4), 0); ImageDraw.Draw(m).rounded_rectangle((0, 0, size * 4 - 1, size * 4 - 1), radius=int(size * 4 * frac), fill=255)
    return m.resize((size, size), Image.LANCZOS)
big = im.resize((512, 512), Image.NEAREST)
def out(name, size, round_=True):
    r = (im.resize((size, size), Image.NEAREST) if size % N == 0 else big.resize((size, size), Image.LANCZOS)).convert('RGBA')
    if round_: r.putalpha(rmask(size))
    r.save(name); return r
out('favicon-32.png', 32); r48 = out('favicon-48.png', 48); out('icon-192.png', 192); out('icon-512.png', 512); out('apple-touch-icon.png', 180, False)
mk = Image.new('RGBA', (512, 512), hx(PAL['a']) + (255,)); mk.paste(big.resize((384, 384), Image.NEAREST), (64, 64)); mk.save('icon-maskable-512.png')
r16 = im.copy(); r16.putalpha(rmask(16)); r32 = out('favicon-32.png', 32)
r48.save('favicon.ico', sizes=[(16, 16), (32, 32), (48, 48)])
print('icons written')
