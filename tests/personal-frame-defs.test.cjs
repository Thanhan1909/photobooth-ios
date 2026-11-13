'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const sandbox={window:{}};
vm.runInNewContext(fs.readFileSync(path.join(root,'mobile','personal-frame-defs.js'),'utf8'),sandbox);
const defs=sandbox.window.BloomPersonalFrameDefs;
assert.equal(defs.length,14);
assert.equal(new Set(defs.map(d=>d.number)).size,14);
for(const def of defs){
 assert.ok(def.slots.length>=1&&def.slots.length<=10,'Incorrect count for '+def.number);
 for(const [index,r] of def.slots.entries()){
  assert.ok([r.x,r.y,r.w,r.h].every(Number.isFinite));
  assert.ok(r.x>=0&&r.y>=0&&r.w>.05&&r.h>.05&&r.x+r.w<=1.001&&r.y+r.h<=1.001,
    'Slot overflow reference '+def.number+' window '+index);
 }
}
const importer=fs.readFileSync(path.join(root,'mobile','personal-frame-import.js'),'utf8');
assert.ok(importer.includes('indexedDB')===false); // persisted through library abstraction
assert.ok(importer.includes('library.save('));
assert.ok(importer.includes('photoReplace:true'));
assert.ok(importer.includes('installLocalPack'));
assert.ok(importer.includes('importFiles'));
const editor=fs.readFileSync(path.join(root,'mobile','editor-v4.js'),'utf8');
assert.ok(editor.includes('state.photoReplace'));
assert.ok(editor.includes('editorLoadLocalPinterest'));
assert.ok(editor.includes('editorLoadPinterestFiles'));
const html=fs.readFileSync(path.join(root,'mobile','index.html'),'utf8');
assert.ok(html.includes('personal-frame-defs.js'));
assert.ok(html.includes('personal-frame-import.js'));
assert.ok(html.includes('editorAutoSave'));
assert.ok(html.includes('editorLoadLocalPinterest'));
assert.ok(html.includes('editorLoadPinterestFiles'));
const gitignore=fs.readFileSync(path.join(root,'.gitignore'),'utf8');
assert.ok(gitignore.includes('/mobile/private-frames/'));
console.log('PASS: 14 private reference layouts, valid camera slots, independent personal import and photo-replacement mode; original JPEGs excluded from public source');
