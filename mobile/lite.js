'use strict';
(() => {
  const $=id=>document.getElementById(id);
  const video=$('camera'), snapshot=$('snapshot'), overlay=$('frameOverlay');
  const empty=$('empty'),status=$('status'),start=$('start'),flip=$('flip');
  const shoot=$('shoot'),retake=$('retake'),download=$('download'),security=$('security');
  const filterEngine=window.PhotoboothFilters,frameEngine=window.BloomFrames;
  if(!filterEngine||!frameEngine){status.textContent='Thiếu thư viện bộ lọc hoặc khung.';return;}
  let stream=null,facing='user',filter=filterEngine.presets[0],frame=frameEngine.frames[0],capture=null,category='all',busy=false;
  let thumbTimer=null,lastThumb='',latestSource=null;
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
    ctx.restore();
    return true;
  }
  function drawDefaultSample(ctx,w,h){
    const g=ctx.createLinearGradient(0,0,w,h);
    g.addColorStop(0,'#f1dacb');g.addColorStop(.55,'#d3e3d9');g.addColorStop(1,'#a6c3cb');
    ctx.fillStyle=g;ctx.fillRect(0,0,w,h);
    ctx.fillStyle='#f4b6a5';ctx.beginPath();ctx.ellipse(w*.5,h*.39,w*.22,h*.25,0,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#51404c';ctx.beginPath();ctx.ellipse(w*.5,h*.28,w*.245,h*.145,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#9875a4';ctx.beginPath();ctx.ellipse(w*.5,h*.94,w*.48,h*.33,0,0,Math.PI*2);ctx.fill();
  }
  function buildSample(){
    const sample=document.createElement('canvas');sample.width=144;sample.height=180;
    const ctx=sample.getContext('2d');
    if(capture){drawCover(ctx,capture,144,180);}
    else if(stream&&video.readyState>=2&&video.videoWidth){drawCover(ctx,video,144,180,facing==='user');}
    else drawDefaultSample(ctx,144,180);
    return sample;
  }
  function thumbnails(){
    const sample=buildSample();
    latestSource=sample;
    let data;try{data=sample.toDataURL('image/jpeg',.75);}catch{return;}
    if(data!==lastThumb){lastThumb=data;
      document.querySelectorAll('.filter-preview-image').forEach(img=>{img.src=data;});
    }
    document.querySelectorAll('.frame-preview').forEach(node=>{
      const ctx=node.getContext('2d');
      ctx.clearRect(0,0,node.width,node.height);
      drawCover(ctx,sample,node.width,node.height);
      frameEngine.draw(ctx,node.width,node.height,node.dataset.frame);
    });
  }
  function showFilters(){
    const box=$('filters');box.replaceChildren();
    for(const preset of filterEngine.presets){
      if(category!=='all'&&group(preset)!==category)continue;
      const button=document.createElement('button');
      button.className='filter-option'+(preset.id===filter.id?' active':'');
      button.type='button';button.dataset.value=preset.id;
      button.setAttribute('aria-pressed',String(preset.id===filter.id));
      const image=document.createElement('img');
      image.className='filter-preview filter-preview-image';image.alt='Ảnh mẫu filter '+preset.label;
      image.style.filter=preset.css;
      if(lastThumb)image.src=lastThumb;
      const check=document.createElement('span');check.className='check';check.textContent='✓';
      const name=document.createElement('span');name.className='filter-label';name.textContent=preset.label;
      button.append(image,check,name);
      button.addEventListener('click',()=>{
        filter=preset;video.style.filter=filter.css;
        showFilters();
        if(capture)renderCapture();else drawFrameOverlay();
        thumbnails();
      });
      box.appendChild(button);
    }
  }
  function showFrames(){
    const box=$('frames');box.replaceChildren();
    for(const preset of frameEngine.frames){
      const button=document.createElement('button');
      button.className='filter-option'+(preset.id===frame.id?' active':'');
      button.type='button';button.dataset.value=preset.id;
      button.setAttribute('aria-pressed',String(preset.id===frame.id));
      const image=document.createElement('canvas');
      image.className='filter-preview frame-preview';image.width=120;image.height=150;
      image.dataset.frame=preset.id;
      const check=document.createElement('span');check.className='check';check.textContent='✓';
      const name=document.createElement('span');name.className='filter-label';name.textContent=preset.label;
      button.append(image,check,name);
      button.addEventListener('click',()=>{
        frame=preset;showFrames();drawFrameOverlay();
        if(capture)renderCapture();
        thumbnails();
      });
      box.appendChild(button);
    }
  }
  document.querySelectorAll('.editor-tab').forEach(tab=>tab.addEventListener('click',()=>{
    const onFrame=tab.dataset.editor==='frame';
    $('filterPanel').hidden=onFrame;$('framePanel').hidden=!onFrame;
    document.querySelectorAll('.editor-tab').forEach(b=>{
      const active=b===tab;b.classList.toggle('active',active);
      b.setAttribute('aria-selected',String(active));
    });
    thumbnails();
  }));
  document.querySelectorAll('.chip').forEach(b=>b.addEventListener('click',()=>{
    category=b.dataset.category;
    document.querySelectorAll('.chip').forEach(c=>c.classList.toggle('active',c===b));
    showFilters();thumbnails();
  }));
  function drawFrameOverlay(){
    overlay.width=400;overlay.height=500;
    const ctx=overlay.getContext('2d');
    ctx.clearRect(0,0,400,500);frameEngine.draw(ctx,400,500,frame.id);
    overlay.style.display=stream&&frame.id!=='none'?'block':'none';
  }
  function stopCamera(){
    if(stream)stream.getTracks().forEach(track=>track.stop());
    stream=null;video.srcObject=null;
    if(thumbTimer){clearInterval(thumbTimer);thumbTimer=null;}
  }
  async function openCamera(){
    if(!secure){security.hidden=false;setStatus('Safari yêu cầu HTTPS tin cậy để mở camera.');return;}
    if(busy)return;
    busy=true;start.disabled=true;stopCamera();
    try{
      stream=await navigator.mediaDevices.getUserMedia({
        audio:false,video:{facingMode:{ideal:facing},width:{ideal:1280},height:{ideal:960}}
      });
      video.srcObject=stream;await video.play();
      video.style.display='block';video.style.filter=filter.css;
      video.classList.toggle('mirror',facing==='user');
      snapshot.style.display='none';empty.hidden=true;capture=null;
      start.hidden=true;retake.hidden=true;shoot.disabled=false;flip.disabled=false;download.disabled=true;
      security.hidden=true;drawFrameOverlay();thumbnails();
      thumbTimer=setInterval(()=>{if(stream&&document.visibilityState!=='hidden')thumbnails();},1450);
      setStatus('Ảnh mẫu cập nhật theo camera. Chọn filter và khung, sau đó chụp.');
    }catch(e){
      setStatus('Không mở được camera: '+(e.name||'Error')+' — '+(e.message||'kiểm tra quyền Camera trong Safari.'));
      security.hidden=!(e.name==='NotAllowedError');
    }finally{busy=false;start.disabled=false;}
  }
  function renderCapture(){
    if(!capture)return;
    try{
      filterEngine.apply(snapshot,capture,filter);
      frameEngine.draw(snapshot.getContext('2d'),snapshot.width,snapshot.height,frame.id);
      snapshot.style.display='block';video.style.display='none';overlay.style.display='none';
      download.disabled=false;
      thumbnails();
    }catch(e){setStatus('Lỗi xử lý filter hoặc khung: '+(e.message||e));download.disabled=true;}
  }
  function takePhoto(){
    if(!stream||!video.videoWidth){setStatus('Camera chưa sẵn sàng.');return;}
    const raw=document.createElement('canvas');raw.width=960;raw.height=1200;
    drawCover(raw.getContext('2d'),video,960,1200,facing==='user');
    capture=raw;stopCamera();
    shoot.disabled=true;flip.disabled=true;retake.hidden=false;
    renderCapture();
    setStatus('Đã chụp. Bạn vẫn có thể đổi filter hoặc khung và xem kết quả ngay.');
  }
  async function savePhoto(){
    if(!capture)return;
    download.disabled=true;
    try{
      const output=document.createElement('canvas');
      filterEngine.apply(output,capture,filter);
      frameEngine.draw(output.getContext('2d'),output.width,output.height,frame.id);
      const blob=await new Promise((resolve,reject)=>output.toBlob(
        v=>v?resolve(v):reject(Error('Không tạo được ảnh')),'image/jpeg',.94
      ));
      const url=URL.createObjectURL(blob),link=document.createElement('a');
      link.href=url;link.download='bloombooth-'+Date.now()+'.jpg';
      document.body.appendChild(link);link.click();link.remove();
      setStatus('Ảnh có filter và khung đã sẵn sàng. Safari: Chia sẻ → Lưu vào Ảnh.');
      setTimeout(()=>URL.revokeObjectURL(url),60000);
    }catch(e){setStatus('Lỗi tải ảnh: '+e.message);}finally{download.disabled=false;}
  }
  start.addEventListener('click',openCamera);
  flip.addEventListener('click',()=>{facing=facing==='user'?'environment':'user';openCamera();});
  shoot.addEventListener('click',takePhoto);
  retake.addEventListener('click',()=>{capture=null;download.disabled=true;openCamera();});
  download.addEventListener('click',savePhoto);
  window.addEventListener('pagehide',stopCamera);
  if(!secure){security.hidden=false;setStatus('Camera live bị chặn trên HTTP. Vui lòng dùng HTTPS.');}
  showFilters();showFrames();thumbnails();
})();