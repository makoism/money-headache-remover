from PIL import Image
G = [
"...oooooooooooooooooooooo...",
"..olllllllllllllllllllllllo.",
"..olwwwwwwwwwwwwwwwwwwwwwdo.",
"..olwwwwwwwwwwwwwwwwwwwwwdo.",
"..olwwwwwwwwwggggwwwwwwwwdo.",
"..olwwwwwwwwgGGGGgwwwwwwwdo.",
"..olwwwwwwwggGggGggwwwwwwdo.",
"..olwwwwwwwgGgGGgGgwwwwwwdo.",
"..olwwwwwwwggGgggGggwwwwwdo.",
"..olwwwwwwwwgGGGGgwwwwwwwdo.",
"..olwwwwwwwwwggggwwwwwwwwdo.",
"..olwwwwwwwwwwwwwwwwwwwwwdo.",
"..oddddddddddddddddddddddo..",
"...ooooooooooooooooooooooo..",
"....okssssssssssssssssko....",
".ooookssssssssssssssssskoo..",
".osskssssssssssssssssssksso.",
".ossssssssssssssssssssssso..",
"..ossssssssssssssssssssso...",
"..oskskskskssssssssssssko...",
"...osososososssssssssko.....",
"....ooooooooooooooooo.......",
".....orrrrrrrrrrrrro........",
".....orrRRrrrrrrrrro........",
".....orrRRrrrrrrrrro........",
".....orrrrrrrrrrrrro........",
"....occccccccccccccco.......",
"....ooooooooooooooooo.......",
".....orrrrrrrrrrrrro........",
".....orrrrrrrrrrrrro........",
".....orrrrrrrrrrrrro........",
".....orrrrrrrrrrrrro........",
]
pal={'o':(43,26,16),'l':(201,154,100),'w':(138,90,55),'d':(94,61,37),'g':(255,233,160),'G':(255,248,210),'s':(232,185,138),'k':(196,143,99),'r':(75,63,143),'R':(112,100,190),'c':(233,217,182)}
W=max(len(r) for r in G); print(W,len(G), [len(r) for r in G if len(r)!=W])
im=Image.new('RGBA',(W,len(G)),(0,0,0,0))
for y,r in enumerate(G):
    for x,ch in enumerate(r):
        if ch in pal: im.putpixel((x,y),pal[ch]+(255,))
im.resize((W*12,len(G)*12),Image.NEAREST).save('/tmp/v37/hand.png')
