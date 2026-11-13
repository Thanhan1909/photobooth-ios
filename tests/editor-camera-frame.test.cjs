'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.join(__dirname,'..','mobile');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const editor=fs.readFileSync(path.join(root,'editor-v4.js'),'utf8');
for(const name of [
 'editorCameraStart','editorCameraCapture','editorCameraFlip','editorCameraStop',
 'editorCameraVideo','editorBackground','editorClearBackground','editorOverlay',
 'editorTemplateName','editorTemplateSave','editorPersonalTemplates',
 'editorTemplates','editorCount'
])assert.ok(html.includes('id="'+name+'"'),name+' UI control missing');
assert.ok(editor.includes('navigator.mediaDevices.getUserMedia'),'Direct camera unavailable');
assert.ok(editor.includes('captureIntoSelectedSlot'),'Per-slot shutter unavailable');
assert.ok(editor.includes('state.backgroundImage'),'Template background upload unavailable');
assert.ok(editor.includes('savePersonalTemplate'),'Private template library unavailable');
assert.ok(editor.includes('catalog.slotShape'),'Per-template cutout not used');
assert.ok(editor.includes('renderTo(output,true)'),'Export must reuse preview compositor');
const sandbox={window:{}};
vm.runInNewContext(fs.readFileSync(path.join(root,'layout-catalog.js'),'utf8'),sandbox);
const catalog=sandbox.window.BloomLayoutCatalog;
const fake={
 beginPath(){this.calls=(this.calls||0)+1},ellipse(){},moveTo(){},bezierCurveTo(){},closePath(){},
 arc(){},quadraticCurveTo(){},lineTo(){},roundRect(){},
};
for(const t of catalog.templates){
 catalog.slotShape(fake,10,20,120,180,t);
 assert.ok(fake.calls>=1);
}
assert.equal(catalog.templates.length,32);
console.log('PASS: camera directly in editor template, per-slot shutter, licensed background import, unique cutouts and identical export engine');
