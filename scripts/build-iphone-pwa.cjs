'use strict';
/**
 * Creates an isolated, backend-free BloomBooth distribution for GitHub Pages.
 * Do not include credentials, local TLS keys, Docker mounts or user photos.
 */
const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
const {execFileSync}=require('node:child_process');
const root=path.resolve(__dirname,'..');
const source=path.join(root,'mobile');
const output=path.join(root,'dist','iphone');
const files=[
  'filter-engine.js','frame-art.js','studio-engine.js',
  'selection-engine.js','curated-frames.js','layout-catalog.js','template-library.js','personal-frame-defs.js','personal-frame-import.js','personal-frame-ui.js','editor-v4.js','lite.js','lite.css'
];
const assets=['./','./index.html','./manifest.webmanifest',
  ...files.map(f=>'./'+f),
  ...fs.readdirSync(path.join(source,'frames')).filter(f=>f.endsWith('.svg')).map(f=>'./frames/'+f),
  './frame-gallery.html',
  './vendor/fflate.min.js',
  './icons/icon-180.png','./icons/icon-192.png','./icons/icon-512.png'];
fs.rmSync(output,{recursive:true,force:true});
fs.mkdirSync(path.join(output,'icons'),{recursive:true});
for(const name of files)fs.copyFileSync(path.join(source,name),path.join(output,name));
fs.cpSync(path.join(source,'frames'),path.join(output,'frames'),{recursive:true});
fs.mkdirSync(path.join(output,'vendor'),{recursive:true});
fs.copyFileSync(path.join(source,'vendor','fflate.min.js'),path.join(output,'vendor','fflate.min.js'));
if(fs.existsSync(path.join(source,'frame-gallery.html'))){
  fs.copyFileSync(path.join(source,'frame-gallery.html'),path.join(output,'frame-gallery.html'));
}
let html=fs.readFileSync(path.join(source,'index.html'),'utf8');
html=html.replace(/(["'])\/mobile\/([^"']+)/g,(_m,q,p)=>q+'./'+p);
html=html.replace(/<title>(.*?)<\/title>/,'<title>BloomBooth — iPhone Photo Studio</title>');
assert.ok(html.includes('./lite.js'),'Relative path missing from PWA');
assert.ok(!html.includes('src="/mobile/')&&!html.includes('href="/mobile/'),'Absolute assets break GitHub Pages subpaths');
const buildVersion=process.env.GITHUB_SHA?.slice(0,12)||execFileSync('git',['rev-parse','--short=12','HEAD'],{cwd:root,encoding:'utf8'}).trim();
const head= [
  '<link rel="manifest" href="./manifest.webmanifest">',
  '<link rel="apple-touch-icon" sizes="180x180" href="./icons/icon-180.png">',
  '<link rel="icon" type="image/png" sizes="192x192" href="./icons/icon-192.png">',
  '<meta name="apple-mobile-web-app-capable" content="yes">',
  '<meta name="apple-mobile-web-app-status-bar-style" content="default">',
  '<meta name="apple-mobile-web-app-title" content="BloomBooth">',
  '<meta name="application-name" content="BloomBooth">',
  '<meta name="color-scheme" content="light">'
].join('\n');
html=html.replace('</head>',head+'\n</head>');
// Do not depend on a network server for camera processing.
const installInfo='<section class="pwa-install-note" aria-label="Cài BloomBooth"><span id="pwaStatus">Chụp ảnh ngay trên iPhone · không cần VPS</span><button id="installHelp" type="button">Cài lên Màn hình chính</button></section>';
html=html.replace('<main class="wrap">',installInfo+'\n<main class="wrap">');
html=html.replace('</body>','<script src="./pwa.js" defer></script>\n</body>');
fs.writeFileSync(path.join(output,'index.html'),html);
const manifest={
  name:'BloomBooth — Photo Studio',
  short_name:'BloomBooth',
  description:'Photo booth riêng trên iPhone: chụp 1/3/5 ảnh, filter, khung, bố cục và tải ảnh.',
  start_url:'./',
  scope:'./',
  display:'standalone',
  orientation:'any',
  background_color:'#fff8f2',
  theme_color:'#fff8f2',
  lang:'vi',
  categories:['photography','entertainment'],
  icons:[
    {src:'./icons/icon-192.png',sizes:'192x192',type:'image/png',purpose:'any maskable'},
    {src:'./icons/icon-512.png',sizes:'512x512',type:'image/png',purpose:'any maskable'}
  ]
};
fs.writeFileSync(path.join(output,'manifest.webmanifest'),JSON.stringify(manifest,null,2));
const worker=`'use strict';
const CACHE='bloombooth-${buildVersion}';
const ASSETS=${JSON.stringify(assets)};
self.addEventListener('install',event=>{
  event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS)).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',event=>{
  event.waitUntil(Promise.all([
    caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('bloombooth-')&&k!==CACHE).map(k=>caches.delete(k)))),
    self.clients.claim()
  ]));
});
self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET')return;
  const url=new URL(event.request.url);
  // Cache only same-origin, in-scope static application assets.
  if(url.origin!==self.location.origin||!url.pathname.startsWith(new URL(self.registration.scope).pathname))return;
  event.respondWith(
    caches.match(event.request,{ignoreSearch:true}).then(cached=>cached||fetch(event.request).then(response=>{
      if(response.ok&&response.type==='basic'){
        const copy=response.clone();
        event.waitUntil(caches.open(CACHE).then(cache=>cache.put(event.request,copy)));
      }
      return response;
    }).catch(()=>caches.match('./index.html')))
  );
});
`;
fs.writeFileSync(path.join(output,'sw.js'),worker);
const pwaJs=`'use strict';
(() => {
  const label=document.getElementById('pwaStatus');
  const help=document.getElementById('installHelp');
  const ios=/iPhone|iPad|iPod/i.test(navigator.userAgent)||
    (navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
  const standalone=window.matchMedia('(display-mode: standalone)').matches||navigator.standalone===true;
  const update=()=>{
    if(!label)return;
    label.textContent=standalone
      ?'BloomBooth đã mở như ứng dụng trên iPhone'
      :navigator.onLine?'Chụp ảnh ngay trên iPhone · không cần VPS':
        'Đang offline · ảnh xử lý trên iPhone';
  };
  update();
  window.addEventListener('online',update);window.addEventListener('offline',update);
  help?.addEventListener('click',()=>{
    const msg=standalone?'BloomBooth đã được thêm vào Màn hình chính.':
      ios?'Trong Safari: Nhấn Chia sẻ → Thêm vào Màn hình chính → bật Mở dưới dạng ứng dụng web → Thêm.':
      'Mở trang trên Safari iPhone, sau đó chọn Chia sẻ → Thêm vào Màn hình chính.';
    window.alert(msg);
  });
  if('serviceWorker' in navigator){
    window.addEventListener('load',()=>{
      navigator.serviceWorker.register('./sw.js',{scope:'./'}).catch(error=>{
        console.warn('BloomBooth offline cache not available:',error);
      });
    });
  }
})();
`;
fs.writeFileSync(path.join(output,'pwa.js'),pwaJs);
fs.appendFileSync(path.join(output,'lite.css'),`
.pwa-install-note{display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;
  background:#fff0ed;color:#875b65;padding:12px 22px;border-bottom:1px solid #f1d6d2;font-size:12px}
.pwa-install-note button{background:#ffffff;border:1px solid #dba49d;border-radius:10px;
  padding:9px 12px;color:#ae6a64;font:inherit;font-weight:750;cursor:pointer}
@media(max-width:500px){.pwa-install-note{justify-content:center;text-align:center;padding:9px;font-size:11px}}
`);
const python=path.join(__dirname,'generate-pwa-icons.py');
execFileSync(process.platform==='win32'?'py':'python3',
  process.platform==='win32'?['-3',python,output]:[python,output],{stdio:'inherit'});
fs.writeFileSync(path.join(output,'.nojekyll'),'');
const published=fs.readdirSync(output);
assert.ok(published.includes('sw.js')&&published.includes('index.html'));
assert.ok(!published.includes('config')&&!published.includes('private'));
console.log('PWA build OK:',buildVersion,output);
console.log('Assets:',published.join(', '));
