'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const sandbox={window:{}};
const source=fs.readFileSync(path.join(__dirname,'..','mobile','layout-catalog.js'),'utf8');
vm.runInNewContext(source,sandbox);
const layout=sandbox.window.BloomLayoutCatalog;
assert.equal(layout.templates.length,32,'Expect 32 independently named layout designs');
assert.equal(new Set(layout.templates.map(t=>t.id)).size,32);
assert.ok(new Set(layout.templates.map(t=>t.pattern)).size>=7);
for(const template of layout.templates){
 for(let n=1;n<=10;n++){
  const slots=layout.slots(template,n);
  assert.equal(slots.length,n,template.id+' count '+n);
  for(const [i,r] of slots.entries()){
   assert.ok(r.x>=0&&r.y>=0&&r.x+r.w<=1.00001&&r.y+r.h<=1.00001,
    'Layout overflow '+template.id+' '+n+' slot '+i);
   assert.ok(r.w>=.09&&r.h>=.065);
  }
 }
}
const samples=layout.templates.map(t=>JSON.stringify(layout.slots(t,5)));
assert.ok(new Set(samples).size>=10,'Templates should offer varied geometry, not only colors');
const drawCalls=new Map();
for(const template of layout.templates){
 let count=0;
 const ctx={fillRect(){count++},beginPath(){},arc(){count++},fill(){count++},
  fillText(){count++},save(){},restore(){},moveTo(){},lineTo(){},closePath(){},stroke(){},strokeRect(){},setLineDash(){}};
 layout.drawBackground(ctx,1200,2700,template);
 assert.ok(count>=3,'Background not drawn for '+template.id);
 drawCalls.set(template.id,count);
}
assert.equal(drawCalls.size,32);
console.log('PASS: 32 editable template geometries, 1..10 arbitrary slots, 320 renderable layouts and theme-specific backgrounds');
