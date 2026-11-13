'use strict';
(() => {
  const $=id=>document.getElementById(id);
  const video=$('camera'), preview=$('snapshot'), viewport=$('viewport');
  const status=$('status'), counter=$('shotCounter'), start=$('start'), flip=$('flip');
  const shoot=$('shoot'), retake=$('retake'), reset=$('resetStrip'), download=$('download');
  const security=$('security'), filters=window.PhotoboothFilters,studio=window.BloomStudio, selection=window.BloomSelection;
  if(!filters||!studio||!selection){status.textContent='Thiếu thư viện xử lý ảnh';return;}
  const state={count:3,layout:'vertical',rects:studio.cloneRects(3,'vertical'),
    shots:[null,null,null],active:0,selected:0,swapFrom:-1,manual:false,
    frame:studio.frames[0],filter:filters.presets[0],category:'all',frameCategory:'all',
    facing:'user',stream:null,busy:false,thumbTimer:null,previewImage:null,framePreviewTimer:null,
    captureTotal:3,pickMode:false,pool:[],picked:[],selectionFinal:false,saving:false};
  const secure=window.isSecureContext&&!!navigator.mediaDevices?.getUserMedia;
  const setStatus=s=>{status.textContent=s;};
  const hasShot=()=>state.shots.some(Boolean)||state.pool.length>0;
  function photoSample(){
    const c=document.createElement('canvas');c.width=140;c.height=190;
    const x=c.getContext('2d');
    const previous=state.shots.find(Boolean)||state.pool[state.pool.length-1];
    if(state.stream&&video.videoWidth){
      const w=video.videoWidth,h=video.videoHeight,scale=Math.max(c.width/w,c.height/h);
      x.save();if(state.facing==='user'){x.translate(c.width,0);x.scale(-1,1);}
      x.drawImage(video,(c.width-w*scale)/2,(c.height-h*scale)/2,w*scale,h*scale);x.restore();
    }else if(previous){x.drawImage(previous,0,0,c.width,c.height);}
    else{
      const g=x.createLinearGradient(0,0,140,190);g.addColorStop(0,'#f4cfc9');g.addColorStop(1,'#b5d0cf');
      x.fillStyle=g;x.fillRect(0,0,140,190);
      x.fillStyle='#de9e91';x.beginPath();x.arc(70,66,31,0,Math.PI*2);x.fill();
      x.fillStyle='#9378a1';x.beginPath();x.ellipse(70,187,68,69,0,0,Math.PI*2);x.fill();
    }
    return c;
  }
  const filteredCache=new WeakMap();
  function filteredShot(source){
    if(!source)return null;
    let memo=filteredCache.get(source);
    if(memo&&memo.key===state.filter.id)return memo.canvas;
    const canvas=document.createElement('canvas');filters.apply(canvas,source,state.filter);
    filteredCache.set(source,{key:state.filter.id,canvas});return canvas;
  }
  function renderedShots(){return state.shots.map(filteredShot);}
  function resizeCanvas(){
    const dim=studio.dimensions(state.count);
    preview.width=420;preview.height=Math.round(dim.h*420/dim.w);
    viewport.style.aspectRatio=dim.w+'/'+dim.h;
    const narrow=window.matchMedia('(max-width:600px)').matches;
    viewport.style.maxWidth=narrow
      ? state.count===1?'285px':state.count===3?'215px':'168px'
      : state.count===1?'380px':state.count===3?'325px':'310px';
  }
  function positionLive(){
    if(!state.stream||state.active>=state.count){video.style.display='none';return;}
    const r=state.rects[state.active];
    video.style.left=(r.x*100)+'%';video.style.top=(r.y*100)+'%';
    video.style.width=(r.w*100)+'%';video.style.height=(r.h*100)+'%';
    video.style.display='block';video.style.filter=state.filter.css;
    video.classList.toggle('mirror',state.facing==='user');
  }
  function updateActiveFramePreview(){
    const detail=$('activeFrameCanvas');
    if(!detail)return;
    const dim=studio.dimensions(state.count);
    detail.width=180;
    detail.height=Math.round(180*dim.h/dim.w);
    // Use the exact same art/composition logic for the sticky preview and main photo.
    studio.render(detail,{count:state.count,layout:state.layout,rects:state.rects,
      shots:renderedShots(),frame:state.frame.id,filter:state.filter,preFiltered:true,preview:false});
    $('activeFrameName').textContent=state.frame.label;
  }
  function renderCanvas(){
    studio.render(preview,{count:state.count,layout:state.layout,rects:state.rects,
      shots:renderedShots(),frame:state.frame.id,filter:state.filter,preFiltered:true,
      selected:state.manual?state.selected:-1,preview:true});
    positionLive();
    updateActiveFramePreview();
  }
  function render(){
    renderCanvas();
    const complete=state.active>=state.count && (!state.pickMode||state.selectionFinal);
    const photoProgress=state.pickMode&&!state.selectionFinal ? state.pool.length : state.active;
    const goal=state.pickMode&&!state.selectionFinal ? state.captureTotal : state.count;
    counter.textContent=photoProgress+' / '+goal;
    shoot.textContent=complete?'✓ Đã chụp đủ':photoProgress>=goal?'Chọn ảnh bên dưới':'● Chụp '+(photoProgress+1)+'/'+goal;
    shoot.disabled=complete||photoProgress>=goal||!state.stream;
    retake.hidden=state.pickMode?(!state.pool.length||state.selectionFinal):state.active===0;
    reset.hidden=state.pickMode?!state.pool.length:state.active===0;
    $('editCurrent').hidden=!hasShot();
    download.disabled=!complete;
    renderCandidates();
    $('downloadDescription').textContent=complete
      ?(window.BloomNativePhotos?.isNative?.()?'Đã hoàn tất. Ảnh được lưu tự động vào Photos.':'Đã hoàn tất. Dùng Chia sẻ để lưu vào Ảnh.')
      :state.pickMode?'Chụp đủ 5 tấm, rồi chọn 3 tấm muốn ghép vào khung.':'Hoàn tất bộ ảnh để lưu thẳng vào Photos trên iPhone.';
    download.textContent=window.BloomNativePhotos?.isNative?.()?'Lưu lại vào Ảnh':'Chia sẻ / Lưu vào Ảnh';
    positionLive();renderShotCards();
  }
  function renderShotCards(){
    const box=$('shotSlots');box.replaceChildren();
    for(let i=0;i<state.count;i++){
      const b=document.createElement('button');b.type='button';b.draggable=Boolean(state.shots[i]);
      b.className='shot-slot'+(state.selected===i?' active':'')+(state.swapFrom===i?' swap-from':'');
      const img=document.createElement('img');img.alt='Ảnh ô '+(i+1);
      if(state.shots[i]){try{img.src=state.shots[i].toDataURL('image/jpeg',.6);}catch{}}
      else img.alt='Ô '+(i+1)+' chưa chụp';
      const label=document.createElement('span');label.textContent='Ô '+(i+1)+(state.shots[i]?' ✓':' trống');
      b.append(img,label);b.dataset.slot=String(i);
      b.addEventListener('click',()=>selectSlot(i));
      b.addEventListener('dragstart',e=>{e.dataTransfer?.setData('text/plain',String(i));});
      b.addEventListener('dragover',e=>e.preventDefault());
      b.addEventListener('drop',e=>{
        e.preventDefault();
        const from=Number(e.dataTransfer?.getData('text/plain'));
        if(Number.isInteger(from)&&from>=0&&from<state.count)swap(from,i);
      });
      box.appendChild(b);
    }
  }
  function swap(a,b){
    if(a<0||b<0||a>=state.count||b>=state.count)return;
    [state.shots[a],state.shots[b]]=[state.shots[b],state.shots[a]];
    // Occupancy remains contiguous by capture order only if both are filled.
    if(state.active<state.count&&(!state.shots.slice(0,state.active).every(Boolean)||state.shots.slice(state.active).some(Boolean))){
      [state.shots[a],state.shots[b]]=[state.shots[b],state.shots[a]];
      setStatus('Chỉ hoán đổi những ô đã chụp.');return;
    }
    state.swapFrom=-1;state.selected=b;render();setStatus('Đã đổi vị trí ảnh '+(a+1)+' và '+(b+1)+'.');
  }
  function selectSlot(i){
    if(state.swapFrom!==-1&&state.swapFrom!==i&&state.shots[state.swapFrom]&&state.shots[i]){
      swap(state.swapFrom,i);return;
    }
    state.selected=i;
    state.swapFrom=state.shots[i]?i:-1;
    updateSizeControl();render();
  }
  function updateSizeControl(){
    const r=state.rects[state.selected]||state.rects[0];
    const base=studio.cloneRects(state.count,state.layout)[state.selected]||r;
    const value=Math.round(r.w/base.w*100);
    $('slotSize').value=String(Math.max(60,Math.min(140,value)));
    $('slotSizeValue').textContent=$('slotSize').value+'%';
  }
  function changeMode(count,captureTotal=count){
    if(count===state.count && captureTotal===state.captureTotal)return;
    if(hasShot()&&!window.confirm('Đổi chế độ sẽ xóa các ảnh đang chụp. Tiếp tục?'))return;
    state.count=count;state.captureTotal=captureTotal;state.pickMode=captureTotal>count;
    state.pool=[];state.picked=[];state.selectionFinal=false;
    state.count=count;state.layout='vertical';state.rects=studio.cloneRects(count,'vertical');
    state.shots=Array.from({length:count},()=>null);state.active=0;state.selected=0;state.swapFrom=-1;
    state.manual=false;$('manualPosition').checked=false;$('sizeControl').hidden=true;
    viewport.classList.remove('drag-enabled');
    document.querySelectorAll('.mode-option').forEach(b=>b.classList.toggle('active',Number(b.dataset.count)===count&&Number(b.dataset.shots||b.dataset.count)===captureTotal));
    resizeCanvas();showLayouts();showFrames();render();refreshPreviews(true);
  }
  function showLayouts(){
    const box=$('layoutOptions');box.replaceChildren();
    for(const item of studio.layouts){
      const b=document.createElement('button');b.type='button';b.textContent=item.label;
      b.className='layout-option'+(state.layout===item.id?' active':'');b.dataset.layout=item.id;
      b.disabled=state.count===1&&item.id!=='vertical';
      b.addEventListener('click',()=>{
        state.layout=item.id;state.rects=studio.cloneRects(state.count,item.id);
        state.selected=Math.min(state.selected,state.count-1);showLayouts();updateSizeControl();render();refreshPreviews(true);
      });box.appendChild(b);
    }
  }
  function showFilters(){
    const box=$('filters');box.replaceChildren();
    for(const f of filters.presets){
      const isFilm=['antique','retro','vintage','polaroid','kodachrome','technicolor','cookie','brownie','pinhole','clarendon','juno','lark','reyes','crema','aden','ludwig'].includes(f.id);
      const isPortrait=['none','color','cool','warm','grayscale','soft-portrait','everglow','pink','washed','summer','aqua','green','blue','sepia'].includes(f.id);
      const category=isFilm?'film':isPortrait?'portrait':'creative';
      if(state.category!=='all'&&state.category!==category)continue;
      const b=document.createElement('button');b.type='button';b.dataset.value=f.id;
      b.className='filter-option'+(f.id===state.filter.id?' active':'');
      const img=document.createElement('img');img.className='filter-preview filter-preview-image';
      img.alt='Mẫu '+f.label;img.style.filter=f.css;
      if(state.previewImage)img.src=state.previewImage;
      const label=document.createElement('span');label.className='filter-label';label.textContent=f.label;
      const check=document.createElement('span');check.className='check';check.textContent='✓';
      b.append(img,check,label);
      b.addEventListener('click',()=>{state.filter=f;showFilters();render();refreshPreviews(true);});
      box.appendChild(b);
    }
  }
  function showFrames(){
    const box=$('frames');box.replaceChildren();
    const shown=studio.frames.filter(f=>state.frameCategory==='all'||f.category===state.frameCategory);
    for(const f of shown){
      const b=document.createElement('button');b.type='button';b.dataset.value=f.id;
      b.className='filter-option'+(f.id===state.frame.id?' active':'');
      const c=document.createElement('canvas');c.width=110;c.height=state.count===1?150:state.count===3?250:305;
      c.className='filter-preview frame-preview';c.dataset.frame=f.id;
      const label=document.createElement('span');label.className='filter-label';label.textContent=f.label;
      const check=document.createElement('span');check.className='check';check.textContent='✓';
      b.append(c,check,label);
      b.addEventListener('click',()=>{
        // Do not regenerate all 41 frame thumbnails on every tap: this stalled Safari.
        // First repaint the actual captured photo synchronously, then update selection state.
        state.frame=f;
        renderCanvas();
        box.querySelectorAll('.filter-option').forEach(option=>{
          const selected=option.dataset.value===f.id;
          option.classList.toggle('active',selected);
          option.setAttribute('aria-pressed',String(selected));
        });
        setStatus('Đã đổi khung sang '+f.label+'. Ảnh đã chụp và file tải về đã cập nhật.');
      });
      box.appendChild(b);
    }
    refreshPreviews(true);
  }
  let refreshLock=false;
  function refreshPreviews(includeFrames=false){
    if(refreshLock)return;
    refreshLock=true;
    requestAnimationFrame(()=>{
      refreshLock=false;
      const sample=photoSample();
      try{
        const uri=sample.toDataURL('image/jpeg',.7);state.previewImage=uri;
        document.querySelectorAll('.filter-preview-image').forEach(img=>{img.src=uri;});
      }catch{}
      if(includeFrames||!$('framePanel').hidden){
        let filtered=sample;
        try{filtered=filteredShot(sample);}catch{}
        document.querySelectorAll('.frame-preview').forEach(c=>{
          studio.render(c,{count:state.count,layout:state.layout,
            rects:state.rects,shots:Array.from({length:state.count},()=>filtered),
            frame:c.dataset.frame,preFiltered:true,preview:false});
        });
      }
    });
  }
  function stopStream(){
    if(state.stream)state.stream.getTracks().forEach(t=>t.stop());
    state.stream=null;video.srcObject=null;
    if(state.thumbTimer){clearInterval(state.thumbTimer);state.thumbTimer=null;}
    video.style.display='none';
  }
  async function openCamera(){
    if(!secure){security.hidden=false;setStatus('Safari cần HTTPS tin cậy để mở camera.');return;}
    if(state.busy||state.active>=state.count)return;
    state.busy=true;start.disabled=true;stopStream();
    try{
      state.stream=await navigator.mediaDevices.getUserMedia({audio:false,video:{
        facingMode:{ideal:state.facing},width:{ideal:1920},height:{ideal:1440}}});
      video.srcObject=state.stream;await video.play();
      start.hidden=true;flip.disabled=false;security.hidden=true;
      render();refreshPreviews(true);
      state.thumbTimer=setInterval(()=>{if(state.stream&&!document.hidden)refreshPreviews(false);},3000);
      setStatus('Camera sẵn sàng. Chụp ô '+(state.active+1)+'/'+state.count+'.');
    }catch(e){setStatus('Không mở được camera: '+(e.name||'Error')+' — '+(e.message||'kiểm tra quyền Camera.'));
      security.hidden=e.name!=='NotAllowedError';
    }finally{state.busy=false;start.disabled=false;}
  }
  function capture(){
    if(!state.stream||!video.videoWidth)return;
    if(state.pickMode ? state.pool.length>=state.captureTotal : state.active>=state.count)return;
    const scale=Math.min(1,1600/Math.max(video.videoWidth,video.videoHeight));
    const raw=document.createElement('canvas');
    raw.width=Math.round(video.videoWidth*scale);raw.height=Math.round(video.videoHeight*scale);
    const ctx=raw.getContext('2d');
    if(state.facing==='user'){ctx.translate(raw.width,0);ctx.scale(-1,1);}
    ctx.drawImage(video,0,0,raw.width,raw.height);
    if(state.pickMode){
      state.pool.push(raw);
      if(state.pool.length===state.captureTotal){stopStream();flip.disabled=true;}
      render();refreshPreviews(true);
      setStatus(state.pool.length===state.captureTotal?'Đã có 5 ảnh. Chọn đúng 3 tấm để ghép.':'Đã chụp '+state.pool.length+'/'+state.captureTotal+' ảnh.');
      return;
    }
    state.shots[state.active]=raw;state.active++;
    if(state.active===state.count){stopStream();flip.disabled=true;}
    state.selected=Math.min(state.active,state.count-1);
    state.swapFrom=-1;render();refreshPreviews(true);
    if(state.active===state.count){
      if($('autoSaveCapture').checked)void saveToPhotos(true);
      else setStatus('Đã chụp đủ '+state.count+' ảnh. Nhấn Chỉnh sửa ảnh đã chụp để chọn và ghép theo ý bạn.');
    }else setStatus('Đã chụp '+state.active+'/'+state.count+' ảnh.');
  }
  function retakeLast(){
    if(state.pickMode&&state.selectionFinal){
      state.selectionFinal=false;state.active=0;state.shots=Array.from({length:state.count},()=>null);
      render();setStatus('Chọn lại 3 ảnh trong 5 tấm đã chụp.');return;
    }
    if(state.pickMode&&!state.selectionFinal){
      if(!state.pool.length)return;
      state.pool.pop();state.picked=[];render();refreshPreviews(true);
      if(!state.stream)void openCamera();return;
    }
    if(!state.active)return;
    state.active--;state.shots[state.active]=null;state.selected=state.active;
    state.swapFrom=-1;render();refreshPreviews(true);
    if(!state.stream)openCamera();
  }
  function restart(){
    state.pool=[];state.picked=[];state.selectionFinal=false;
    state.shots=Array.from({length:state.count},()=>null);
    state.active=0;state.selected=0;state.swapFrom=-1;render();refreshPreviews(true);
    if(!state.stream)openCamera();
  }
  function renderCandidates(){
    const panel=$('photoSelectionPanel'),grid=$('photoCandidates');
    if(!panel||!grid)return;
    const ready=state.pickMode&&state.pool.length===state.captureTotal;
    panel.hidden=!ready;
    if(!ready){grid.replaceChildren();return;}
    grid.replaceChildren();
    state.pool.forEach((source,index)=>{
      const button=document.createElement('button');button.type='button';
      button.className='photo-candidate'+(state.picked.includes(index)?' picked':'');
      button.dataset.index=String(index);
      button.dataset.order=state.picked.includes(index)?String(state.picked.indexOf(index)+1):'';
      button.setAttribute('aria-pressed',String(state.picked.includes(index)));
      const img=document.createElement('img');img.alt='Tấm ảnh đã chụp '+(index+1);
      img.src=source.toDataURL('image/jpeg',.62);
      const label=document.createElement('span');label.textContent='Tấm '+(index+1);
      button.append(img,label);
      button.addEventListener('click',()=>{
        state.picked=selection.choose(state.picked,index,state.count,state.pool.length);
        state.selectionFinal=false;
        state.shots=Array.from({length:state.count},()=>null);
        state.active=0;
        render();
        $('photoSelectionHint').textContent='Đã chọn '+state.picked.length+'/'+state.count+' — thứ tự chọn là thứ tự ghép ảnh.';
      });
      grid.appendChild(button);
    });
    $('confirmPhotos').disabled=state.picked.length!==state.count;
    $('confirmPhotos').hidden=state.selectionFinal;
    $('editPhotos').hidden=!state.selectionFinal;
    if(state.selectionFinal){
      $('photoSelectionHint').textContent='Đã chọn xong 3 ảnh. Bạn có thể đổi khung và lưu lại.';
    }
  }
  function confirmSelected(){
    if(state.pool.length!==state.captureTotal)return;
    try{
      state.shots=selection.arrange(state.pool,state.picked,state.count);
      state.active=state.count;state.selectionFinal=true;
      render();refreshPreviews(true);
      void saveToPhotos(true);
    }catch(error){setStatus('Lỗi chọn ảnh: '+error.message);}
  }
  function outputCanvas(){
    const dim=studio.dimensions(state.count);
    const canvas=document.createElement('canvas');canvas.width=dim.w;canvas.height=dim.h;
    studio.render(canvas,{count:state.count,layout:state.layout,rects:state.rects,
      shots:renderedShots(),frame:state.frame.id,preFiltered:true,preview:false});
    return canvas;
  }
  async function saveToPhotos(automatic=false){
    if(state.active!==state.count||state.saving)return;
    // An ordinary web page cannot silently write to iOS Photos.
    if(automatic&&!window.BloomNativePhotos?.isNative?.()){
      setStatus('Bộ ảnh đã hoàn thành. Mở ứng dụng iOS từ Sideloadly để tự lưu vào Photos; bản web dùng nút Chia sẻ.');
      return;
    }
    state.saving=true;download.disabled=true;
    try{
      const canvas=outputCanvas();
      const dataUrl=canvas.toDataURL('image/jpeg',.94);
      if(window.BloomNativePhotos?.isNative?.()){
        await window.BloomNativePhotos.savePhoto(dataUrl);
        setStatus('Đã lưu thành công '+state.count+' ảnh ghép vào thư viện Ảnh (Photos) của iPhone.');
      }else if(!automatic){
        const blob=await new Promise((resolve,reject)=>canvas.toBlob(
          data=>data?resolve(data):reject(Error('Không tạo được ảnh')),'image/jpeg',.94));
        const file=new File([blob],'bloombooth-'+state.count+'-photo.jpg',{type:'image/jpeg'});
        if(navigator.share&&(!navigator.canShare||navigator.canShare({files:[file]}))){
          await navigator.share({files:[file],title:'BloomBooth'});
          setStatus('Chọn Lưu hình ảnh trong bảng Chia sẻ của iPhone.');
        }else{
          const url=URL.createObjectURL(blob),a=document.createElement('a');
          a.href=url;a.download=file.name;document.body.append(a);a.click();a.remove();
          setTimeout(()=>URL.revokeObjectURL(url),30000);
          setStatus('Trình duyệt này chỉ hỗ trợ tải file. Ứng dụng iOS native hỗ trợ tự lưu Photos.');
        }
      }
    }catch(error){
      if(error?.name==='AbortError'){setStatus('Đã đóng bảng Chia sẻ.');}
      else setStatus('Lỗi lưu ảnh: '+(error?.message||error)+'. Kiểm tra quyền Photos trong Cài đặt iPhone.');
    }finally{state.saving=false;download.disabled=false;}
  }
  function placeModeBar(){
    const bar=$('modeOptions');
    const narrow=window.matchMedia('(max-width:850px)').matches;
    if(narrow){document.querySelector('.intro').after(bar);bar.classList.add('quick-modes');}
    else{document.querySelector('.setup-section > .control-label').after(bar);bar.classList.remove('quick-modes');}
    resizeCanvas();
  }
  for(const b of document.querySelectorAll('.mode-option'))b.addEventListener('click',()=>{
    changeMode(Number(b.dataset.count),Number(b.dataset.shots||b.dataset.count));
    $('autoSaveCapture').checked=true;
  });
  $('cameraApplyCount').addEventListener('click',()=>{
    const count=Number($('cameraCustomCount').value);
    if(!Number.isInteger(count)||count<1||count>10){
      setStatus('Số ảnh phải là số nguyên từ 1 đến 10.');return;
    }
    changeMode(count);
    $('autoSaveCapture').checked=false; // custom batches usually continue to the editor
  });
  // Explicitly share originals with the separate editor; it never modifies
  // the camera session or uploads pictures to any server.
  window.BloomEditorBridge=Object.freeze({
    getCaptured:()=>state.pool.length?state.pool.slice():state.shots.filter(Boolean)
  });
  $('editCurrent').addEventListener('click',()=>{
    $('editorOpen').click();$('editorFromCamera').click();
  });
  $('confirmPhotos').addEventListener('click',confirmSelected);
  $('editPhotos').addEventListener('click',()=>{state.selectionFinal=false;state.active=0;state.shots=Array.from({length:state.count},()=>null);render();});
  for(const b of document.querySelectorAll('.editor-tab'))b.addEventListener('click',()=>{
    const isFrame=b.dataset.editor==='frame';
    $('filterPanel').hidden=isFrame;$('framePanel').hidden=!isFrame;
    document.querySelectorAll('.editor-tab').forEach(x=>{
      x.classList.toggle('active',x===b);x.setAttribute('aria-selected',String(x===b));
    });
    refreshPreviews(isFrame);
  });
  document.querySelectorAll('#categories .chip').forEach(b=>b.addEventListener('click',()=>{
    state.category=b.dataset.category;
    document.querySelectorAll('#categories .chip').forEach(x=>x.classList.toggle('active',x===b));
    showFilters();refreshPreviews(false);
  }));
  document.querySelectorAll('#frameCategories .chip').forEach(b=>b.addEventListener('click',()=>{
    state.frameCategory=b.dataset.frameCategory;
    document.querySelectorAll('#frameCategories .chip').forEach(x=>x.classList.toggle('active',x===b));
    showFrames();
  }));
  $('manualPosition').addEventListener('change',e=>{
    state.manual=e.target.checked;$('sizeControl').hidden=!state.manual;
    viewport.classList.toggle('drag-enabled',state.manual);
    updateSizeControl();render();
  });
  $('resetLayout').addEventListener('click',()=>{
    state.rects=studio.cloneRects(state.count,state.layout);
    updateSizeControl();render();refreshPreviews(true);
  });
  $('slotSize').addEventListener('input',e=>{
    const selected=state.selected,r=state.rects[selected];
    const base=studio.cloneRects(state.count,state.layout)[selected];
    const factor=Number(e.target.value)/100;
    const centerX=r.x+r.w/2,centerY=r.y+r.h/2;
    state.rects[selected]=studio.constrain({
      x:centerX-base.w*factor/2,y:centerY-base.h*factor/2,w:base.w*factor,h:base.h*factor});
    $('slotSizeValue').textContent=e.target.value+'%';render();
  });
  let pointer=null;
  viewport.addEventListener('pointerdown',e=>{
    if(!state.manual)return;
    const r=viewport.getBoundingClientRect(),x=(e.clientX-r.left)/r.width,y=(e.clientY-r.top)/r.height;
    const index=studio.hit(state.rects,x,y);
    if(index<0)return;
    state.selected=index;state.swapFrom=-1;
    const slot=state.rects[index];
    pointer={id:e.pointerId,index,dx:x-slot.x,dy:y-slot.y};
    viewport.setPointerCapture?.(e.pointerId);
    updateSizeControl();render();
  });
  viewport.addEventListener('pointermove',e=>{
    if(!pointer||e.pointerId!==pointer.id)return;
    e.preventDefault();
    const b=viewport.getBoundingClientRect();
    const x=(e.clientX-b.left)/b.width-pointer.dx;
    const y=(e.clientY-b.top)/b.height-pointer.dy;
    state.rects[pointer.index]=studio.constrain({...state.rects[pointer.index],x,y});
    renderCanvas();
  });
  const endPointer=e=>{if(pointer&&e.pointerId===pointer.id){
    pointer=null;refreshPreviews(true);
  }};
  viewport.addEventListener('pointerup',endPointer);
  viewport.addEventListener('pointercancel',endPointer);
  start.addEventListener('click',openCamera);
  flip.addEventListener('click',()=>{state.facing=state.facing==='user'?'environment':'user';openCamera();});
  shoot.addEventListener('click',capture);
  retake.addEventListener('click',retakeLast);
  reset.addEventListener('click',restart);
  download.addEventListener('click',()=>{void saveToPhotos(false);});
  window.addEventListener('pagehide',stopStream);
  if(!secure){security.hidden=false;setStatus('Camera live cần HTTPS tin cậy.');}
  placeModeBar();
  window.addEventListener('resize',placeModeBar);
  showLayouts();showFilters();showFrames();render();refreshPreviews(true);
})();