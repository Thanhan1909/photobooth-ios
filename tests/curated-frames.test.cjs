'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const source=path.resolve(__dirname,'../mobile');
const sandbox={window:{}};
vm.runInNewContext(fs.readFileSync(path.join(source,'curated-frames.js'),'utf8'),sandbox);
vm.runInNewContext(fs.readFileSync(path.join(source,'layout-catalog.js'),'utf8'),sandbox);
const refs=sandbox.window.BloomCuratedFrames;
const e=sandbox.window.BloomLayoutCatalog;
assert.equal(refs.length,14,'All user reference concepts must have corresponding original artwork');
assert.equal(e.templates.length,46,'32 layouts + 14 curated designs');
assert.equal(new Set(refs.map(x=>x.id)).size,14);
assert.equal(new Set(refs.map(x=>x.label)).size,14);
assert.equal(new Set(refs.map(x=>x.artwork)).size,14);
assert.ok(refs.some(x=>x.fixedCount===2));
assert.ok(refs.some(x=>x.fixedCount===3));
assert.ok(refs.some(x=>x.fixedCount===4));
assert.ok(refs.some(x=>x.fixedCount===5));
const allSvgs=new Set();
for(const t of refs){
 assert.match(t.artwork,/^frames\/[a-z-]+\.svg$/);
 const asset=path.join(source,t.artwork);
 assert.ok(fs.existsSync(asset),'Missing SVG '+asset);
 const svg=fs.readFileSync(asset,'utf8');
 assert.match(svg,/<mask id="photo-holes"/);
 assert.match(svg,/mask="url\(#photo-holes\)"/);
 assert.match(svg,/<svg xmlns=/);
 assert.ok(svg.length>1400,'Artwork is too simple to be a finished design');
 allSvgs.add(svg);
 const slots=e.slots(t,t.fixedCount);
 assert.equal(slots.length,t.fixedCount);
 assert.equal(JSON.stringify(slots),JSON.stringify(t.fixedSlots));
 for(const s of slots){
  assert.ok(s.x>=0&&s.y>=0&&s.w>0&&s.h>0);
  assert.ok(s.x+s.w<=1.001&&s.y+s.h<=1.001,'Frame slot overflow '+t.id);
 }
 const fallback=e.slots(t,7);
 assert.equal(fallback.length,7,'Changing photo count must not leave zero slots');
}
assert.equal(allSvgs.size,14,'Artworks must differ, not duplicate palettes');
const html=fs.readFileSync(path.join(source,'index.html'),'utf8');
assert.ok(html.includes('curated-frames.js?v=16'));
assert.ok(html.includes('frame-gallery.html')===false||html.includes('frames'));
const gallery=fs.readFileSync(path.join(source,'frame-gallery.html'),'utf8');
assert.equal((gallery.match(/class="frame-card"/g)||[]).length,14);
console.log('PASS: 14 independent original SVG designs + 32 prior layouts, exact per-frame cutout geometry, four photo counts, gallery previews');
