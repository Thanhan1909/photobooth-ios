'use strict';
(() => {
  const $=id=>document.getElementById(id);
  const video=$('camera'), preview=$('snapshot'), viewport=$('viewport');
  const status=$('status'), counter=$('shotCounter'), start=$('start'), flip=$('flip');
  const shoot=$('shoot'), retake=$('retake'), reset=$('resetStrip'), download=$('download');
  const security=$('security'), filters=window.PhotoboothFilters,studio=window.BloomStudio;
  if(!filters||!studio){status.textContent='Thieu thu vien xu ly anh';return;}
  const state={count:3,layout:'vertical',rects:studio.cloneRects(3,'vertical'),
    shots:[null,null,null],active:0,selected:0,swapFrom:-1,manual:false,
    frame:studio.frames[0],filter:filters.presets[0],category:'all',frameCategory:'all',
    facing:'user',stream:null,busy:false,thumbTimer:null,previewImage:null,framePreviewTimer:null};
  const secure=window.isSecureContext&&!!navigator.mediaDevices?.getUserMedia;
  const setStatus=s=>{status.textContent=s;};
  const hasShot=()=>state.shots.some(Boolean);
  function photoSample(){
    const c=document.createElement('canvas');c.width=140;c.height=190;
    const x=c.getContext('2d');
    const previous=state.shots.find(Boolean);
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
  function renderCanvas(){
    studio.render(preview,{count:state.count,layout:state.layout,rects:state.rects,
      shots:renderedShots(),frame:state.frame.id,filter:state.filter,preFiltered:true,
      selected:state.manual?state.selected:-1,preview:true});
    positionLive();
  }
  function render(){
    renderCanvas();
    const complete=state.active>=state.count;
    counter.textContent=state.active+' / '+state.count;
    shoot.textContent=complete?'✓ Đã chụp đủ':'● Chụp ô '+(state.active+1)+'/'+state.count;
    shoot.disabled=complete||!state.stream;
    retake.hidden=state.active===0;reset.hidden=state.active===0;
    download.disabled=!complete;
    $('downloadDescription').textContent=complete
      ?'Đã đủ '+state.count+' ảnh. Bạn có thể chỉnh bố cục và tải JPEG.'
      :'Chụp đủ '+state.count+' ảnh để tải JPEG. Ảnh không được upload.';
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
  function changeMode(count){
    if(count===state.count)return;
    if(hasShot()&&!window.confirm('Đổi chế độ sẽ xóa các ảnh đang chụp. Tiếp tục?'))return;
    state.count=count;state.layout='vertical';state.rects=studio.cloneRects(count,'vertical');
    state.shots=Array.from({length:count},()=>null);state.active=0;state.selected=0;state.swapFrom=-1;
    state.manual=false;$('manualPosition').checked=false;$('sizeControl').hidden=true;
    viewport.classList.remove('drag-enabled');
    document.querySelectorAll('.mode-option').forEach(b=>b.classList.toggle('active',Number(b.dataset.count)===count));
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
      b.addEventListener('click',()=>{state.frame=f;showFrames();render();refreshPreviews(true);});
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
    if(!state.stream||!video.videoWidth||state.active>=state.count)return;
    const scale=Math.min(1,1600/Math.max(video.videoWidth,video.videoHeight));
    const raw=document.createElement('canvas');
    raw.width=Math.round(video.videoWidth*scale);raw.height=Math.round(video.videoHeight*scale);
    const ctx=raw.getContext('2d');
    if(state.facing==='user'){ctx.translate(raw.width,0);ctx.scale(-1,1);}
    ctx.drawImage(video,0,0,raw.width,raw.height);
    state.shots[state.active]=raw;state.active++;
    if(state.active===state.count){stopStream();flip.disabled=true;}
    state.selected=Math.min(state.active,state.count-1);
    state.swapFrom=-1;render();refreshPreviews(true);
    setStatus(state.active===state.count?'Đã đủ ảnh. Sắp xếp lại và tải về.':'Đã chụp '+state.active+'/'+state.count+'. Tiếp tục chụp ô '+(state.active+1)+'.');
  }
  function retakeLast(){
    if(!state.active)return;
    state.active--;state.shots[state.active]=null;state.selected=state.active;
    state.swapFrom=-1;render();refreshPreviews(true);
    if(!state.stream)openCamera();
  }
  function restart(){
    state.shots=Array.from({length:state.count},()=>null);
    state.active=0;state.selected=0;state.swapFrom=-1;render();refreshPreviews(true);
    if(!state.stream)openCamera();
  }
  async function exportPhoto(){
    if(state.active!==state.count)return;
    download.disabled=true;
    try{
      const dim=studio.dimensions(state.count);
      const output=document.createElement('canvas');output.width=dim.w;output.height=dim.h;
      studio.render(output,{count:state.count,layout:state.layout,rects:state.rects,
        shots:renderedShots(),frame:state.frame.id,preFiltered:true,preview:false});
      const blob=await new Promise((resolve,reject)=>output.toBlob(
        b=>b?resolve(b):reject(Error('Không thể xuất ảnh JPEG')),'image/jpeg',.94));
      const url=URL.createObjectURL(blob),a=document.createElement('a');
      a.href=url;a.download='bloombooth-'+state.count+'-photo-'+Date.now()+'.jpg';
      document.body.appendChild(a);a.click();a.remove();
      setTimeout(()=>URL.revokeObjectURL(url),60000);
      setStatus('Đã tạo JPEG '+dim.w+' × '+dim.h+' px. Safari: Chia sẻ → Lưu vào Ảnh.');
    }catch(e){setStatus('Lỗi Download: '+e.message);}finally{download.disabled=false;}
  }
  function placeModeBar(){
    const bar=$('modeOptions');
    const narrow=window.matchMedia('(max-width:850px)').matches;
    if(narrow){document.querySelector('.intro').after(bar);bar.classList.add('quick-modes');}
    else{document.querySelector('.setup-section > .control-label').after(bar);bar.classList.remove('quick-modes');}
    resizeCanvas();
  }
  for(const b of document.querySelectorAll('.mode-option'))b.addEventListener('click',()=>changeMode(Number(b.dataset.count)));
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
  download.addEventListener('click',exportPhoto);
  window.addEventListener('pagehide',stopStream);
  if(!secure){security.hidden=false;setStatus('Camera live cần HTTPS tin cậy.');}
  placeModeBar();
  window.addEventListener('resize',placeModeBar);
  showLayouts();showFilters();showFrames();render();refreshPreviews(true);
})();