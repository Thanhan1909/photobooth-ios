'use strict';
(() => {
  const $=id=>document.getElementById(id);
  const video=$('camera'), snapshot=$('snapshot'),empty=$('empty'),status=$('status');
  const start=$('start'),flip=$('flip'),shoot=$('shoot'),retake=$('retake'),download=$('download'),alert=$('security');
  const engine=window.PhotoboothFilters;
  if(!engine){status.textContent='Không tải được bộ lọc';return;}
  let stream=null,facing='user',filter=engine.presets[0],capture=null,category='all',busy=false;
  const secure=window.isSecureContext && typeof navigator.mediaDevices?.getUserMedia==='function';
  const setStatus=s=>{status.textContent=s;};
  function group(p){
    if(['none','color','cool','warm','grayscale','soft-portrait','everglow','pink','washed','summer','aqua','green','blue','sepia'].includes(p.id))return 'portrait';
    if(['antique','retro','vintage','polaroid','kodachrome','technicolor','cookie','brownie','pinhole','clarendon','juno','lark','reyes','crema','aden','ludwig'].includes(p.id))return 'film';
    return 'creative';
  }
  function showFilters(){
    const box=$('filters');box.replaceChildren();
    for(const preset of engine.presets){
      if(category!=='all'&&group(preset)!==category)continue;
      const button=document.createElement('button');button.type='button';
      button.className='filter-option'+(preset.id===filter.id?' active':'');
      button.setAttribute('aria-pressed',String(preset.id===filter.id));
      button.dataset.value=preset.id;
      const image=document.createElement('span');image.className='filter-preview';
      image.style.filter=preset.css;image.textContent='✿';
      const check=document.createElement('span');check.className='check';check.textContent='✓';
      const label=document.createElement('span');label.className='filter-label';label.textContent=preset.label;
      button.append(image,check,label);
      button.addEventListener('click',()=>{
        filter=preset;video.style.filter=filter.css;
        showFilters();
        if(capture)renderCapture();
      });
      box.appendChild(button);
    }
  }
  document.querySelectorAll('.chip').forEach(b=>b.addEventListener('click',()=>{
    category=b.dataset.category;
    document.querySelectorAll('.chip').forEach(c=>c.classList.toggle('active',c===b));
    showFilters();
  }));
  function stopCamera(){if(stream)stream.getTracks().forEach(track=>track.stop());stream=null;video.srcObject=null;}
  async function openCamera(){
    if(!secure){alert.hidden=false;setStatus('Safari không cho mở camera live qua HTTP. Cần HTTPS tin cậy.');return;}
    if(busy)return;
    busy=true;start.disabled=true;
    stopCamera();
    try{
      stream=await navigator.mediaDevices.getUserMedia({audio:false,video:{facingMode:{ideal:facing},width:{ideal:1280},height:{ideal:960}}});
      video.srcObject=stream;
      await video.play();
      video.style.display='block';video.style.filter=filter.css;
      video.classList.toggle('mirror',facing==='user');
      snapshot.style.display='none';empty.hidden=true;capture=null;
      start.hidden=true;retake.hidden=true;shoot.disabled=false;flip.disabled=false;download.disabled=true;
      alert.hidden=true;setStatus('Camera đã mở. Chọn filter, rồi bấm Chụp ảnh.');
    }catch(e){
      setStatus('Không mở được camera: '+(e.name||'Error')+' — '+(e.message||'kiểm tra quyền Camera trong Safari.'));
      alert.hidden=!(e.name==='NotAllowedError');
    }finally{busy=false;start.disabled=false;}
  }
  function renderCapture(){
    if(!capture)return;
    try{
      engine.apply(snapshot,capture,filter);
      snapshot.style.display='block';video.style.display='none';
      download.disabled=false;
    }catch(e){setStatus('Lỗi xử lý filter: '+(e.message||e));download.disabled=true;}
  }
  function takePhoto(){
    if(!stream||!video.videoWidth){setStatus('Camera chưa sẵn sàng.');return;}
    const scale=Math.min(1,1600/Math.max(video.videoWidth,video.videoHeight));
    const w=Math.max(1,Math.round(video.videoWidth*scale)),h=Math.max(1,Math.round(video.videoHeight*scale));
    const raw=document.createElement('canvas');raw.width=w;raw.height=h;
    const ctx=raw.getContext('2d');
    if(facing==='user'){ctx.translate(w,0);ctx.scale(-1,1);}
    ctx.drawImage(video,0,0,w,h);
    capture=raw;stopCamera();
    shoot.disabled=true;flip.disabled=true;retake.hidden=false;renderCapture();
    setStatus('Đã chụp. Bạn có thể đổi filter hoặc Download ảnh.');
  }
  async function savePhoto(){
    if(!capture)return;
    download.disabled=true;
    try{
      const output=document.createElement('canvas');engine.apply(output,capture,filter);
      const blob=await new Promise((resolve,reject)=>output.toBlob(v=>v?resolve(v):reject(Error('Không tạo được ảnh')),'image/jpeg',.94));
      const url=URL.createObjectURL(blob),link=document.createElement('a');
      link.href=url;link.download='bloombooth-'+Date.now()+'.jpg';
      document.body.appendChild(link);link.click();link.remove();
      setStatus('Ảnh đã sẵn sàng. Trên Safari: chọn Chia sẻ → Lưu vào Ảnh nếu cần.');
      setTimeout(()=>URL.revokeObjectURL(url),60000);
    }catch(e){setStatus('Lỗi tải ảnh: '+e.message);}finally{download.disabled=false;}
  }
  start.addEventListener('click',openCamera);
  flip.addEventListener('click',()=>{facing=facing==='user'?'environment':'user';openCamera();});
  shoot.addEventListener('click',takePhoto);
  retake.addEventListener('click',()=>{capture=null;download.disabled=true;openCamera();});
  download.addEventListener('click',savePhoto);
  window.addEventListener('pagehide',stopCamera);
  if(!secure){alert.hidden=false;setStatus('Camera live bị chặn trên HTTP. Vui lòng dùng HTTPS.');}
  showFilters();
})();