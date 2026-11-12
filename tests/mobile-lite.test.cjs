'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.join(__dirname,'..','mobile');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const js=fs.readFileSync(path.join(root,'lite.js'),'utf8');
for(const id of ['camera','snapshot','empty','security','start','flip','shoot','retake','status','filters','download']){
  assert.ok(html.includes('id="'+id+'"'),'Missing UI: '+id);
}
for(const forbidden of ['data-tab=','id="backgroundList"','id="frameList"','id="pick"','id="nativeCamera"','id="customBackground"','selfie_segmentation.js','studio.js']){
  assert.equal(html.includes(forbidden),false,'Old UI leaked: '+forbidden);
}
const map=new Map();
class Mock {
  constructor(id=''){this.id=id;this.children=[];this.style={};this.dataset={};this.className='';this.disabled=false;this.hidden=false;this.listeners={};this.classList={toggle:()=>{},add:()=>{}};}
  appendChild(x){this.children.push(x);return x;}
  append(...x){this.children.push(...x);}
  replaceChildren(...x){this.children=x;}
  addEventListener(ev,fn){this.listeners[ev]=fn;}
  setAttribute(){}
}
const get=id=>{if(!map.has(id))map.set(id,new Mock(id));return map.get(id);};
const chips=['all','portrait','film','creative'].map(n=>{const x=new Mock();x.dataset.category=n;return x;});
const doc={getElementById:get,createElement:()=>new Mock(),querySelectorAll:q=>q==='.chip'?chips:[]};
const window={isSecureContext:false,addEventListener(){}};
const sandbox={document:doc,window,navigator:{mediaDevices:undefined},console};
vm.runInNewContext(fs.readFileSync(path.join(root,'filter-engine.js'),'utf8'),sandbox);
vm.runInNewContext(js,sandbox);
assert.equal(get('filters').children.length,43);
assert.equal(get('security').hidden,false,'HTTP should explain HTTPS requirement');
assert.equal(typeof get('start').listeners.click,'function');
assert.equal(typeof get('download').listeners.click,'function');
chips[2].listeners.click();
assert.ok(get('filters').children.length>5&&get('filters').children.length<43);
console.log('PASS: BloomBooth camera, 43 filters and download UI; no old background/frame tabs; HTTPS notice');
