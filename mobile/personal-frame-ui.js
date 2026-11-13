'use strict';
// Frame library UI: persistent, per-device, no backend or upload.
// ZIP is inspected first; only user-selected frames are committed to IndexedDB.
(() => {
  const lib=window.BloomTemplateLibrary;
  const importer=window.BloomPersonalFrameImporter;
  const get=id=>document.getElementById(id);
  if(!lib||!importer||!get('savedFrameGrid'))return;

  const state={candidates:[],chosen:new Set(),objectURLs:[],busy:false};
  const savedGrid=get('savedFrameGrid');
  const zipList=get('zipFrameChoices');
  const zipPanel=get('zipFrameReview');
  const status=get('personalFrameStatus');
  const count=get('savedFrameCount');
  const selectedCount=get('zipSelectedCount');

  function message(value){status.textContent=value;status.hidden=false;}
  function clearZIP(){
    for(const url of state.objectURLs)URL.revokeObjectURL(url);
    state.objectURLs=[];
    state.candidates=[];
    state.chosen.clear();
    zipList.replaceChildren();
    zipPanel.hidden=true;
  }

  function countSelection(){
    selectedCount.textContent=state.chosen.size+'/'+state.candidates.length+' mẫu được chọn';
    get('zipSaveChosen').disabled=state.busy||state.chosen.size===0;
  }

  function frameCard(template){
    const card=document.createElement('article');
    card.className='saved-frame-card';
    card.dataset.personalId=template.id;
    const preview=document.createElement('img');
    preview.className='saved-frame-image';
    preview.alt='Khung '+template.name;
    if(template.background)preview.src=template.background;
    else preview.src='./icons/icon-192.png';
    const detail=document.createElement('div');
    detail.className='saved-frame-description';
    const label=document.createElement('strong');
    label.textContent=template.name;
    const meta=document.createElement('small');
    meta.textContent=template.count+' ô ảnh · Đã lưu trên thiết bị';
    detail.append(label,meta);
    const use=document.createElement('button');
    use.type='button';use.className='saved-frame-use';
    use.textContent='Chọn & chụp';
    use.addEventListener('click',async()=>{
      use.disabled=true;
      try{
        get('framePanel').querySelectorAll('.saved-frame-card').forEach(el=>
          el.classList.toggle('selected',el.dataset.personalId===template.id));
        if(!window.BloomEditor?.openPersonalTemplate)throw Error('Trình chỉnh sửa chưa tải xong');
        await window.BloomEditor.openPersonalTemplate(template.id);
        message('Đã chọn '+template.name+'. Nhấn Mở camera trong khung để chụp từng ô.');
      }catch(error){message('Không thể mở khung: '+error.message);}
      finally{use.disabled=false;}
    });
    const remove=document.createElement('button');
    remove.type='button';remove.className='saved-frame-delete';
    remove.textContent='Xóa';
    remove.setAttribute('aria-label','Xóa khung '+template.name);
    remove.addEventListener('click',async()=>{
      if(!window.confirm('Xóa khung "'+template.name+'" khỏi thư viện trên thiết bị này?'))return;
      remove.disabled=true;
      try{
        await lib.remove(template.id);
        await window.BloomEditor?.refreshPersonalTemplates?.();
        window.dispatchEvent(new Event('bloom:personal-frames-changed'));
        message('Đã xóa khung '+template.name+'. Các khung khác được giữ nguyên.');
      }catch(error){message('Không xóa được: '+error.message);}
      finally{remove.disabled=false;}
    });
    const actions=document.createElement('div');actions.className='saved-frame-actions';
    actions.append(use,remove);
    card.append(preview,detail,actions);
    return card;
  }

  async function refresh(){
    let saved;
    try{saved=await lib.list();}
    catch(error){message('Không đọc được bộ nhớ khung: '+error.message);return;}
    saved.sort((a,b)=>(b.savedAt||0)-(a.savedAt||0));
    savedGrid.replaceChildren();
    count.textContent=String(saved.length);
    if(!saved.length){
      const empty=document.createElement('p');
      empty.className='saved-frame-empty';
      empty.textContent='Chưa có khung đã lưu. Chọn ZIP, đánh dấu từng khung muốn giữ và bấm Lưu khung đã chọn.';
      savedGrid.append(empty);
    }else{
      for(const template of saved)savedGrid.append(frameCard(template));
    }
  }

  async function openZip(file){
    if(!file)return;
    clearZIP();
    try{
      message('Đang kiểm tra ZIP: '+file.name);
      const files=await importer.readZip(file);
      if(!files.length)throw Error('Không tìm thấy các ảnh ref_01.jpg ... ref_14.jpg');
      state.candidates=files;
      zipPanel.hidden=false;
      for(const file of files){
        const number=importer.getIndex(file.name);
        const definition=(window.BloomPersonalFrameDefs||[]).find(x=>x.number===number);
        const card=document.createElement('label');
        card.className='zip-choice';
        const box=document.createElement('input');box.type='checkbox';
        box.value=String(number);box.checked=false;
        box.addEventListener('change',()=>{
          if(box.checked)state.chosen.add(number);
          else state.chosen.delete(number);
          card.classList.toggle('checked',box.checked);
          countSelection();
        });
        const url=URL.createObjectURL(file);
        state.objectURLs.push(url);
        const img=document.createElement('img');img.src=url;img.alt=definition?.name||file.name;
        const title=document.createElement('span');
        title.textContent=(definition?.name||file.name)+' · '+(definition?.slots.length||'?')+' ô';
        card.append(box,img,title);
        zipList.append(card);
      }
      countSelection();
      zipPanel.scrollIntoView({behavior:'smooth',block:'nearest'});
      message('Đã đọc ZIP. Đánh dấu từng khung bạn muốn lưu, rồi bấm Lưu khung đã chọn.');
    }catch(error){
      clearZIP();
      message('Không đọc được ZIP: '+error.message);
    }
  }

  async function saveSelected(){
    if(state.busy||!state.chosen.size)return;
    const files=state.candidates.filter(f=>state.chosen.has(importer.getIndex(f.name)));
    state.busy=true;countSelection();
    try{
      const result=await importer.importFiles(files,m=>message(m));
      if(result.imported.length){
        await window.BloomEditor?.refreshPersonalTemplates?.();
        window.dispatchEvent(new Event('bloom:personal-frames-changed'));
        message('Đã lưu '+result.imported.length+' khung vào Bộ khung của tôi. Chạm Chọn & chụp ngay bên trên.');
      }else message('Chưa lưu được khung nào. '+(result.errors[0]?.error||''));
      if(!result.errors.length)clearZIP();
      await refresh();
    }catch(error){message('Không lưu được: '+error.message);}
    finally{state.busy=false;countSelection();}
  }

  get('personalZipFile').addEventListener('change',e=>{
    const file=e.target.files?.[0];
    e.target.value='';
    void openZip(file);
  });
  // Editor and frame gallery share the same review-and-select workflow.
  get('editorImportZip')?.addEventListener('change',e=>{
    const file=e.target.files?.[0];
    if(!file)return;
    e.stopImmediatePropagation();
    e.target.value='';
    get('frameTab').click();
    void openZip(file);
  },true);
  get('zipSelectAll').addEventListener('click',()=>{
    state.chosen=new Set(state.candidates.map(f=>importer.getIndex(f.name)));
    zipList.querySelectorAll('input[type="checkbox"]').forEach(b=>{
      b.checked=true;b.closest('.zip-choice')?.classList.add('checked');
    });
    countSelection();
  });
  get('zipSelectNone').addEventListener('click',()=>{
    state.chosen.clear();
    zipList.querySelectorAll('input[type="checkbox"]').forEach(b=>{
      b.checked=false;b.closest('.zip-choice')?.classList.remove('checked');
    });
    countSelection();
  });
  get('zipSaveChosen').addEventListener('click',()=>{void saveSelected();});
  get('zipCancel').addEventListener('click',()=>{clearZIP();message('Đã đóng danh sách ZIP, chưa lưu khung mới.');});
  window.addEventListener('bloom:personal-frames-changed',()=>{void refresh();});
  document.addEventListener('visibilitychange',()=>{
    if(!document.hidden)void refresh();
  });
  window.BloomPersonalFrameUI={refresh,openZip};
  void refresh();
})();
