'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const pwa=path.join(root,'dist','iphone');
const app=path.join(root,'ios-app','www');
if(!fs.existsSync(path.join(pwa,'index.html')))throw Error('Run build-iphone-pwa.cjs first');
fs.rmSync(app,{recursive:true,force:true});
fs.cpSync(pwa,app,{recursive:true});
let html=fs.readFileSync(path.join(app,'index.html'),'utf8');
// An iOS app is installed through Sideloadly, not the Safari Add to Home Screen flow.
html=html.replace(/<section class="pwa-install-note"[^>]*>[\s\S]*?<\/section>/,'');
html=html.replace('<script src="./pwa.js" defer></script>','');
html=html.replace(/(<script src="\.\/lite\.js(?:\?[^\"]*)?" defer><\/script>)/,
  '<script src="./native-photos.js" defer></script>\n$1');
assert.ok(html.includes('native-photos.js'));
assert.ok(!html.includes('pwa-install-note'));
fs.writeFileSync(path.join(app,'index.html'),html,'utf8');
for(const name of ['pwa.js','sw.js'])fs.rmSync(path.join(app,name),{force:true});
console.log('Created native iOS web bundle:',app);
