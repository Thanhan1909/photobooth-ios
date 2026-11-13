'use strict';
/**
 * Dedicated offline editor. Sources are canvases or user-selected File images.
 * Layout geometry is template-owned and is shared by preview and final export.
 * No image upload or network request is performed.
 */
(() => {
  const get=id=>document.getElementById(id);
  const catalog=window.BloomLayoutCatalog;
  const studio=window.BloomStudio;
  const effects=window.PhotoboothFilters;
  if(!catalog||!studio||!effects)return;
  const canvas=get('editCanvas'),ctx=canvas?.getContext('2d');
  if(!canvas||!ctx)return;
  const state={
    sources:[],selected:[],count:3,template:catalog.templates[0],
    rects:catalog.slots(catalog.templates[0],3),frame:studio.frames[0],
    filter:effects.presets[0],overlay:null,backgroundImage:null,drag:null,activeSlot:0,fit:'contain',
    dirty:true,cameraStream:null,cameraFacing:'user',cameraBusy:false,cameraAnimation:0
  };
  const srcCards=get('editorSources'),chosenCards=get('editorChosen');
  const layouts=get('editorTemplates');
  const label=get('editorStatus');
  const stateInfo=get('editorSelectionState');
  const saveButton=get('editorSave');
  const showStatus=message=>{label.textContent=message;};
  const cameraVideo=get('editorCameraVideo');
  function updateCameraControls(){
    const live=Boolean(state.cameraStream);
    get('editorCameraStart').disabled=state.cameraBusy;
    get('editorCameraStart').hidden=live;
    get('editorCameraCapture').disabled=!live||!cameraVideo.videoWidth;
    get('editorCameraCapture').textContent='● Chụp vào ô '+(state.activeSlot+1)+'/'+state.count;
    get('editorCameraFlip').disabled=!live;
    get('editorCameraStop').hidden=!live;
    get('editorWorkspace').classList.toggle('editor-camera-active',live);
  }
  function stopCamera(){
    if(state.cameraAnimation)cancelAnimationFrame(state.cameraAnimation);
    state.cameraAnimation=0;
    if(state.cameraStream){
      state.cameraStream.getTracks().forEach(track=>track.stop());
      state.cameraStream=null;
    }
    cameraVideo.srcObject=null;
    updateCameraControls();
    paint();
  }
  let lastPreviewPaint=0;
  function cameraLoop(timestamp){
    if(!state.cameraStream)return;
    if(!get('editorWorkspace').hidden&&cameraVideo.videoWidth&&timestamp-lastPreviewPaint>95){
      lastPreviewPaint=timestamp;
      renderTo(canvas,false);
    }
    state.cameraAnimation=requestAnimationFrame(cameraLoop);
  }
  async function openEditorCamera(){
    if(state.cameraBusy)return;
    if(!navigator.mediaDevices?.getUserMedia||!window.isSecureContext){
      showStatus('Camera cần HTTPS hoặc ứng dụng IPA iOS.');
      return;
    }
    state.cameraBusy=true;
    try{
      if(state.cameraStream)stopCamera();
      const stream=await navigator.mediaDevices.getUserMedia({
        audio:false,video:{facingMode:{ideal:state.cameraFacing},
          width:{ideal:1920},height:{ideal:1440}}
      });
      state.cameraStream=stream;
      cameraVideo.srcObject=stream;
      await cameraVideo.play();
      updateCameraControls();
      cameraLoop();
      showStatus('Camera đang hiển thị trực tiếp trong ô '+(state.activeSlot+1)+
        '. Chọn khung khác vẫn giữ camera.');
    }catch(error){
      stopCamera();
      showStatus('Không thể mở camera: '+(error?.message||error));
    }finally{state.cameraBusy=false;updateCameraControls();}
  }
  function captureIntoSelectedSlot(){
    if(!state.cameraStream||!cameraVideo.videoWidth)return;
    const video=cameraVideo;
    const scale=Math.min(1,2200/Math.max(video.videoWidth,video.videoHeight));
    const shot=document.createElement('canvas');
    shot.width=Math.round(video.videoWidth*scale);
    shot.height=Math.round(video.videoHeight*scale);
    const c=shot.getContext('2d');
    if(state.cameraFacing==='user'){
      c.translate(shot.width,0);c.scale(-1,1);
    }
    c.drawImage(video,0,0,shot.width,shot.height);
    const target=state.activeSlot;
    state.sources.push({img:shot,name:'Camera '+(state.sources.length+1)});
    state.selected[target]=state.sources.length-1;
    state.activeSlot=(target+1)%state.count;
    refreshSources();
    paint();
    showStatus('Đã chụp ô '+(target+1)+'. Tiếp theo: ô '+(state.activeSlot+1)+'.');
  }

  function dimensions(){
    const ratio=state.backgroundImage?.width&&state.backgroundImage?.height
      ?state.backgroundImage.width/state.backgroundImage.height:(state.template.ratio||.5);
    const w=1200,h=Math.max(1400,Math.round(w/ratio));
    return {w,h};
  }
  function usableShots(){
    return Array.from({length:state.count},(_,i)=>state.sources[state.selected[i]]?.img||null);
  }
  function drawImageFitted(image,rect){
    if(!image)return;
    const sw=image.width||image.naturalWidth,sh=image.height||image.naturalHeight;
    if(!sw||!sh)return;
    const {x,y,w,h}=rect;
    const X=x*canvas.width,Y=y*canvas.height,W=w*canvas.width,H=h*canvas.height;
    ctx.save();
    ctx.beginPath();ctx.roundRect(X,Y,W,H,Math.min(W,H)*.06);ctx.clip();
    ctx.fillStyle='#ffffff';ctx.fillRect(X,Y,W,H);
    const contain=Math.min(W/sw,H/sh),cover=Math.max(W/sw,H/sh);
    const fillScale=state.fit==='cover'?cover:contain;
    if(state.fit!=='cover'){
      ctx.save();ctx.globalAlpha=.25;
      ctx.drawImage(image,X+(W-sw*cover)/2,Y+(H-sh*cover)/2,sw*cover,sh*cover);
      ctx.restore();
    }
    ctx.drawImage(image,X+(W-sw*fillScale)/2,Y+(H-sh*fillScale)/2,sw*fillScale,sh*fillScale);
    ctx.restore();
  }
  function renderTo(target,exportImage=false){
    const c=target.getContext('2d'),w=target.width,h=target.height;
    // Use target-specific canvas to ensure saved JPEG equals what preview shows.
    const imageSources=usableShots();
    if(state.backgroundImage?.width){
      c.drawImage(state.backgroundImage,0,0,w,h);
    }else{
      catalog.drawBackground(c,w,h,state.template);
    }
    if(!state.backgroundImage&&state.frame.id!=='plain'){
      // Decorative artwork never draws on top of the subject photos.
      window.BloomFrameArt.draw(c,w,h,state.frame);
    }
    state.rects.forEach((r,i)=>{
      const X=r.x*w,Y=r.y*h,W=r.w*w,H=r.h*h;
      c.save();c.fillStyle='#fffdfa';c.shadowColor='#664c5535';
      c.shadowBlur=w*.014;c.shadowOffsetY=w*.008;
      catalog.slotShape(c,X-w*.004,Y-w*.004,W+w*.008,H+w*.008,state.template);c.fill();
      c.restore();
      const live=Boolean(!exportImage&&state.cameraStream&&cameraVideo.videoWidth&&state.activeSlot===i);
      let image=imageSources[i];
      if(live){
        // Small intermediate buffer keeps the iPhone preview responsive.
        const temp=document.createElement('canvas');
        temp.width=480;temp.height=Math.max(1,Math.round(480*cameraVideo.videoHeight/cameraVideo.videoWidth));
        const vctx=temp.getContext('2d');
        if(state.cameraFacing==='user'){
          vctx.translate(temp.width,0);vctx.scale(-1,1);
        }
        vctx.drawImage(cameraVideo,0,0,temp.width,temp.height);
        image=temp;
      }
      if(image){
        if(!window.BloomEditorFilterCache)window.BloomEditorFilterCache=new WeakMap();
        let cache=live?null:window.BloomEditorFilterCache.get(image);
        if(!cache||cache.id!==state.filter.id){
          const filtered=document.createElement('canvas');
          effects.apply(filtered,image,state.filter);
          cache={id:state.filter.id,filtered};
          if(!live)window.BloomEditorFilterCache.set(image,cache);
        }
        image=cache.filtered;
        const sw=image.width,sh=image.height,contain=Math.min(W/sw,H/sh),cover=Math.max(W/sw,H/sh);
        const scale=state.fit==='cover'?cover:contain;
        c.save();catalog.slotShape(c,X,Y,W,H,state.template);c.clip();
        c.fillStyle='#fffdf9';c.fillRect(X,Y,W,H);
        if(state.fit!=='cover'){
          c.globalAlpha=.20;
          c.drawImage(image,X+(W-sw*cover)/2,Y+(H-sh*cover)/2,sw*cover,sh*cover);
          c.globalAlpha=1;
        }
        c.drawImage(image,X+(W-sw*scale)/2,Y+(H-sh*scale)/2,sw*scale,sh*scale);
        c.restore();
      }else{
        c.save();c.fillStyle='#fcf7f5';catalog.slotShape(c,X,Y,W,H,state.template);c.fill();
        c.fillStyle='#a18e97';c.textAlign='center';
        c.font='bold '+Math.max(12,Math.round(w*.05))+'px Arial';
        c.fillText(String(i+1).padStart(2,'0'),X+W/2,Y+H/2);
        c.restore();
      }
      c.save();c.strokeStyle=state.template.accent;c.lineWidth=w*.003;
      catalog.slotShape(c,X,Y,W,H,state.template);c.stroke();
      if(!exportImage&&state.activeSlot===i){
        c.setLineDash([w*.009,w*.006]);c.strokeStyle='#c64775';c.lineWidth=w*.008;
        c.strokeRect(X-w*.006,Y-w*.006,W+w*.012,H+w*.012);
      }
      c.restore();
    });
    // A licensed/user-provided transparent overlay can be drawn above the photos.
    if(state.overlay?.width)c.drawImage(state.overlay,0,0,w,h);
  }
  function paint(){
    const {w,h}=dimensions();
    canvas.width=420;canvas.height=Math.round(h*canvas.width/w);
    canvas.style.aspectRatio=w+'/'+h;
    renderTo(canvas,false);
    updateControls();
  }
  function addSource(image,name){
    state.sources.push({img:image,name:name||'Ảnh '+(state.sources.length+1)});
    if(state.selected.length<state.count)state.selected.push(state.sources.length-1);
    refreshSources();paint();
  }
  function updateControls(){
    stateInfo.textContent='Đã chọn '+state.selected.length+'/'+state.count+
      ' ảnh · Kho '+state.sources.length+' ảnh';
    saveButton.disabled=state.selected.length!==state.count||
      state.selected.some(i=>!state.sources[i]);
    const thumb=get('editorSizeSlider');thumb.disabled=state.rects.length===0;
    const slots=chosenCards.querySelectorAll('.editor-slot-card');
    slots.forEach((btn,i)=>btn.classList.toggle('active',i===state.activeSlot));
  }
  function selectSource(index){
    if(state.activeSlot>=0){
      // Replace a specific slot, preserve order and allow photo reuse for collages.
      state.selected[state.activeSlot]=index;
      state.activeSlot=(state.activeSlot+1)%state.count;
    }else if(state.selected.length<state.count)state.selected.push(index);
    refreshSources();paint();
  }
  function refreshSources(){
    srcCards.replaceChildren();
    state.sources.forEach((s,i)=>{
      const b=document.createElement('button');b.type='button';b.className='source-card';
      const im=document.createElement('img');im.alt=s.name;
      try{im.src=s.img.toDataURL?.('image/jpeg',.60)||s.img.src;}catch{}
      const span=document.createElement('span');span.textContent=(i+1)+'. '+s.name;
      b.append(im,span);b.addEventListener('click',()=>selectSource(i));
      srcCards.append(b);
    });
    chosenCards.replaceChildren();
    for(let i=0;i<state.count;i++){
      const b=document.createElement('button');b.type='button';
      b.className='editor-slot-card'+(state.activeSlot===i?' active':'');
      b.textContent='Ô '+(i+1)+' '+(state.selected[i]===undefined?'(trống)':'✓');
      b.addEventListener('click',()=>{state.activeSlot=i;paint();});
      chosenCards.append(b);
    }
  }
  function chooseTemplate(id){
    const t=catalog.templates.find(x=>x.id===id);
    if(!t)return;
    state.template=t;
    state.rects=catalog.slots(t,state.count);
    state.activeSlot=0;drawTemplateGallerySelection();paint();updateCameraControls();
    showStatus('Đã chọn '+t.label+'. Bố cục thay đổi ngay, giữ nguyên ảnh đã chọn.');
  }
  function drawTemplateGallerySelection(){
    layouts.querySelectorAll('[data-template]').forEach(button=>{
      button.classList.toggle('selected',button.dataset.template===state.template.id);
      button.setAttribute('aria-pressed',String(button.dataset.template===state.template.id));
    });
  }
  function drawGallery(){
    layouts.replaceChildren();
    catalog.templates.forEach(t=>{
      const b=document.createElement('button');b.type='button';
      b.className='editor-template-item';b.dataset.template=t.id;
      const c=document.createElement('canvas');c.width=110;c.height=Math.round(110/t.ratio);
      catalog.drawBackground(c.getContext('2d'),c.width,c.height,t);
      const rects=catalog.slots(t,state.count);
      const cc=c.getContext('2d');cc.fillStyle='#ffffffcc';
      rects.forEach(r=>{cc.fillRect(r.x*c.width,r.y*c.height,r.w*c.width,r.h*c.height);
        cc.strokeStyle=t.accent;cc.strokeRect(r.x*c.width,r.y*c.height,r.w*c.width,r.h*c.height);});
      const text=document.createElement('span');text.textContent=t.label;
      b.append(c,text);b.addEventListener('click',()=>chooseTemplate(t.id));
      layouts.append(b);
    });
    drawTemplateGallerySelection();
  }
  function setCount(next){
    const n=Number(next);
    if(!Number.isInteger(n)||n<1||n>10)return;
    state.count=n;state.selected=state.selected.slice(0,n);
    state.rects=catalog.slots(state.template,n);state.activeSlot=0;updateCameraControls();
    refreshSources();drawGallery();paint();
  }
  const loadFile=file=>new Promise((resolve,reject)=>{
    if(!file.type.startsWith('image/')){reject(Error('Chỉ chấp nhận file ảnh'));return;}
    const reader=new FileReader();
    reader.onerror=()=>reject(Error('Không đọc được ảnh'));
    reader.onload=()=>{
      const img=new Image();
      img.onload=()=>{
        // Decode and resize in memory to avoid exhausting iPhone WKWebView RAM
        // when a user imports many high-resolution camera images.
        const max=2200,scale=Math.min(1,max/Math.max(img.naturalWidth,img.naturalHeight));
        const c=document.createElement('canvas');
        c.width=Math.max(1,Math.round(img.naturalWidth*scale));
        c.height=Math.max(1,Math.round(img.naturalHeight*scale));
        c.getContext('2d').drawImage(img,0,0,c.width,c.height);
        resolve(c);
      };
      img.onerror=()=>reject(Error('Ảnh không hợp lệ'));img.src=reader.result;
    };
    reader.readAsDataURL(file);
  });
  async function importFiles(files){
    const chosen=[...files].slice(0,50);
    for(const file of chosen){
      try{
        if(file.size>18*1024*1024){showStatus('Ảnh '+file.name+' vượt giới hạn 18 MB');continue;}
        const img=await loadFile(file);addSource(img,file.name);
      }catch(e){showStatus('Không thể thêm '+file.name+': '+e.message);}
    }
    paint();
  }
  async function loadOverlay(file){
    if(!file)return;
    try{
      if(file.type!=='image/png'&&file.type!=='image/webp')throw Error('Khung phải là PNG/WebP có nền trong suốt');
      const img=await loadFile(file);
      // Preview JPEGs from third-party galleries contain old subjects and
      // cannot serve as masks; only accept assets with genuine transparency.
      const sample=document.createElement('canvas');sample.width=36;sample.height=72;
      const c=sample.getContext('2d',{willReadFrequently:true});
      c.clearRect(0,0,36,72);c.drawImage(img,0,0,36,72);
      const rgba=c.getImageData(0,0,36,72).data;
      let transparent=0;
      for(let i=3;i<rgba.length;i+=4)if(rgba[i]<230)transparent++;
      if(transparent<80)throw Error('Khung này không có vùng trong suốt. Hãy dùng frame PNG tách nền, không phải ảnh xem trước JPG');
      state.overlay=img;paint();
      showStatus('Đã tải khung PNG trong suốt. Kéo các ô ảnh để căn vào đúng lỗ khung.');
    }catch(error){showStatus('Không thể dùng khung: '+error.message);}

  }
  async function save(){
    if(state.selected.length!==state.count)return;
    saveButton.disabled=true;
    try{
      const {w,h}=dimensions(),output=document.createElement('canvas');
      output.width=w;output.height=h;renderTo(output,true);
      const data=output.toDataURL('image/jpeg',.94);
      if(window.BloomNativePhotos?.isNative?.()){
        await window.BloomNativePhotos.savePhoto(data);
        showStatus('Đã lưu ảnh ghép vào Photos của iPhone.');
      }else{
        const blob=await new Promise((ok,fail)=>output.toBlob(b=>b?ok(b):fail(Error('Không thể xuất ảnh')),'image/jpeg',.94));
        const f=new File([blob],'BloomBooth-Edited.jpg',{type:'image/jpeg'});
        if(navigator.share&&(!navigator.canShare||navigator.canShare({files:[f]}))){
          await navigator.share({files:[f]});
          showStatus('Chọn “Lưu hình ảnh” trong bảng Chia sẻ.');
        }else{
          const u=URL.createObjectURL(blob),a=document.createElement('a');
          a.download=f.name;a.href=u;document.body.append(a);a.click();a.remove();
          setTimeout(()=>URL.revokeObjectURL(u),30000);
          showStatus('Đã xuất ảnh; để lưu Photos tự động hãy dùng app iOS.');
        }
      }
    }catch(e){if(e.name!=='AbortError')showStatus('Lỗi lưu ảnh: '+e.message);}
    finally{updateControls();}
  }
  const localLibrary=window.BloomTemplateLibrary;
  function openImageData(url){
    return new Promise((resolve,reject)=>{
      if(!url){resolve(null);return;}
      const img=new Image();
      img.onload=()=>resolve(img);
      img.onerror=()=>reject(Error('Không mở được hình ảnh của mẫu'));
      img.src=url;
    });
  }
  async function refreshPersonalTemplates(){
    const box=get('editorPersonalTemplates');
    box.replaceChildren();
    if(!localLibrary)return;
    try{
      const list=await localLibrary.list();
      if(!list.length){
        const note=document.createElement('small');
        note.textContent='Chưa có mẫu cá nhân. Hãy nhập nền hoặc PNG và bấm Lưu mẫu.';
        box.append(note);return;
      }
      for(const template of list.sort((a,b)=>b.savedAt-a.savedAt)){
        const row=document.createElement('div');row.className='personal-template-card';
        const select=document.createElement('button');
        select.type='button';select.className='btn btn-outline';
        select.textContent=template.name+' · '+template.count+' ô';
        select.addEventListener('click',()=>{void loadPersonalTemplate(template.id);});
        const del=document.createElement('button');
        del.type='button';del.className='btn btn-outline';del.textContent='Xóa';
        del.addEventListener('click',()=>{
          if(!window.confirm('Xóa mẫu '+template.name+' khỏi iPhone?'))return;
          void localLibrary.remove(template.id).then(refreshPersonalTemplates);
        });
        row.append(select,del);box.append(row);
      }
    }catch(error){showStatus('Không đọc được thư viện: '+error.message);}
  }
  async function savePersonalTemplate(){
    if(!localLibrary){showStatus('Thiếu thư viện lưu mẫu');return;}
    const name=get('editorTemplateName').value.trim()||'Khung cá nhân';
    const imageURL=image=>image?.toDataURL?
      image.toDataURL('image/png'):image?.src||null;
    try{
      const saved=await localLibrary.save({
        name,count:state.count,ratio:dimensions().w/dimensions().h,
        layoutId:state.template.id,
        rects:state.rects.map(rect=>({...rect})),
        background:state.backgroundImage
          ?(state.backgroundImage.toDataURL?.('image/jpeg',.9)||state.backgroundImage.src):null,
        overlay:imageURL(state.overlay)
      });
      await refreshPersonalTemplates();
      showStatus('Đã lưu mẫu '+name+' trong thư viện trên thiết bị. Mã: '+saved.slice(0,12));
    }catch(error){showStatus('Không lưu được mẫu: '+error.message);}
  }
  async function loadPersonalTemplate(id){
    try{
      const template=await localLibrary.get(id);
      if(!template)throw Error('Không tìm thấy mẫu');
      const layout=catalog.templates.find(t=>t.id===template.layoutId);
      if(!layout)throw Error('Bố cục không còn tồn tại');
      const [bg,overlay]=await Promise.all([
        openImageData(template.background),openImageData(template.overlay)
      ]);
      state.template=layout;state.count=template.count;
      state.selected=state.selected.slice(0,state.count);
      state.rects=template.rects.map(r=>({...r}));
      state.backgroundImage=bg;state.overlay=overlay;state.activeSlot=0;
      get('editorCount').value=String(state.count);
      get('editorTemplateName').value=template.name;
      refreshSources();drawGallery();paint();updateCameraControls();
      showStatus('Đã mở mẫu '+template.name+'. Có thể bật camera và chụp thẳng vào các ô.');
    }catch(error){showStatus('Lỗi mở mẫu: '+error.message);}
  }
  let pointer=null;
  canvas.addEventListener('pointerdown',e=>{
    const b=canvas.getBoundingClientRect(),x=(e.clientX-b.left)/b.width,y=(e.clientY-b.top)/b.height;
    for(let i=state.rects.length-1;i>=0;i--){
      const r=state.rects[i];
      if(x>=r.x&&x<=r.x+r.w&&y>=r.y&&y<=r.y+r.h){
        state.activeSlot=i;pointer={id:e.pointerId,index:i,dx:x-r.x,dy:y-r.y};
        canvas.setPointerCapture(e.pointerId);paint();return;
      }
    }
  });
  canvas.addEventListener('pointermove',e=>{
    if(!pointer||pointer.id!==e.pointerId)return;
    e.preventDefault();
    const b=canvas.getBoundingClientRect();
    const x=(e.clientX-b.left)/b.width-pointer.dx,y=(e.clientY-b.top)/b.height-pointer.dy;
    const r=state.rects[pointer.index];
    r.x=Math.min(.97-r.w,Math.max(.02,x));r.y=Math.min(.91-r.h,Math.max(.08,y));
    paint();
  });
  for(const type of ['pointerup','pointercancel'])canvas.addEventListener(type,()=>{pointer=null;});
  get('editorTemplateSave').addEventListener('click',()=>{void savePersonalTemplate();});
  get('editorCameraStart').addEventListener('click',()=>{void openEditorCamera();});
  get('editorCameraCapture').addEventListener('click',captureIntoSelectedSlot);
  get('editorCameraStop').addEventListener('click',stopCamera);
  get('editorCameraFlip').addEventListener('click',()=>{
    state.cameraFacing=state.cameraFacing==='user'?'environment':'user';
    void openEditorCamera();
  });
  window.addEventListener('pagehide',stopCamera);
  get('editorCount').addEventListener('change',e=>setCount(e.target.value));
  get('editorUpload').addEventListener('change',e=>{void importFiles(e.target.files);e.target.value='';});
  get('editorBackground').addEventListener('change',e=>{
    const file=e.target.files?.[0];
    if(file)void loadFile(file).then(image=>{
      state.backgroundImage=image;paint();
      showStatus('Đã nhập nền template. Kéo các ô ảnh trùng với từng vị trí trên mẫu.');
    }).catch(error=>showStatus('Lỗi nhập nền: '+error.message));
    e.target.value='';
  });
  get('editorClearBackground').addEventListener('click',()=>{
    state.backgroundImage=null;paint();
  });
  get('editorOverlay').addEventListener('change',e=>{
    const file=e.target.files?.[0];if(file)void loadOverlay(file);
  });
  get('editorClearOverlay').addEventListener('click',()=>{state.overlay=null;paint();});
  const themeSelect=get('editorTheme'),filterSelect=get('editorFilter');
  studio.frames.forEach(f=>{
    const option=document.createElement('option');option.value=f.id;option.textContent=f.label;themeSelect.append(option);
  });
  effects.presets.forEach(f=>{
    const option=document.createElement('option');option.value=f.id;option.textContent=f.label;filterSelect.append(option);
  });
  themeSelect.addEventListener('change',e=>{
    state.frame=studio.frames.find(f=>f.id===e.target.value)||studio.frames[0];
    paint();
  });
  filterSelect.addEventListener('change',e=>{
    state.filter=effects.presets.find(f=>f.id===e.target.value)||effects.presets[0];
    paint();
  });
  get('editorFit').addEventListener('change',e=>{state.fit=e.target.value;paint();});
  get('editorSizeSlider').addEventListener('input',e=>{
    const r=state.rects[state.activeSlot];if(!r)return;
    const factor=Number(e.target.value)/100;
    const base=catalog.slots(state.template,state.count)[state.activeSlot];
    const cx=r.x+r.w/2,cy=r.y+r.h/2;
    r.w=Math.min(.88,Math.max(.10,base.w*factor));r.h=Math.min(.76,Math.max(.07,base.h*factor));
    r.x=Math.max(.02,Math.min(.97-r.w,cx-r.w/2));
    r.y=Math.max(.08,Math.min(.91-r.h,cy-r.h/2));
    paint();
  });
  get('editorResetLayout').addEventListener('click',()=>chooseTemplate(state.template.id));
  get('editorSave').addEventListener('click',()=>{void save();});
  get('editorOpen').addEventListener('click',()=>{
    get('editorWorkspace').hidden=false;
    get('editorWorkspace').scrollIntoView({behavior:'smooth',block:'start'});
    paint();
  });
  get('editorClose').addEventListener('click',()=>{
    stopCamera();
    get('editorWorkspace').hidden=true;
  });
  get('editorFromCamera').addEventListener('click',()=>{
    const captured=window.BloomEditorBridge?.getCaptured?.()||[];
    for(const shot of captured)addSource(shot,'Ảnh chụp '+(state.sources.length+1));
    if(!captured.length)showStatus('Chưa có ảnh. Bạn có thể chụp hoặc tải ảnh từ Photos.');
    else showStatus('Đã đưa '+captured.length+' ảnh đã chụp vào trình chỉnh sửa.');
  });
  // Makes any photo count accessible; capture itself is controlled by the camera screen.
  window.BloomEditor=Object.freeze({addSource,importFiles,setCount,save,chooseTemplate});
  refreshSources();drawGallery();paint();updateCameraControls();
  void refreshPersonalTemplates();
})();
