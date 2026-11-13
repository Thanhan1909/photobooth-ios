import json,html
from pathlib import Path
root=Path(r'E:\PhotoBooth\photobooth-ios\mobile')
s=(root/'curated-frames.js').read_text(encoding='utf8').strip()
frames=json.loads(s[s.index('=')+1:].rstrip(';'))
cards=[]
colors=['#f4cbb8','#e7bdcc','#bdd8e8','#d6d1fa','#f0d7a0','#b4d5c7']
for i,t in enumerate(frames):
 styles=[]
 for j,r in enumerate(t['fixedSlots']):
  color=colors[(j+i)%len(colors)]
  styles.append(f'<div class="photo-slot" style="left:{r["x"]*100:.2f}%;top:{r["y"]*100:.2f}%;width:{r["w"]*100:.2f}%;height:{r["h"]*100:.2f}%;background:linear-gradient(130deg,{color},#fcf9f6)"><div class="portrait"><div class="head"></div><div class="body"></div></div></div>')
 cards.append(f'<article class="frame-card"><div class="frame-canvas">{"".join(styles)}<img loading="lazy" src="{html.escape(t["artwork"])}" alt="Xem trước khung {html.escape(t["label"])}"></div><div class="frame-desc"><strong>{i+1:02d}. {html.escape(t["label"])}</strong><span>{t["fixedCount"]} ô ảnh · Thiết kế nguyên bản</span></div></article>')
page=f"""<!doctype html><html lang="vi"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>BloomBooth | 14 mẫu khung mới</title><meta name="theme-color" content="#fdf1f4">
<style>
*{{box-sizing:border-box}}body{{margin:0;background:#fff8f9;color:#553f4c;font:14px/1.45 system-ui,Arial,sans-serif}}
header{{max-width:1450px;margin:0 auto;padding:30px 24px 8px}}
h1{{font-size:26px;margin:0 0 7px}}p{{color:#8a737c;margin:0 0 13px}}
nav{{display:flex;gap:12px;flex-wrap:wrap;margin:17px 0}}
a{{color:#a04c6d}}.gallery{{max-width:1450px;padding:12px 20px 40px;margin:0 auto;display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:14px}}
.frame-card{{border-radius:14px;background:white;border:1px solid #f0d9e1;overflow:hidden;box-shadow:0 6px 20px #c9a0b017}}
.frame-canvas{{width:100%;position:relative;aspect-ratio:600/1080;background:#f4edee;overflow:hidden}}
.frame-canvas>img{{position:absolute;inset:0;width:100%;height:100%;object-fit:fill;pointer-events:none}}
.photo-slot{{position:absolute;display:grid;place-items:center;overflow:hidden;border-radius:5px}}
.portrait{{position:relative;width:72%;height:86%;display:grid;place-items:center;top:12%}}
.head{{position:absolute;top:6%;width:46%;height:40%;border-radius:50%;background:#f6dbcb;border:2px solid #c89d9a}}
.body{{position:absolute;bottom:0;width:88%;height:48%;background:#f9f7fc;border-radius:50% 50% 0 0}}
.frame-desc{{padding:11px;display:flex;flex-direction:column;gap:3px}}
.frame-desc strong{{font-size:12px}}.frame-desc span{{font-size:10px;color:#9b8591}}
@media(max-width:1000px){{.gallery{{grid-template-columns:repeat(4,minmax(0,1fr))}}}}
@media(max-width:600px){{header{{padding:20px 14px}}h1{{font-size:20px}}.gallery{{padding:8px;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}}}}
</style></head><body><header><h1>BloomBooth — 14 mẫu khung mới</h1>
<p>Thiết kế vector gốc lấy cảm hứng từ 14 chủ đề Pinterest bạn cung cấp. Đây không phải ảnh hoặc artwork Pinterest sao chép.</p>
<nav><a href="./">Mở BloomBooth</a><a href="https://github.com/Thanhan1909/photobooth-ios">Source & CI/CD</a></nav></header>
<main class="gallery">{''.join(cards)}</main></body></html>"""
(root/'frame-gallery.html').write_text(page,encoding='utf8')
print('Created',root/'frame-gallery.html','14 designs')
