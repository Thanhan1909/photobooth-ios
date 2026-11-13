"""Create BloomBooth app icons with Python standard library, no external assets."""
import math
import os
import struct
import sys
import zlib

def png(n, file_path):
    data=bytearray()
    def circle(x,y,cx,cy,r):
        return (x-cx)**2+(y-cy)**2 < r*r
    for y in range(n):
        row=bytearray([0])
        for x in range(n):
            u=x/n
            v=y/n
            r=int(255-9*v)
            g=int(247-28*v)
            b=int(241-21*v)
            # rounded-square app icon background
            # stylized Bloom flower: five distinct soft-pink petals
            cx=.50
            cy=.47
            rad=.135
            for i in range(5):
                theta=-math.pi/2+i*math.tau/5
                px=cx+math.cos(theta)*rad
                py=cy+math.sin(theta)*rad
                dx=(u-px)/.145
                dy=(v-py)/.145
                if dx*dx+dy*dy<1:
                    r,g,b=237,151,166
            if circle(u,v,cx,cy,.085):
                r,g,b=255,228,151
            if circle(u,v,cx,cy,.023):
                r,g,b=253,250,223
            # sparkle accents
            for sx,sy in ((.18,.20),(.82,.26),(.78,.77),(.23,.78)):
                dx=abs(u-sx)
                dy=abs(v-sy)
                if (dx < .016 and dy < .067*(1-dx/.016)) or (
                    dy < .016 and dx < .067*(1-dy/.016)):
                    r,g,b=213,134,148
            row.extend((r,g,b,255))
        data.extend(row)
    def chunk(name,payload):
        return struct.pack('!I',len(payload))+name+payload+struct.pack(
            '!I',zlib.crc32(name+payload)&0xffffffff)
    image=b'\x89PNG\r\n\x1a\n'
    image+=chunk(b'IHDR',struct.pack('!2I5B',n,n,8,6,0,0,0))
    image+=chunk(b'IDAT',zlib.compress(data,9))
    image+=chunk(b'IEND',b'')
    with open(file_path,'wb') as f:
        f.write(image)

if __name__=='__main__':
    root=sys.argv[1]
    directory=os.path.join(root,'icons')
    os.makedirs(directory,exist_ok=True)
    for n in (180,192,512):
        png(n,os.path.join(directory,f'icon-{n}.png'))
        print('Generated',n,'icon')
