'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.join(__dirname,'..','mobile');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const css=fs.readFileSync(path.join(root,'studio.css'),'utf8');
for(const id of ['camera','preview','start','shoot','pick','nativeCamera','filterList','backgroundList','frameList','customBackground','customFrame','captionText','download','processing']){
  assert.ok(html.includes('id="'+id+'"'),'Missing '+id);
}
for(const tab of ['filters','backgrounds','frames'])assert.ok(html.includes('data-tab="'+tab+'"'),'Missing '+tab);
assert.ok(html.includes('studio.css'),'UI stylesheet missing');
assert.ok(html.includes('selfie_segmentation.js'),'Background AI not loaded');
assert.ok(css.includes('@media(max-width:440px)'),'Mobile breakpoint missing');
const map=new Map();
class MockElement{
  constructor(id=''){this.id=id;this.children=[];this.dataset={};this.style={};this.hidden=false;this.disabled=false;this.value='';this.className='';this.listeners={};this.attributes={};this.classList={toggle:()=>{},add:()=>{},remove:()=>{}};}
  replaceChildren(...c){this.children=c;}
  append(...c){this.children.push(...c);}
  appendChild(c){this.children.push(c);return c;}
  setAttribute(k,v){this.attributes[k]=v;}
  addEventListener(name,fn){this.listeners[name]=fn;}
  click(){this.listeners.click?.({target:this});}
}
function get(id){if(!map.has(id))map.set(id,new MockElement(id));return map.get(id);}
const tabs=['filters','backgrounds','frames'].map(s=>{const x=new MockElement();x.dataset.tab=s;return x;});
const panels=['filters','backgrounds','frames'].map(s=>{const x=new MockElement();x.dataset.panel=s;return x;});
const categories=['all','portrait','film','creative'].map(s=>{const x=new MockElement();x.dataset.category=s;return x;});
const doc={getElementById:get,createElement:()=>new MockElement(),querySelectorAll:s=>s==='.tab'?tabs:s==='.panel'?panels:s==='.category'?categories:[],body:{appendChild(){}}};
const win={isSecureContext:false,addEventListener(){}};
const context={window:win,document:doc,console,requestAnimationFrame:fn=>fn()};
vm.runInNewContext(fs.readFileSync(path.join(root,'filter-engine.js'),'utf8'),context);
vm.runInNewContext(fs.readFileSync(path.join(root,'studio.js'),'utf8'),context);
assert.equal(get('filterList').children.length,43,'Filter catalog');
assert.equal(get('backgroundList').children.length,11,'Background catalog');
assert.equal(get('frameList').children.length,11,'Frame catalog');
for(const tab of tabs){assert.equal(typeof tab.listeners.click,'function');tab.click();}
categories.find(c=>c.dataset.category==='film').click();
assert.ok(get('filterList').children.length>5,'Film category should show options');
assert.ok(get('filterList').children.length<43,'Film category should filter');
console.log('PASS: Mobile studio UI initialized; 43 filters, 11 backgrounds, 11 frames; responsive layout and tabs');
