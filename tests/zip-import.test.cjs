'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const repo=path.resolve(__dirname,'..'),vendor=path.join(repo,'mobile','vendor','fflate.min.js');
const zipEngine=require(vendor);
const entry={};
for(let i=1;i<=14;i++){
 const name='ref_'+String(i).padStart(2,'0')+'.jpg';
 entry[name]=new Uint8Array([0xff,0xd8,0xff,i,0xff,0xd9]);
}
entry['unrelated.txt']=new Uint8Array([1,2,3]);
const zipped=zipEngine.zipSync(entry,{level:6});
const decoded=zipEngine.unzipSync(zipped,{filter:item=>item.name.startsWith('ref_')&&item.name.endsWith('.jpg')});
assert.equal(Object.keys(decoded).length,14,'Extract only expected reference images');
assert.equal(decoded['ref_07.jpg'][3],7);
const code=fs.readFileSync(path.join(repo,'mobile','personal-frame-import.js'),'utf8');
assert.match(code,/async function importZip/);
assert.match(code,/library.save\(/);
assert.match(code,/unzipSync\(/);
assert.match(code,/total>60\*1024\*1024/);
assert.ok(fs.existsSync(path.join(repo,'mobile','vendor','fflate-LICENSE.txt')));
const html=fs.readFileSync(path.join(repo,'mobile','index.html'),'utf8');
assert.ok(html.includes('id="editorImportZip"'));
assert.ok(html.includes('vendor/fflate.min.js'));
const dir=path.join(repo,'dist','iphone');
if(fs.existsSync(path.join(dir,'index.html'))){
 assert.ok(fs.existsSync(path.join(dir,'vendor','fflate.min.js')));
 assert.ok(!fs.existsSync(path.join(dir,'private-frames')));
}
console.log('PASS: 14 ZIP entries extract offline, original files stay private, ZIP parser and persistent import wiring present');
