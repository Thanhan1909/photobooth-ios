'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.join(__dirname,'..','mobile');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
for(const id of ['camera','snapshot','shotCounter','resetStrip','security','start','flip','shoot','retake','filters','frames','download']){
  assert.ok(html.includes('id="'+id+'"'),'Missing '+id);
}
assert.ok(html.includes('strip-engine.js'),'Strip engine must be loaded');
assert.ok(!html.includes('backgroundList'),'Background UI must be absent');
const window={};
vm.runInNewContext(fs.readFileSync(path.join(root,'strip-engine.js'),'utf8'),{window,document:{createElement(){return {width:0,height:0};}}});
const {layout,draw,fit,COUNT}=window.BloomStrip;
assert.equal(COUNT,3);
const geometry=layout(1200,3000);
assert.equal(geometry.rects.length,3);
for(let i=0;i<3;i++){
  const r=geometry.rects[i];
  assert.ok(r.x>=0&&r.y>=0&&r.x+r.w<=1200&&r.y+r.h<=3000,'Slot within canvas');
  if(i>0)assert.ok(r.y>=geometry.rects[i-1].y+geometry.rects[i-1].h,'Slots must not overlap');
}
let count=0,sourceCoords;
const context={
  save(){},restore(){},beginPath(){},rect(){},clip(){},
  fillRect(){count++;},strokeRect(){},fillText(){},drawImage(src,...args){sourceCoords=args;count++;},
  createLinearGradient(){return{addColorStop(){}};},
};
const canvas={width:1200,height:3000,getContext(){return context;}};
const filterEngine={apply(out,src){out.width=src.width;out.height=src.height;}};
const image={width:1920,height:1080};
draw(canvas,[image,image,image],{id:'none'},'polaroid',filterEngine);
assert.ok(count>7,'Expected three photos and strip decorations');
assert.equal(sourceCoords.length,4,'Final photo must use contain/full-image coordinates');
assert.equal(typeof fit,'function');
console.log('PASS: 3-shot strip layout, source aspect preservation and 1200x3000 export canvas');
