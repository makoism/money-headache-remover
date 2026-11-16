# The Burrow icon: a tree, a grassy mound at its roots with a little door and a few coins inside, on a deep green square. Drawn once here as a 16 x 16 pixel picture,
# then written as the three SVGs, rendered to PNG by render_icons.js, and packed into favicon.ico.
import subprocess, os
from PIL import Image
ART = [
 "BBBBBBBBBBBBBBBB",
 "BBLLLLBBBBBBBBBB",
 "BLLllLLLBBBBBBBB",
 "LLllllLLLBBBBBBB",
 "LLlLLLLLLBBBBBBB",
 "BLLLLLDLLBBBBBBB",
 "BBLLDDLLBBBBBBBB",
 "BBBBttBBBBBBBBBB",
 "BBBBttBBHHHHHHBB",
 "BBBBttBHGGGGGGGB",
 "BBBttBGGGEEEEGGG",
 "BBttBGGGEKKKKEGG",
 "BtttBGGGEKcCKEGG",
 "ddtttddGEcCWcEGG",
 "DDDDDDDDDDDDDDDD",
 "DDDDDDDDDDDDDDDD",
]
PAL = {'B':'#244a3b','L':'#2a7040','l':'#3a8a50','D':'#1b4a2d','d':'#255a38','t':'#7a5030','H':'#4a9a5e','G':'#37794c','E':'#8a5a38','K':'#2c180d','C':'#f4c95a','c':'#c8902c','W':'#fff1b0'}
def rects(cell, ox, oy, skipbg=True):
    out = []
    for j, row in enumerate(ART):
        i = 0
        while i < len(row):
            ch = row[i]
            if ch == '.' or (ch == 'B' and skipbg): i += 1; continue
            k = i
            while k + 1 < len(row) and row[k + 1] == ch: k += 1
            out.append(f'<rect x="{ox + i * cell:g}" y="{oy + j * cell:g}" width="{(k - i + 1) * cell:g}" height="{cell:g}" fill="{PAL[ch]}"/>')
            i = k + 1
    return ''.join(out)
head = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512" shape-rendering="crispEdges">'
BG = PAL['B']
# app icon: rounded square of the same deep green, the picture centred
open('icon.svg', 'w').write(head + f'<rect width="512" height="512" rx="112" fill="{BG}"/>' + rects(28, 32, 32) + '</svg>')
# maskable: full-bleed, picture inside the safe circle
open('icon-maskable.svg', 'w').write(head + f'<rect width="512" height="512" fill="{BG}"/>' + rects(24, 64, 64) + '</svg>')
# favicon: the picture fills the whole square, background included
open('favicon.svg', 'w').write(head + f'<rect width="512" height="512" fill="{BG}"/>' + rects(32, 0, 0) + '</svg>')
subprocess.check_call(['node', 'render_icons.js'])
ims = [Image.open(f'favicon-{n}.png').convert('RGBA') for n in (32, 48)]
big = Image.open('favicon-48.png').convert('RGBA')
big.save('favicon.ico', sizes=[(16, 16), (32, 32), (48, 48)])
print('icons written')
