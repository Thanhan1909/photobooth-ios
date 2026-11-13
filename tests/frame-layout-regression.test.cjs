'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.join(__dirname,'..','mobile'),window={};
const sandbox={window,document:{createElement(){return {width:0,height:0};}}};
vm.runInNewContext(fs.readFileSync(path.join(root,'frame-art.js'),'utf8'),sandbox);
vm.runInNewContext(fs.readFileSync(path.join(root,'studio-engine.js'),'utf8'),sandbox);
const studio=window.BloomStudio;
function collect(frame){
  const labels=[];
  const ctx={fillRect(){},strokeRect(){},drawImage(){},beginPath(){},rect(){},clip(){},
    save(){},restore(){},setLineDash(){},ellipse(){},arc(){},fill(){},stroke(){},
    closePath(){},moveTo(){},lineTo(){},quadraticCurveTo(){},
    fillText(value,x,y){labels.push({text:String(value),y});},
    createLinearGradient(){return{addColorStop(){}};}};
  studio.render({width:1200,height:1600,getContext(){return ctx;}},{
    count:1,layout:'vertical',shots:[{width:1200,height:1500}],
    frame,preFiltered:true,preview:false});
  return labels;
}
const duck=collect('duckling');
assert.equal(duck.filter(x=>x.text==='QUACK!').length,1);
assert.equal(duck.filter(x=>x.text==='QUACK QUACK').length,0,
  'The generic title must not overlay the artwork title');
assert.equal(duck.filter(x=>x.text==='BLOOM BOOTH STUDIO').length,0,
  'A second subtitle must not overlay the frame artwork');
assert.equal(duck.filter(x=>x.text==='One lovely moment').length,0,
  'Generic footer must not overlay themed footer');
assert.equal(duck.filter(x=>x.text==='little sunshine').length,1);
const cassette=collect('cassette');
assert.equal(cassette.filter(x=>x.text==='SIDE A · 90 MIN').length,1);
assert.equal(cassette.filter(x=>x.text==='One lovely moment').length,0);
const plain=collect('plain');
assert.equal(plain.filter(x=>x.text==='BLOOM BOOTH').length,1);
assert.equal(plain.filter(x=>x.text==='One lovely moment').length,1);
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
assert.ok(html.includes('activeFrameCanvas'));
assert.ok(html.includes('activeFrameName'));
assert.ok(html.includes('studio-engine.js?v=12'));
assert.ok(html.includes('lite.js?v=12'));
assert.ok(html.includes('selection-engine.js?v=11'));
console.log('PASS: themed artwork uses one header/footer; plain frame keeps labels; live frame preview included');
