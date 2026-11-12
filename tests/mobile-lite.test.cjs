'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.join(__dirname,'..','mobile');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
for(const id of ['camera','snapshot','frameOverlay','empty','security','start','flip','shoot','retake','status','filters','frames','filterTab','frameTab','download']){
  assert.ok(html.includes('id="'+id+'"'),'Missing '+id);
}
for(const forbidden of ['backgroundList','customBackground','selfie_segmentation.js','studio.js','nativeCamera']){
  assert.ok(!html.includes(forbidden),'Unexpected legacy UI '+forbidden);
}
class Mock {
  constructor(id=''){this.id=id;this.children=[];this.style={};this.dataset={};this.className='';this.disabled=false;this.hidden=false;this.listeners={};this.classList={toggle:()=>{},add:()=>{}};this.width=144;this.height=180;}
  appendChild(x){this.children.push(x);return x;}
  append(...x){this.children.push(...x);}
  replaceChildren(...x){this.children=x;}
  addEventListener(ev,fn){this.listeners[ev]=fn;}
  setAttribute(){}
  getContext(){return {drawImage(){},beginPath(){},ellipse(){},arc(){},fill(){},fillRect(){},clearRect(){},strokeRect(){},fillText(){},save(){},restore(){},createLinearGradient(){return {addColorStop(){}};}};}
  toDataURL(){return 'data:image/jpeg;base64,/9j/';}
}
const map=new Map();const get=id=>{if(!map.has(id))map.set(id,new Mock(id));return map.get(id);};
const chips=['all','portrait','film','creative'].map(n=>{const x=new Mock();x.dataset.category=n;return x;});
const tabs=['filter','frame'].map(n=>{const x=new Mock();x.dataset.editor=n;return x;});
const doc={getElementById:get,createElement:()=>new Mock(),querySelectorAll:q=>q==='.chip'?chips:q==='.editor-tab'?tabs:[]};
const window={isSecureContext:false,addEventListener(){}};
const sandbox={document:doc,window,navigator:{mediaDevices:undefined},console};
vm.runInNewContext(fs.readFileSync(path.join(root,'filter-engine.js'),'utf8'),sandbox);
vm.runInNewContext(fs.readFileSync(path.join(root,'frame-engine.js'),'utf8'),sandbox);
vm.runInNewContext(fs.readFileSync(path.join(root,'lite.js'),'utf8'),sandbox);
assert.equal(get('filters').children.length,43);
assert.equal(get('frames').children.length,10);
assert.equal(get('security').hidden,false);
assert.equal(typeof get('start').listeners.click,'function');
assert.equal(typeof get('download').listeners.click,'function');
tabs[1].listeners.click();
assert.equal(get('filterPanel').hidden,true);
assert.equal(get('framePanel').hidden,false);
chips[2].listeners.click();
assert.ok(get('filters').children.length>5&&get('filters').children.length<43);
const frameEngine=window.BloomFrames;let count=0;
const ctx={beginPath(){},ellipse(){},arc(){},fill(){count++;},strokeRect(){count++;},fillRect(){count++;},fillText(){count++;},save(){},restore(){},translate(){},rotate(){}};
for(const frame of frameEngine.frames)frameEngine.draw(ctx,400,500,frame.id);
assert.ok(count>0);
console.log('PASS: 43 color filters, 10 frame previews, frame rendering, HTTPS message, tabs and simplified UI');
