'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.join(__dirname,'..','mobile');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
for(const id of ['modeOptions','layoutOptions','manualPosition','sizeControl','slotSize','shotSlots','filters','frames','download','snapshot','camera']){
  assert.ok(html.includes('id="'+id+'"'),'Missing studio control '+id);
}
assert.ok(!html.includes('backgroundList'),'Background editing should stay absent');
const window={};
vm.runInNewContext(fs.readFileSync(path.join(root,'frame-art.js'),'utf8'),{window});
vm.runInNewContext(fs.readFileSync(path.join(root,'studio-engine.js'),'utf8'),{window});
const e=window.BloomStudio;
assert.equal(e.frames.length,41,'Expected original + 40 distinct artwork frames');
assert.equal(new Set(e.frames.map(f=>f.id)).size,41);
assert.equal(new Set(e.frames.map(f=>f.motif)).size,41,'Every design must have its own motif');
assert.ok(e.frames.some(f=>f.motif==='duckling')&&e.frames.some(f=>f.motif==='cassette'));
assert.equal(e.layouts.length,4);
for(const count of [1,3,5]){
  const {w,h}=e.dimensions(count);
  assert.equal(w,1200);
  for(const layout of e.layouts){
    const rects=e.cloneRects(count,layout.id);
    assert.equal(rects.length,count);
    for(const r of rects){
      assert.ok(r.x>=0&&r.y>=0&&r.x+r.w<=1.0001&&r.y+r.h<=1.0001,layout.id+' '+count);
      assert.ok(r.w>0&&r.h>0);
    }
    assert.ok(h>=1600);
  }
}
const testRect={x:.2,y:.2,w:.3,h:.3};
assert.equal(e.hit([testRect],.3,.3),0);
assert.equal(e.hit([testRect],.8,.8),-1);
const moved=e.constrain({x:.91,y:.91,w:.3,h:.25});
assert.ok(moved.x+moved.w<=.976&&moved.y+moved.h<=.911);
let marks=0;
const ctx={fillRect(){marks++;},strokeRect(){marks++;},fillText(){marks++;},
  drawImage(){marks++;},beginPath(){},rect(){},clip(){},save(){},restore(){},
  setLineDash(){},ellipse(){},arc(){},fill(){},stroke(){marks++;},closePath(){},moveTo(){},lineTo(){},quadraticCurveTo(){},createLinearGradient(){return{addColorStop(){}};}};
for(const count of [1,3,5]){
  for(const frame of e.frames){
    const canvas={width:e.dimensions(count).w,height:e.dimensions(count).h,getContext(){return ctx;}};
    e.render(canvas,{count,layout:'grid',shots:Array.from({length:count},()=>({width:640,height:480})),frame:frame.id,preFiltered:true});
  }
}
assert.ok(marks>1000,'Expected full compositions');
console.log('PASS: 40 individually drawn frames + original, 1/3/5 modes, 4 layouts, render/export geometry');
