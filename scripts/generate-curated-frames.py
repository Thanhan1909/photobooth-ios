"""Build 14 original photo-frame artworks influenced by user-provided Pinterest concepts.
Never embed, trace, or redistribute Pinterest-owned art or people.
All files are deterministic and safe to publish as BloomBooth-owned vectors.
"""
import json,html,math
from pathlib import Path
ROOT=Path(r'E:\PhotoBooth\photobooth-ios\mobile')
OUT=ROOT/'frames'
OUT.mkdir(parents=True,exist_ok=True)
S=[
 # id, display name, original concept,  aspect, bg, ink, accent, shape, photo slot rectangles (x,y,w,h)
 ('pink-pop','Pink Pop Diary','playful stickers',.56,'#ffe0ed','#973d70','#ff7ba6','round',[(.12,.17,.76,.175),(.12,.395,.76,.175),(.12,.625,.76,.175)]),
 ('pressed-rose','Pressed Rose Letter','romantic pressed flowers',.56,'#f5e4dc','#7e5960','#cb8b96','arch',[(.14,.19,.72,.28),(.14,.555,.72,.28)]),
 ('mono-doodle','Mono Zine Doodles','monochrome editorial',.51,'#161820','#fff8e5','#d7d2df','oval',[(.14,.17,.72,.295),(.14,.56,.72,.29)]),
 ('midnight-film','Midnight 35mm','35mm film perforation',.45,'#1a1b23','#f8f3e8','#fff9dd','round',[(.145,.12,.71,.20),(.145,.385,.71,.20),(.145,.65,.71,.20)]),
 ('theater-ticket','Theater Ticket Night','vintage ticket gallery',.58,'#691e32','#ffdfb3','#d7a36c','ticket',[(.12,.17,.35,.285),(.53,.17,.35,.285),(.12,.52,.35,.285),(.53,.52,.35,.285)]),
 ('instant-camera','Instant Snapshot Party','instant camera stickers',.56,'#f7ead4','#5e5264','#d9989e','paper',[(.16,.23,.68,.205),(.16,.47,.68,.205),(.16,.71,.68,.205)]),
 ('burgundy-love','Burgundy Love Notes','romantic wine postcard',.54,'#73182e','#fff6e8','#e0a9a4','round',[(.13,.13,.74,.217),(.13,.395,.74,.217),(.13,.66,.74,.217)]),
 ('graph-camera','Graph Paper Memory','retro contact sheet',.55,'#f6f0e2','#4e697f','#ec9d7c','paper',[(.20,.24,.60,.16),(.20,.455,.60,.16),(.20,.67,.60,.16)]),
 ('gingham-bows','Gingham Ribbon Book','pink gingham scrapbook',.63,'#f8e4ef','#835777','#dd88af','arch',[(.10,.18,.365,.29),(.535,.18,.365,.29),(.10,.54,.365,.29),(.535,.54,.365,.29)]),
 ('cinema-candy','Cinema Candy Scrap','movie journal collage',.59,'#ecd5b9','#704b46','#c58067','paper',[(.13,.24,.74,.175),(.13,.475,.74,.175),(.13,.71,.74,.175)]),
 ('blue-fieldbook','Blue Field Notes','blue scrapbook collection',.65,'#e5e9f3','#3f637e','#9eacc9','cut',[(.08,.19,.385,.31),(.535,.19,.385,.31),(.08,.57,.385,.31),(.535,.57,.385,.31)]),
 ('candy-friends','Candy Friends Club','original little critters',.56,'#fff0f4','#ae587d','#ffc0cc','round',[(.135,.17,.73,.177),(.135,.398,.73,.177),(.135,.626,.73,.177)]),
 ('polaroid-wall','Polaroid Mood Wall','handmade photo memory wall',.66,'#f3eee6','#806c76','#b3a7c9','paper',[(.08,.11,.38,.23),(.55,.135,.36,.225),(.12,.40,.37,.23),(.55,.465,.34,.225),(.12,.71,.50,.20)]),
 ('rose-poetry','Rose Poetry Note','handwritten floral letter',.58,'#edddd6','#70535a','#cf9399','arch',[(.10,.14,.62,.45),(.43,.66,.45,.24)]),
]
def stars(n=15,color='#fff',rx=560,ry=940):
 return ''.join(f'<path d="M{x} {y-6}L{x+2} {y-2}L{x+7} {y}L{x+2} {y+2}L{x} {y+7}L{x-2} {y+2}L{x-7} {y}L{x-2} {y-2}Z" fill="{color}" opacity=".75"/>' for x,y in ((31+i*61)%rx+14,(53+i*113)%ry+22) for i in [0]) if n==1 else ''.join(f'<circle cx="{(42+i*67)%rx+15}" cy="{(89+i*109)%ry+35}" r="{2+(i%3)}" fill="{color}" opacity=".75"/>' for i in range(n))
def blossom(x,y,r,petal='#e9a5b1'):
 return '<g>'+''.join(f'<ellipse cx="{x+math.cos(a)*r*.60:.1f}" cy="{y+math.sin(a)*r*.60:.1f}" rx="{r*.38:.1f}" ry="{r*.48:.1f}" transform="rotate({a*180/math.pi+90:.0f} {x+math.cos(a)*r*.60:.1f} {y+math.sin(a)*r*.60:.1f})" fill="{petal}"/>' for a in [i*math.tau/5 for i in range(5)])+f'<circle cx="{x}" cy="{y}" r="{r*.24}" fill="#ffe7ac"/></g>'
def bow(x,y,scale=1,color='#db8cac'):
 return f'<g transform="translate({x} {y}) scale({scale})"><path d="M0 0 C-55 -40 -88 -25 -55 12L0 7C47 -28 87 -29 54 13Z" fill="{color}" stroke="#b76d90" stroke-width="4"/><path d="M-4 8L-40 86L0 54L44 84L8 6" fill="{color}" stroke="#b76d90" stroke-width="4"/><circle cx="0" cy="4" r="14" fill="#ffe8ef"/></g>'
def camera(x,y,color='#534b57'):
 return f'<g transform="translate({x} {y})"><rect x="0" y="15" rx="22" width="170" height="95" fill="{color}" stroke="#f7dfd6" stroke-width="7"/><rect x="32" y="0" width="65" height="23" rx="6" fill="{color}"/><circle cx="88" cy="67" r="38" fill="#eddbc7" stroke="#f9f6eb" stroke-width="7"/><circle cx="88" cy="67" r="23" fill="#788b9b"/><circle cx="88" cy="67" r="9" fill="#e9f8ff"/><circle cx="142" cy="43" r="9" fill="#fff9d9"/></g>'
def critter(x,y,color='#f2a2be'):
 return f'<g transform="translate({x} {y})"><ellipse cx="-23" cy="-27" rx="19" ry="29" fill="{color}"/><ellipse cx="23" cy="-27" rx="19" ry="29" fill="{color}"/><circle r="39" fill="{color}"/><circle cx="-14" cy="-3" r="4.6" fill="#49374a"/><circle cx="14" cy="-3" r="4.6" fill="#49374a"/><ellipse cy="10" rx="6" ry="4" fill="#a85269"/><circle cx="-23" cy="11" r="7" fill="#f7cfd5"/><circle cx="23" cy="11" r="7" fill="#f7cfd5"/></g>'
def overlay_art(id,w,h,fg,accent):
 y0=int(h*.063);y1=int(h*.942)
 parts=[]
 if id=='pink-pop':
  parts+=[f'<rect x="12" y="12" width="{w-24}" height="{h-24}" rx="30" fill="none" stroke="#ff91b8" stroke-width="8" stroke-dasharray="16 10"/>',critter(38,85,'#f5a2bc'),critter(w-43,107,'#efb2cf'),bow(w-75,h-90,.65)]
  parts += [blossom(w//2,42,22)]+[blossom(31,int(h*(.31+.15*i)),12) for i in range(4)]
 elif id=='pressed-rose':
  parts+=[f'<rect x="24" y="28" width="{w-48}" height="{h-56}" rx="18" fill="none" stroke="#a98586" stroke-width="5"/>']
  parts += [blossom(45,int(h*(i/7+.11)),16,accent)+blossom(w-40,int(h*(i/7+.12)),13,accent) for i in range(1,6)]
  parts += [f'<path d="M31 {h*.93}Q{w*.5} {h*.98} {w-40} {h*.93}" stroke="#ab8b73" fill="none" stroke-width="4"/>']
 elif id=='mono-doodle':
  parts += [f'<rect y="0" width="{w}" height="70" fill="#f6f2e8"/>',f'<rect y="{h-64}" width="{w}" height="64" fill="#f6f2e8"/>']
  parts += [f'<circle cx="{w-52}" cy="113" r="25" fill="none" stroke="#fff" stroke-width="4"/>',stars(32,'#fff')]
  parts += [f'<path d="M20 {h*.46}l35 21 15-39 20 29" stroke="#fff" stroke-width="4" fill="none"/>']
 elif id=='midnight-film':
  parts += [f'<rect x="0" width="74" height="{h}" fill="#07090d"/><rect x="{w-74}" width="74" height="{h}" fill="#07090d"/>']
  for y in range(38,h-30,71):
   parts += [f'<rect x="14" y="{y}" width="39" height="42" rx="6" fill="#fffbe8"/><rect x="{w-53}" y="{y}" width="39" height="42" rx="6" fill="#fffbe8"/>']
  parts += [stars(19,'#d3c8a8')]
 elif id=='theater-ticket':
  parts += [f'<rect x="20" y="18" width="{w-40}" height="{h-36}" rx="17" fill="none" stroke="#e2c590" stroke-width="8"/>']
  for y in range(60,h-45,62):
   parts += [f'<circle cx="15" cy="{y}" r="11" fill="#fff0d8"/><circle cx="{w-15}" cy="{y}" r="11" fill="#fff0d8"/>']
  parts += [f'<path d="M80 {h*.085}H{w-80}M80 {h*.90}H{w-80}" stroke="#fce7bc" stroke-width="6"/>']
 elif id=='instant-camera':
  parts += [camera(w/2-85,20),stars(15,'#c7868d')]
  parts += [f'<rect x="35" y="{h*.18}" width="{w-70}" height="{h*.73}" rx="27" fill="none" stroke="#c699aa" stroke-width="6" stroke-dasharray="9 12"/>']
 elif id=='burgundy-love':
  parts += [f'<rect x="19" y="18" width="{w-38}" height="{h-36}" fill="none" stroke="#f5c7bf" stroke-width="7"/>',bow(77,75,.55,'#eed6ca')]
  parts += [f'<text x="{w-32}" y="{h*.955}" font-size="70" text-anchor="end" fill="#ffe7d9">♥</text>']
 elif id=='graph-camera':
  for x in range(0,w,24): parts += [f'<path d="M{x} 0V{h}" stroke="#92adbf" stroke-opacity=".22" stroke-width="2"/>']
  for y in range(0,h,24): parts += [f'<path d="M0 {y}H{w}" stroke="#92adbf" stroke-opacity=".22" stroke-width="2"/>']
  parts += [camera(w/2-85,36),f'<path d="M60 200Q{w//2} 165 {w-60} 200" stroke="#d8b29c" fill="none" stroke-width="8"/>']
 elif id=='gingham-bows':
  for x in range(0,w,40):
   parts += [f'<rect x="{x}" width="18" height="{h}" fill="#e9b5ca" opacity=".17"/>']
  for y in range(0,h,40):parts += [f'<rect y="{y}" width="{w}" height="18" fill="#e9b5ca" opacity=".16"/>']
  parts += [bow(75,78,.65),bow(w-67,88,.62),bow(w/2,h-78,.67)]
 elif id=='cinema-candy':
  parts += [f'<rect x="23" y="25" width="{w-46}" height="{h-50}" fill="none" stroke="#915a48" stroke-width="5" stroke-dasharray="13 8"/>']
  for x in range(60,w-45,75):
   parts += [f'<path d="M{x} 40l23 34-27 28-22-30Z" fill="#b97e62" opacity=".75"/>']
  parts += [f'<text x="{w//2}" y="{h*.93}" text-anchor="middle" font-size="34" fill="#794e49">☆ CINEMA CLUB ☆</text>']
 elif id=='blue-fieldbook':
  parts += [f'<rect x="23" y="19" width="{w-46}" height="{h-38}" fill="none" stroke="#6f88b6" stroke-width="6" stroke-dasharray="12 10"/>']
  for x,y in [(63,105),(w-73,115),(64,h-119),(w-78,h-126)]:
   parts += [f'<rect x="{x-24}" y="{y-36}" width="48" height="67" rx="4" fill="#d9e2ec" stroke="#58799d" stroke-width="4"/><circle cx="{x}" cy="{y}" r="11" fill="#9daed1"/>']
  parts += [stars(13,'#607eaa')]
 elif id=='candy-friends':
  parts += [critter(55,90),critter(w-55,85,'#d9aad8'),critter(w/2,h-78,'#e5c08f')]
  parts += [blossom(50,h/2,17),blossom(w-47,h/2,20),stars(16,'#d879a5')]
 elif id=='polaroid-wall':
  parts += [f'<rect x="10" y="16" width="{w-20}" height="{h-32}" rx="23" fill="none" stroke="#a9a0a8" stroke-width="4"/>']
  for x,y,r in [(40,90,-11),(w-40,95,12),(45,h-100,14),(w-60,h-100,-14)]:
   parts += [f'<g transform="translate({x} {y}) rotate({r})"><rect x="-31" y="-18" width="62" height="36" fill="#f7f7f2" stroke="#b5a1b2" stroke-width="4"/><path d="M-20 0H20" stroke="#cd9fc0" stroke-width="3"/></g>']
  parts += [bow(w/2,h-65,.57,'#b3a9ce')]
 elif id=='rose-poetry':
  parts += [f'<path d="M26 28Q{w*.45} 6 {w-25} 28V{h-30}Q{w*.55} {h+8} 26 {h-30}Z" stroke="#9e777b" stroke-width="5" fill="none"/>']
  parts += [blossom(45,int(h*.18),22),blossom(w-44,int(h*.65),26),blossom(62,int(h*.87),19)]
  parts += [f'<path d="M{w*.05} {h*.92}q{w*.4} -18 {w*.77} -22" stroke="#b78d8f" stroke-width="4" fill="none"/>']
 return ''.join(parts)
def rounded_slot(x,y,w,h,shape):
 X,Y,W,H=round(x*600),round(y*1080),round(w*600),round(h*1080)
 if shape=='oval':
  return f'<ellipse cx="{X+W/2}" cy="{Y+H/2}" rx="{W/2}" ry="{H/2}" />'
 if shape=='arch':
  r=min(W/2,H*.44)
  return f'<path d="M{X} {Y+H}V{Y+r}H{X+W/2-r}A{r} {r} 0 0 1 {X+W/2+r} {Y+r}H{X+W}V{Y+H}Z" />'
 if shape=='paper':
  c=min(W,H)*.09
  return f'<path d="M{X+c} {Y}H{X+W-c}L{X+W} {Y+c}V{Y+H-c}L{X+W-c} {Y+H}H{X+c}L{X} {Y+H-c}V{Y+c}Z" />'
 return f'<rect x="{X}" y="{Y}" width="{W}" height="{H}" rx="{min(W,H)*.085:.1f}" />'
out=[]
for index,(id,name,concept,ratio,bg,ink,accent,shape,slots) in enumerate(S,1):
 W,H=600,1080
 # template photos must be completely transparent in overlay.
 holes=''.join(rounded_slot(*r,shape) for r in slots)
 title=html.escape(name.upper())
 title_y={'instant-camera':204,'graph-camera':221,'theater-ticket':139,'cinema-candy':186}.get(id,94)
 item=f'''<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}">
<defs><mask id="photo-holes" maskUnits="userSpaceOnUse"><rect width="{W}" height="{H}" fill="white"/><g fill="black">{holes}</g></mask></defs>
<g mask="url(#photo-holes)">
<rect width="{W}" height="{H}" fill="{bg}"/>
{overlay_art(id,W,H,ink,accent)}
<text x="{W/2}" y="{title_y}" font-size="30" font-family="Arial,sans-serif" font-weight="800" text-anchor="middle" fill="{ink}" letter-spacing="3">{title}</text>
<text x="{W/2}" y="{H-44}" font-size="22" font-family="Georgia,serif" font-style="italic" text-anchor="middle" fill="{ink}">BloomBooth · little memories</text>
</g>
<g fill="none" stroke="{accent}" stroke-width="8">{holes}</g>
</svg>'''
 (OUT/f'{id}.svg').write_text(item,encoding='utf8')
 out.append({'id':'pin-'+id,'label':name,'concept':concept,'pattern':'curated',
   'ratio':W/H,'bg':bg,'accent':accent,'ink':ink,'variation':index,
   'fixedCount':len(slots),'fixedSlots':[{'x':x,'y':y,'w':w,'h':h} for x,y,w,h in slots],
   'artwork':'frames/'+id+'.svg','frameShape':shape,
   'inspiredBy':'Pinterest reference #'+str(index).zfill(2)})
# include exactly per-template slot geometry, no generative color variants
js="'use strict';\nwindow.BloomCuratedFrames="+json.dumps(out,ensure_ascii=False,indent=2)+";\n"
(ROOT/'curated-frames.js').write_text(js,encoding='utf8')
print('Generated',len(out),'independent original SVG frames and curated catalog')
print('SVG size',sum(p.stat().st_size for p in OUT.glob('*.svg')))
