'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const repo=path.resolve(__dirname,'..');
const text=p=>fs.readFileSync(path.join(repo,p),'utf8');
const html=text('mobile/index.html');
const ui=text('mobile/personal-frame-ui.js');
const editor=text('mobile/editor-v4.js');
const importer=text('mobile/personal-frame-import.js');
for(const id of ['personalFramesMain','savedFrameGrid','savedFrameCount','personalZipFile',
 'zipFrameReview','zipFrameChoices','zipSelectAll','zipSelectNone','zipSaveChosen',
 'zipCancel','personalFrameStatus']){
 assert.ok(html.includes('id="'+id+'"'),'Missing '+id);
}
assert.ok(html.indexOf('id="personalFramesMain"')<html.indexOf('id="frames"'),
 'Saved frames must be above default frame thumbnails');
assert.ok(html.includes('personal-frame-ui.js'),'Main gallery module missing');
assert.ok(ui.includes('window.BloomTemplateLibrary'));
assert.ok(ui.includes('await importer.readZip(file)'),'ZIP review must happen before saving');
assert.ok(ui.includes('state.chosen.has'),'Only selected ZIP files should be persisted');
assert.ok(ui.includes('window.BloomEditor.openPersonalTemplate'),'Saved frame should open editable camera frame');
assert.ok(ui.includes('await lib.remove(template.id)'),'Deleting a frame must persist');
assert.ok(editor.includes('async openPersonalTemplate(id)'));
assert.ok(importer.includes('async function readZip(file)'));
assert.ok(importer.includes('return Object.freeze({importFiles,readZip,importZip'));
const files=text('scripts/build-iphone-pwa.cjs');
assert.ok(files.includes("'personal-frame-ui.js'"),'PWA must include main gallery');
assert.ok(text('.gitignore').includes('/mobile/private-frames/'),'User source assets must remain private');
console.log('PASS: personal imported ZIP frames listed above originals, individually selected, stored locally, re-opened and removable from main panel');
