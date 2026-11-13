'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const output=path.resolve(__dirname,'../dist/iphone');
const html=fs.readFileSync(path.join(output,'index.html'),'utf8');
const manifest=JSON.parse(fs.readFileSync(path.join(output,'manifest.webmanifest'),'utf8'));
const serviceWorker=fs.readFileSync(path.join(output,'sw.js'),'utf8');
for(const src of [
 'filter-engine.js','studio-engine.js','frame-art.js','selection-engine.js','layout-catalog.js','template-library.js','editor-v4.js','lite.js','lite.css',
 'pwa.js','sw.js','manifest.webmanifest',
 'icons/icon-180.png','icons/icon-192.png','icons/icon-512.png'
]){
 assert.ok(fs.existsSync(path.join(output,src)),'Missing '+src);
}
assert.equal(manifest.display,'standalone');
assert.equal(manifest.start_url,'./');
assert.equal(manifest.scope,'./');
assert.ok(manifest.icons.some(icon=>icon.sizes==='512x512'));
assert.ok(html.includes('apple-touch-icon'));
assert.ok(html.includes('pwa.js'));
assert.ok(html.includes('./studio-engine.js'));
assert.ok(html.includes('./lite.js'));
assert.ok(!html.includes('src="/mobile/')&&!html.includes('href="/mobile/'));
assert.ok(!html.includes('http://192.168.')&&!html.includes('localhost:8085'));
assert.ok(serviceWorker.includes('caches.open(CACHE)'));
assert.ok(serviceWorker.includes('cache.addAll(ASSETS)'));
assert.ok(serviceWorker.includes('self.addEventListener(\'fetch\''));
assert.ok(serviceWorker.includes('self.clients.claim()'));
assert.ok(!fs.existsSync(path.join(output,'private')));
assert.ok(!fs.existsSync(path.join(output,'config')));
for(const size of [180,192,512]){
 const png=fs.readFileSync(path.join(output,'icons',`icon-${size}.png`));
 assert.equal(png.toString('hex',0,8),'89504e470d0a1a0a');
 assert.equal(png.readUInt32BE(16),size);
 assert.equal(png.readUInt32BE(20),size);
}
console.log('PASS: iPhone PWA static build, HTTPS-relative assets, manifest/icons, offline pre-cache and no private files');
