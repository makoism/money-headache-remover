from PIL import Image
L = [
"..............oo....",
".............osso...",
"............ossko...",
"...........ossskoo..",
"..........osssskso..",
"........ooosssssko..",
".......osssssssssko.",
"......ossssssssssko.",
".....osssssssssssko.",
"....ossssssssssssko.",
"...orrcsssssssssko..",
"..orrRrcssssssskoo..",
".orrrrrrcsssssko....",
"orrRrrrrrcsssko.....",
"orrrrrrrrrcoo.......",
"oorrrrrrrro.........",
]
pal={'o':(43,26,16),'s':(232,185,138),'k':(196,143,99),'r':(75,63,143),'R':(112,100,190),'c':(233,217,182)}
W=max(map(len,L)); L=[r.ljust(W,'.') for r in L]
im=Image.new('RGBA',(W*2+14,len(L)),(30,40,30,255))
for y,r in enumerate(L):
    for x,ch in enumerate(r):
        if ch in pal: im.putpixel((x,y),pal[ch]+(255,)); im.putpixel((W*2+14-1-x,y),pal[ch]+(255,))
im.resize((im.width*12,im.height*12),Image.NEAREST).save('/tmp/v37/hands.png')
open('/tmp/v37/hands_rows.txt','w').write("\n".join(L))
