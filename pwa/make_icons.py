# The Burrow icon: a grassy mound with a round door, a little pile of coins inside. Drawn once here as a 16 x 14 pixel picture,
# then written as the three SVGs, rendered to PNG by render_icons.js, and packed into favicon.ico.
import subprocess, os
from PIL import Image
ART = [
 "....HHHHHH......",
 "..HHHHHHGGGF....",
 ".HHHHGGGGGGGGD..",
 ".HHHGGGGGGGGGGD.",
 "HHHGEEEEEEEEGGGD",
 "HHGEKKKKKKKKEGGD",
 "HGGEKKKccKKKEGGD",
 "GGGEKKcCWcKKEGGD",
 "GGGEKKcCCcKKEGGD",
 "GGGEKccccccKEGGD",
 "GGGEcCWccCWcEGGD",
 "GGGEcCCccCCcEGGD",
 "GGGEKccKKccKEGGD",
 "DDDDDDDDDDDDDDDD",
 ".DDDDDDDDDDDDDD.",
]
PAL = {'H':'#9be37f','G':'#52b45c','D':'#2f7a45','E':'#8a5a38','K':'#150c07','C':'#ffd25a','c':'#d9962a','W':'#fff4b0','F':'#ff8fb0'}
def rects(cell, ox, oy):
    out = []
    for j, row in enumerate(ART):
        i = 0
        while i < len(row):
            ch = row[i]
            if ch == '.': i += 1; continue
            k = i
            while k + 1 < len(row) and row[k + 1] == ch: k += 1
            out.append(f'<rect x="{ox + i * cell:g}" y="{oy + j * cell:g}" width="{(k - i + 1) * cell:g}" height="{cell:g}" fill="{PAL[ch]}"/>')
            i = k + 1
    return ''.join(out)
head = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512" shape-rendering="crispEdges">'
# app icon: dark green rounded square, the burrow centred
open('icon.svg', 'w').write(head + '<rect width="512" height="512" rx="112" fill="#0c1a15"/>' + rects(26, 48, 61) + '</svg>')
# maskable: full-bleed background, art inside the safe circle
open('icon-maskable.svg', 'w').write(head + '<rect width="512" height="512" fill="#0c1a15"/>' + rects(21, 88, 98) + '</svg>')
# favicon: no background, the burrow fills the square
open('favicon.svg', 'w').write(head + rects(32, 0, 16) + '</svg>')
subprocess.check_call(['node', 'render_icons.js'])
ims = [Image.open(f'favicon-{n}.png').convert('RGBA') for n in (32, 48)]
big = Image.open('favicon-48.png').convert('RGBA')
big.save('favicon.ico', sizes=[(16, 16), (32, 32), (48, 48)])
print('icons written')
