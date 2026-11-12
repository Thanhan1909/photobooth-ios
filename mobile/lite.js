'use strict';
(() => {
  const $=id=>document.getElementById(id);
  const video=$('camera'),preview=$('snapshot'),empty=$('empty'),status=$('status');
  const start=$('start'),flip=$('flip'),shoot=$('shoot'),retake=$('retake');
  const reset=$('resetStrip'),download=$('download'),security=$('security'),counter=$('shotCounter');
  const filters=window.PhotoboothFilters,frames=window.BloomFrames,strip=window.BloomStrip;
  if(!filters||!frames||!strip){status.textContent='Thiếu thư viện xử lý ảnh.';return;}
  const shots=[null,null,null];
  let stream=null,facing='user',filter=filters.presets[0],frame=frames.frames[0];
  let active=0,category='all',busy=false,thumbTimer=null,lastThumb='';
  const secure=window.isSecureContext&&typeof navigator.mediaDevices?.getUserMedia==='function';
  const setStatus=s=>{status.textContent=s;};
  function group(p){
    if(['none','color','cool','warm','grayscale','soft-portrait','everglow','pink','washed','summer','aqua','green','blue','sepia'].includes(p.id))return 'portrait';
    if(['antique','retro','vintage','polaroid','kodachrome','technicolor','cookie','brownie','pinhole','clarendon','juno','lark','reyes','crema','aden','ludwig'].includes(p.id))return 'film';
    return 'creative';
  }
  function drawCover(ctx,source,w,h,mirror=false){
    const iw=source.videoWidth||source.width,ih=source.videoHeight||source.height;
    if(!iw||!ih)return false;
    const ratio=Math.max(w/iw,h/ih),sw=w/ratio,sh=h/ratio;
    const x=(iw-sw)/2,y=(ih-sh)/2;
    ctx.save();
    if(mirror){ctx.translate(w,0);ctx.scale(-1,1);}
    ctx.drawImage(source,x,y,sw,sh,0,0,w,h);
    ctx.restore();return true;
  }
  function sampleImage(){
    const sample=document.createElement('canvas');sample.width=144;sample.height=180;
    const ctx=sample.getContext('2d');
    const shot=shots[Math.max(0,active-1)]||shots[0];
    if(stream&&video.videoWidth)drawCover(ctx,video,144,180,facing==='user');
    else if(shot)drawCover(ctx,shot,144,180);
    else{
      const g=ctx.createLinearGradient(0,0,144,180);
      g.addColorStop(0,'#f4d6cc');g.addColorStop(1,'#b6d2c3');
      ctx.fillStyle=g;ctx.fillRect(0,0,144,180);
      ctx.fillStyle='#e3ac9d';ctx.beginPath();ctx.arc(72,69,32,0,Math.PI*2);ctx.fill();
      ctx.fillStyle='#846b8d';ctx.beginPath();ctx.ellipse(72,180,70,62,0,0,Math.PI*2);ctx.fill();
    }
    return sample;
  }
  function updateThumbnails(){
    const sample=sampleImage();let uri;
    try{uri=sample.toDataURL('image/jpeg',.7);}catch{return;}
    if(uri!==lastThumb){
      lastThumb=uri;
      document.querySelectorAll('.filter-preview-image').forEach(img=>{img.src=uri;});
    }
    document.querySelectorAll('.frame-preview').forEach(node=>{
      const ctx=node.getContext('2d'),w=node.width,h=node.height;
      ctx.clearRect(0,0,w,h);
      strip.draw(node,[sample,sample,sample],filter,node.dataset.frame,filters);
    });
  }
  function showFilters(){
    const box=$('filters');box.replaceChildren();
    for(const preset of filters.presets){
      if(category!=='all'&&group(preset)!==category)continue;
      const btn=document.createElement('button');
      btn.className='filter-option'+(preset.id===filter.id?' active':'');
      btn.type='button';btn.dataset.value=preset.id;btn.setAttribute('aria-pressed',String(preset.id===filter.id));
      const image=document.createElement('img');
      image.className='filter-preview filter-preview-image';image.alt='Ảnh mẫu '+preset.label;
      image.style.filter=preset.css;if(lastThumb)image.src=lastThumb;
      const label=document.createElement('span');label.className='filter-label';label.textContent=preset.label;
      const check=document.createElement('span');check.className='check';check.textContent='✓';
      btn.append(image,check,label);
      btn.addEventListener('click',()=>{filter=preset;video.style.filter=filter.css;showFilters();renderStrip();updateThumbnails();});
      box.appendChild(btn);
    }
  }
  function showFrames(){
    const box=$('frames');box.replaceChildren();
    for(const preset of frames.frames){
      const btn=document.createElement('button');
      btn.className='filter-option'+(preset.id===frame.id?' active':'');
      btn.type='button';btn.dataset.value=preset.id;btn.setAttribute('aria-pressed',String(preset.id===frame.id));
      const image=document.createElement('canvas');
      image.className='filter-preview frame-preview';image.width=120;image.height=300;image.dataset.frame=preset.id;
      const label=document.createElement('span');label.className='filter-label';label.textContent=preset.label;
      const check=document.createElement('span');check.className='check';check.textContent='✓';
      btn.append(image,check,label);
      btn.addEventListener('click',()=>{frame=preset;showFrames();renderStrip();updateThumbnails();});
      box.appendChild(btn);
    }
  }
  document.querySelectorAll('.editor-tab').forEach(tab=>tab.addEventListener('click',()=>{
    const onFrame=tab.dataset.editor==='frame';
    $('filterPanel').hidden=onFrame;$('framePanel').hidden=!onFrame;
    document.querySelectorAll('.editor-tab').forEach(b=>{
      const selected=b===tab;b.classList.toggle('active',selected);
      b.setAttribute('aria-selected',String(selected));
    });
    updateThumbnails();
  }));
  document.querySelectorAll('.chip').forEach(b=>b.addEventListener('click',()=>{
    category=b.dataset.category;document.querySelectorAll('.chip').forEach(c=>c.classList.toggle('active',c===b));
    showFilters();updateThumbnails();
  }));
  function currentSlot(){
    const rects=strip.layout(preview.width,preview.height).rects;
    return rects[Math.min(active,2)];
  }
  function positionVideo(){
    if(!stream||active>=3){video.style.display='none';return;}
    const {x,y,w,h}=currentSlot();
    video.style.left=(x/preview.width*100)+'%';
    video.style.top=(y/preview.height*100)+'%';
    video.style.width=(w/preview.width*100)+'%';
    video.style.height=(h/preview.height*100)+'%';
    video.style.display='block';
    video.style.filter=filter.css;
    video.classList.toggle('mirror',facing==='user');
  }
  function renderStrip(){
    preview.width=480;preview.height=1200;
    strip.draw(preview,shots,filter,frame.id,filters);
    preview.style.display='block';empty.hidden=true;
    counter.textContent=active+' / 3';
    shoot.textContent=active<3?'● Chụp ô '+(active+1)+'/3':'✓ Đã đủ 3 ảnh';
    shoot.disabled=active>=3||!stream;
    retake.hidden=active===0;reset.hidden=active===0;
    download.disabled=active!==3;
    positionVideo();
  }
  function stopCamera(){
    if(stream)stream.getTracks().forEach(track=>track.stop());
    stream=null;video.srcObject=null;
    if(thumbTimer){clearInterval(thumbTimer);thumbTimer=null;}
    video.style.display='none';
  }
  async function openCamera(){
    if(!secure){security.hidden=false;setStatus('Safari yêu cầu HTTPS tin cậy để mở camera.');return;}
    if(busy)return;
    busy=true;start.disabled=true;stopCamera();
    try{
      stream=await navigator.mediaDevices.getUserMedia({
        audio:false,video:{facingMode:{ideal:facing},width:{ideal:1920},height:{ideal:1440}}
      });
      video.srcObject=stream;await video.play();
      start.hidden=true;flip.disabled=false;
      security.hidden=true;renderStrip();updateThumbnails();
      thumbTimer=setInterval(()=>{if(stream&&document.visibilityState!=='hidden')updateThumbnails();},2200);
      setStatus('Mỗi lần chụp điền một ô. Chọn filter và khung, chụp đủ 3 ảnh để tải dải ảnh.');
    }catch(e){
      setStatus('Không mở được camera: '+(e.name||'Error')+' — '+(e.message||'kiểm tra quyền Camera.'));
      security.hidden=!(e.name==='NotAllowedError');
    }finally{busy=false;start.disabled=false;}
  }
  function takePhoto(){
    if(!stream||!video.videoWidth||active>=3){setStatus('Camera chưa sẵn sàng.');return;}
    const sourceWidth=video.videoWidth,sourceHeight=video.videoHeight;
    // Preserve full source aspect ratio: no hard-coded 960x1200 portrait stretching.
    const scale=Math.min(1,1920/Math.max(sourceWidth,sourceHeight));
    const raw=document.createElement('canvas');
    raw.width=Math.max(1,Math.round(sourceWidth*scale));
    raw.height=Math.max(1,Math.round(sourceHeight*scale));
    const ctx=raw.getContext('2d');
    if(facing==='user'){ctx.translate(raw.width,0);ctx.scale(-1,1);}
    ctx.drawImage(video,0,0,raw.width,raw.height);
    shots[active]=raw;active++;
    if(active===3){stopCamera();flip.disabled=true;}
    renderStrip();updateThumbnails();
    setStatus(active===3?'Đã đủ 3 ảnh. Có thể đổi filter/khung, sau đó Download.':'Đã chụp ô '+active+'/3. Tiếp tục chụp ô '+(active+1)+'/3.');
  }
  function retakeLast(){
    if(active===0)return;
    active--;shots[active]=null;
    renderStrip();updateThumbnails();
    if(stream){setStatus('Đã xóa ô '+(active+1)+'. Chụp lại ô này.');}
    else openCamera();
  }
  function resetStrip(){
    for(let i=0;i<3;i++)shots[i]=null;
    active=0;renderStrip();updateThumbnails();
    if(stream)setStatus('Đã làm lại dải ảnh. Bắt đầu từ ô 1/3.');
    else openCamera();
  }
  async function savePhoto(){
    if(active!==3)return;
    download.disabled=true;
    try{
      // Full-size portrait strip: 1200 x 3000, 3 individual uncropped images.
      const output=document.createElement('canvas');output.width=1200;output.height=3000;
      strip.draw(output,shots,filter,frame.id,filters);
      const blob=await new Promise((resolve,reject)=>output.toBlob(
        b=>b?resolve(b):reject(Error('Không thể tạo ảnh JPEG.')),'image/jpeg',.94));
      const url=URL.createObjectURL(blob),a=document.createElement('a');
      a.href=url;a.download='bloombooth-strip-3-'+Date.now()+'.jpg';
      document.body.appendChild(a);a.click();a.remove();
      setTimeout(()=>URL.revokeObjectURL(url),60000);
      setStatus('Đã xuất dải ảnh 1200 × 3000 px. Trên iPhone có thể chọn Chia sẻ → Lưu vào Ảnh.');
    }catch(e){setStatus('Lỗi tải ảnh: '+e.message);}finally{download.disabled=false;}
  }
  start.addEventListener('click',openCamera);
  flip.addEventListener('click',()=>{facing=facing==='user'?'environment':'user';openCamera();});
  shoot.addEventListener('click',takePhoto);
  retake.addEventListener('click',retakeLast);
  reset.addEventListener('click',resetStrip);
  download.addEventListener('click',savePhoto);
  window.addEventListener('pagehide',stopCamera);
  if(!secure){security.hidden=false;setStatus('Camera bị chặn qua HTTP. Vui lòng sử dụng HTTPS.');}
  showFilters();showFrames();renderStrip();updateThumbnails();
})();