'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const source = fs.readFileSync(path.join(__dirname, '..', 'mobile', 'filter-engine.js'), 'utf8');
const environment = {window: {}};
vm.runInNewContext(source, environment);
const {presets, apply} = environment.window.PhotoboothFilters;
assert.ok(presets.length >= 40, 'Expected 40+ filters');
const ids = presets.map(x=>x.id);
assert.equal(ids.length, new Set(ids).size, 'Unique filter IDs');
function makeCanvas(w=20,h=20) {
  const p=new Uint8ClampedArray(w*h*4);
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){
    const k=(y*w+x)*4;p[k]=40+x*7;p[k+1]=60+y*7;p[k+2]=120+x*3;p[k+3]=255;
  }
  const context={
    drawImage(src){ this.buffer=new Uint8ClampedArray(src.pixels); },
    getImageData(){return {width:w,height:h,data:new Uint8ClampedArray(this.buffer)};},
    putImageData(img){this.buffer=new Uint8ClampedArray(img.data);},
    createRadialGradient(){return {addColorStop(){}};},
    fillRect(){},
    set fillStyle(x){this._fill=x;},
    get fillStyle(){return this._fill;}
  };
  return {width:w,height:h,ctx:context,getContext(){return context;}};
}
const canvas=makeCanvas(), original=makeCanvas();
const src={width:20,height:20,pixels:original.ctx.getImageData.call({buffer:original.ctx.buffer||new Uint8ClampedArray(20*20*4)}).data};
// Generate source using the same gradient as the test helper.
for(let y=0;y<20;y++)for(let x=0;x<20;x++){
  const i=(y*20+x)*4;src.pixels[i]=40+x*7;src.pixels[i+1]=60+y*7;src.pixels[i+2]=120+x*3;src.pixels[i+3]=255;
}
for (const preset of presets) {
  apply(canvas,src,preset);
  assert.equal(canvas.ctx.buffer.length,20*20*4,preset.id);
}
for (const name of ['negative','grayscale','sepia','cookie','kodachrome','pixelate','emboss','sharpen','film-grain']) {
  const preset = presets.find(x=>x.id===name);
  apply(canvas,src,preset);
  assert.notDeepEqual(Array.from(canvas.ctx.buffer),Array.from(src.pixels),name+' should modify pixels');
}
console.log('PASS: '+presets.length+' filter presets tested with in-memory Canvas image data');
