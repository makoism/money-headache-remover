from PIL import Image
import sys, json
# crop around given CSS boxes (x,y,w,h) in a 2x screenshot
def crop(name, box, pad=140, out=None):
    im = Image.open(f'/tmp/v32/{name}.png'); x, y, w, h = box
    l = max(0, (x - pad) * 2); t = max(0, (y - pad) * 2); r = min(im.width, (x + w + 40) * 2); b = min(im.height, (y + h + pad) * 2)
    return im.crop((l, t, r, b))
crops = [crop('s_home', (293, 544, 65, 36), 200), crop('s_home', (309, 3364, 27, 33), 120), crop('s_receipts', (322, 2047, 36, 30), 160), crop('s_goals', (322, 1229, 36, 45), 160), crop('s_month', (322, 858, 36, 36), 160)]
W = sum(c.width for c in crops) + 10 * len(crops); H = max(c.height for c in crops)
s = Image.new('RGB', (W, H), (30, 30, 30)); x = 0
for c in crops: s.paste(c, (x, 0)); x += c.width + 10
s.resize((s.width // 2, s.height // 2)).save('/tmp/v32/pix_crops.png')
