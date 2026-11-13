import json,re
J=json.load(open('/tmp/v37/pix.json'))
p='pixel.js'; s=open(p).read()
lines=[]
for k in ['fox','bunny','frog','chick','sheep','duck','owl','snail']:
    m=re.search(r'viewBox="0 0 (\d+) (\d+)"',J[k])
    lines.append("  %s: { w: %s, h: %s, svg: %s }," % (k, m.group(1), m.group(2), json.dumps(J[k])))
i=s.index('\n};\nconst pix = ')
s=s[:i]+'\n'+'\n'.join(lines)+s[i:]
old="""  ['#secRoad', 'sunflower', 3, 'tr'], ['#where', 'cactus', 3, 'tr'], ['#p-basics .card.sect', 'daisy', 3, 'tr'],
];"""
new="""  ['#secRoad', 'sunflower', 3, 'tr'], ['#where', 'cactus', 3, 'tr'], ['#p-basics .card.sect', 'owl', 3, 'tr'],
  /* small animals where the line-art sprigs used to sit (v36) */
  ['#scan', 'bunny', 3, 'tr'], ['#ledger', 'fox', 3, 'tr'], ['#rcRemind', 'chick', 3, 'tr'], ['#secLog', 'frog', 3, 'tr'],
  ['#secGoals', 'duck', 3, 'tr'], ['#monthTable', 'sheep', 3, 'tr'],
];"""
assert old in s; s=s.replace(old,new)
o2="function placePix() { PIX_SEATS.forEach(seat => { const host = $(seat[0]); if (!host) return;"
assert o2 in s
s=s.replace(o2,"function placePix() { PIX_SEATS.forEach(seat => { let host = $(seat[0]); if (!host) return; if (seat[0] === '#monthTable') host = host.closest('.card') || host;")
open(p,'w').write(s)
p='art.js'; s=open(p).read()
old="const ART_SEATS = [['#scan', 'sprig'], ['#hero', 'vine'], ['#ledger', 'grass'], ['#rcRemind', 'sprig'], ['#monthTable', 'branch'], ['#p-basics .card.sect', 'grass'], ['#secLog', 'twig'], ['#secGoals', 'sprout']];"
new="/* the card corners now hold pixel animals (pixel.js); the line art stays in the setup and on the hero */\nconst ART_SEATS = [['#hero', 'vine']];"
assert old in s; s=s.replace(old,new); open(p,'w').write(s)
print('ok')
