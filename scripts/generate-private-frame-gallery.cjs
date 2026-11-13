'use strict';
/** Generates an E:-local-only preview page from user-owned reference files.
 * Private JPEGs are deliberately ignored by Git and never bundled into IPA/PWA.
 */
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const repo=path.resolve(__dirname,'..');
const directory=path.join(repo,'mobile','private-frames');
const sandbox={window:{}};
vm.runInNewContext(fs.readFileSync(path.join(repo,'mobile','personal-frame-defs.js'),'utf8'),sandbox);
const templates=sandbox.window.BloomPersonalFrameDefs;
fs.mkdirSync(directory,{recursive:true});
function escape(text){return String(text).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
const cards=templates.map(frame=>{
 const number=String(frame.number).padStart(2,'0'),file='ref_'+number+'.jpg';
 const rectangles=frame.slots.map((rect,i)=>'<div class="window" style="left:'+
  (rect.x*100).toFixed(2)+'%;top:'+(rect.y*100).toFixed(2)+'%;width:'+
  (rect.w*100).toFixed(2)+'%;height:'+(rect.h*100).toFixed(2)+
  '%">'+String(i+1)+'</div>').join('');
 return '<article><div class="art"><img src="'+file+'" alt="'+escape(frame.name)+'">'+rectangles+
  '</div><h2>'+number+'. '+escape(frame.name)+'</h2><p>'+frame.slots.length+
  ' ô chụp • Giữ nguyên JPG mẫu</p></article>';
}).join('\n');
const html=`<!doctype html><html lang="vi"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>BloomBooth • 14 khung JPG cá nhân</title>
<style>*{box-sizing:border-box}body{margin:0;background:#fff6f9;font:14px/1.5 system-ui,Arial,sans-serif;color:#67495b}
header{max-width:1520px;margin:auto;padding:28px 24px 10px}h1{font-size:27px;margin:0 0 8px}
header p{margin:0;color:#92788a}a{color:#b34e7a}
main{max-width:1520px;margin:auto;padding:18px;display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:13px}
article{background:white;border:1px solid #edd9e4;padding:8px;border-radius:12px;overflow:hidden}
.art{position:relative;width:100%;aspect-ratio:736/1200;overflow:hidden;background:#f7f4f4}
.art>img{width:100%;height:100%;object-fit:fill}
.window{position:absolute;border:2px dashed #ed2973;background:#f43e7126;box-shadow:0 0 0 1px #fff7;
 color:white;text-shadow:0 1px 4px #a13f6a;font-size:12px;font-weight:900;display:grid;place-items:center}
h2{font-size:12px;margin:8px 0 2px}article p{font-size:11px;color:#a28391;margin:0}
@media(max-width:1100px){main{grid-template-columns:repeat(4,minmax(0,1fr))}}
@media(max-width:640px){main{grid-template-columns:repeat(2,minmax(0,1fr));gap:7px;padding:8px}header{padding:18px 12px}h1{font-size:19px}}
</style></head><body>
<header><h1>14 khung Pinterest JPG cá nhân • Vùng camera được đánh dấu</h1>
<p>Chính ảnh gốc bạn chọn, không vẽ lại. Đường nét màu hồng biểu thị nơi camera sẽ thay ảnh. Các đường chỉ để kiểm tra, không xuất vào ảnh đã lưu.</p>
<p><a href="../">Mở BloomBooth → Chỉnh sửa → Nạp 14 mẫu từ ổ E</a></p></header>
<main>${cards}</main></body></html>`;
fs.writeFileSync(path.join(directory,'gallery.html'),html);
console.log('Generated private local gallery with',templates.length,'images:',path.join(directory,'gallery.html'));
