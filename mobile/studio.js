'use strict';
(() => {
  const el = id => document.getElementById(id);
  const camera=el('camera'), preview=el('preview'), status=el('status'), placeholder=el('placeholder');
  const start=el('start'), switchBtn=el('switch'), shoot=el('shoot'), retake=el('retake');
  const download=el('download'), processing=el('processing'), engine=window.PhotoboothFilters;
  if(!engine){status.textContent='Không tải được thư viện bộ lọc.';return;}
  const backgrounds=[
    {id:'original',name:'Ảnh gốc',kind:'original',thumb:'linear-gradient(140deg,#ffddca,#f2e4d0)'},
    {id:'blur',name:'Xóa phông',kind:'blur',thumb:'linear-gradient(140deg,#e6dacf,#c4d2b6)'},
    {id:'rose',name:'Hồng pastel',kind:'rose',thumb:'linear-gradient(140deg,#fcd7dc,#ffc5b9)'},
    {id:'sky',name:'Trời xanh',kind:'sky',thumb:'linear-gradient(140deg,#9cd9f3,#f2fafa)'},
    {id:'lilac',name:'Lavender',kind:'lilac',thumb:'linear-gradient(140deg,#ded1fa,#fce0fa)'},
    {id:'mint',name:'Mint',kind:'mint',thumb:'linear-gradient(140deg,#b6e6ce,#effade)'},
    {id:'sunset',name:'Hoàng hôn',kind:'sunset',thumb:'linear-gradient(140deg,#f6c1a2,#ffdbce,#d1b3dd)'},
    {id:'studio',name:'Studio kem',kind:'studio',thumb:'linear-gradient(140deg,#f9f1e6,#e3d4c8)'},
    {id:'garden',name:'Vườn hoa',kind:'garden',thumb:'linear-gradient(140deg,#a7c9a5,#fbe1d6)'},
    {id:'night',name:'Đêm sao',kind:'night',thumb:'linear-gradient(140deg,#48587d,#b4a3c9)'},
    {id:'custom',name:'Nền của bạn',kind:'custom',thumb:'linear-gradient(140deg,#ddd0ee,#f2d8d0)'}
  ];
  const frames=[
    {id:'none',name:'Không khung'},
    {id:'polaroid',name:'Polaroid'},
    {id:'film',name:'Film strip'},
    {id:'rose',name:'Rosy'},
    {id:'botanical',name:'Botanical'},
    {id:'confetti',name:'Confetti'},
    {id:'stars',name:'Starlight'},
    {id:'love',name:'Sweetheart'},
    {id:'classic',name:'Classic'},
    {id:'magazine',name:'Magazine'},
    {id:'custom',name:'Khung riêng'}
  ];
  const state={filter:engine.presets[0],background:backgrounds[0],frame:frames[0],category:'all',captured:null,stream:null,facing:'user',mask:null,segmenter:null,segmentationPending:null,customBackground:null,customFrame:null,caption:'',edgeStrength:50,filterCache:null,filterCacheKey:null,renderTicket:0};
  const secureCamera=window.isSecureContext&&!!navigator.mediaDevices?.getUserMedia;
  const setStatus=s=>{status.textContent=s;};
  const clamp=(x,a,b)=>Math.min(b,Math.max(a,x));
  function filterCategory(p) {
    if(['none','color','cool','warm','grayscale','soft-portrait','everglow','pink','washed','summer','aqua','green','blue','sepia'].includes(p.id))return 'portrait';
    if(['antique','retro','vintage','polaroid','kodachrome','technicolor','cookie','brownie','pinhole','clarendon','juno','lark','reyes','crema','aden','ludwig'].includes(p.id))return 'film';
    return 'creative';
  }
  function fillList(container,items,kind){
    container.replaceChildren();
    for(const item of items){
      const btn=document.createElement('button');
      btn.className='option'+(state[kind]?.id===item.id?' active':'');
      btn.type='button';btn.dataset.value=item.id;btn.setAttribute('aria-pressed',String(state[kind]?.id===item.id));
      const image=document.createElement('span');image.className='option-preview';
      if(kind==='filter'){
        image.style.filter=item.css;
        image.textContent='✿';
      }else if(kind==='background'){
        image.style.background=item.thumb;image.textContent=item.id==='custom'?'＋':'✿';
      }else{
        const thumb=document.createElement('span');thumb.className='frame-thumbnail '+item.id;
        image.appendChild(thumb);
      }
      const check=document.createElement('span');check.className='option-check';check.textContent='✓';
      const name=document.createElement('span');name.className='option-label';name.textContent=item.label||item.name;
      btn.append(image,check,name);
      btn.addEventListener('click',()=>selectOption(kind,item));
      container.appendChild(btn);
    }
  }
  function redrawOptions(){
    const pool=state.category==='all'?engine.presets:engine.presets.filter(p=>filterCategory(p)===state.category);
    fillList(el('filterList'),pool,'filter');
    fillList(el('backgroundList'),backgrounds,'background');
    fillList(el('frameList'),frames,'frame');
    el('filterCount').textContent=engine.presets.length+' mẫu';
  }
  function selectOption(kind,item){
    if(kind==='background'&&item.id==='custom'&&!state.customBackground){el('customBackground').click();return;}
    if(kind==='frame'&&item.id==='custom'&&!state.customFrame){el('customFrame').click();return;}
    state[kind]=item;
    if(kind==='filter'){state.filterCache=null;state.filterCacheKey=null;camera.style.filter=item.css;}
    redrawOptions();
    if(kind==='background'&&item.id!=='original'&&state.captured) {
      requestSegmentation().then(()=>scheduleRender()).catch(e=>{
        setStatus('Chưa tách được nền: '+e.message+'. Vui lòng chọn ảnh đủ rõ.');
        state.background=backgrounds[0];redrawOptions();scheduleRender();
      });
    }else scheduleRender();
  }
  for(const tab of document.querySelectorAll('.tab')){
    tab.addEventListener('click',()=>{
      document.querySelectorAll('.tab').forEach(b=>{const on=b===tab;b.classList.toggle('active',on);b.setAttribute('aria-selected',String(on));});
      document.querySelectorAll('.panel').forEach(p=>{const on=p.dataset.panel===tab.dataset.tab;p.hidden=!on;p.classList.toggle('active',on);});
    });
  }
  document.querySelectorAll('.category').forEach(btn=>btn.addEventListener('click',()=>{
    state.category=btn.dataset.category;
    document.querySelectorAll('.category').forEach(b=>b.classList.toggle('active',b===btn));
    redrawOptions();
  }));
  function closeCamera(){
    if(state.stream)state.stream.getTracks().forEach(t=>t.stop());
    state.stream=null;camera.srcObject=null;
  }
  async function openCamera(){
    if(!secureCamera){setStatus('Camera trực tiếp cần HTTPS trên iPhone. Hãy dùng “Chụp bằng camera iPhone” hoặc chọn ảnh.');return;}
    start.disabled=true;closeCamera();
    try{
      state.stream=await navigator.mediaDevices.getUserMedia({audio:false,video:{facingMode:{ideal:state.facing},width:{ideal:1920},height:{ideal:1080}}});
      camera.srcObject=state.stream;await camera.play();
      camera.classList.toggle('mirror',state.facing==='user');
      camera.style.filter=state.filter.css;camera.style.display='block';preview.style.display='none';
      placeholder.hidden=true;state.captured=null;state.mask=null;state.filterCache=null;
      shoot.disabled=false;switchBtn.disabled=false;retake.hidden=true;start.hidden=true;
      download.disabled=true;setStatus('Camera đã mở. Chọn bộ lọc và nhấn Chụp ảnh để chỉnh phông nền, khung.');
    }catch(e){setStatus('Không mở được camera: '+(e.message||'Kiểm tra quyền Safari.'));}
    finally{start.disabled=false;}
  }
  function capture(){
    if(!state.stream||!camera.videoWidth){setStatus('Camera chưa sẵn sàng.');return;}
    const scale=Math.min(1,1600/Math.max(camera.videoWidth,camera.videoHeight));
    const w=Math.round(camera.videoWidth*scale),h=Math.round(camera.videoHeight*scale);
    const c=document.createElement('canvas');c.width=w;c.height=h;
    const ctx=c.getContext('2d');
    if(state.facing==='user'){ctx.translate(w,0);ctx.scale(-1,1);}
    ctx.drawImage(camera,0,0,w,h);
    acceptCaptured(c);
  }
  function acceptCaptured(c){
    closeCamera();state.captured=c;state.mask=null;state.filterCache=null;state.filterCacheKey=null;
    camera.style.display='none';preview.style.display='block';placeholder.hidden=true;
    start.hidden=true;retake.hidden=false;shoot.disabled=true;switchBtn.disabled=true;download.disabled=false;
    setStatus('Đã chụp ảnh. Hãy thử bộ lọc, đổi background và chọn khung.');
    if(state.background.id!=='original')requestSegmentation().then(scheduleRender).catch(e=>{state.background=backgrounds[0];redrawOptions();setStatus('Tách nền thất bại: '+e.message);scheduleRender();});
    scheduleRender();
  }
  function readImage(file,limit,callback){
    if(!file)return;
    if(!file.type.startsWith('image/')||file.size>limit*1024*1024){setStatus('File ảnh không hợp lệ hoặc vượt quá '+limit+' MB.');return;}
    const url=URL.createObjectURL(file),img=new Image();
    img.onload=()=>{URL.revokeObjectURL(url);callback(img);};
    img.onerror=()=>{URL.revokeObjectURL(url);setStatus('Không đọc được ảnh. Hãy dùng JPG hoặc PNG (nếu HEIC lỗi, đổi sang JPEG).');};
    img.src=url;
  }
  function captureFromFile(e){
    const file=e.target.files?.[0];e.target.value='';
    readImage(file,20,img=>{
      const scale=Math.min(1,1600/Math.max(img.naturalWidth,img.naturalHeight));
      const c=document.createElement('canvas');c.width=Math.round(img.naturalWidth*scale);c.height=Math.round(img.naturalHeight*scale);
      c.getContext('2d').drawImage(img,0,0,c.width,c.height);acceptCaptured(c);
    });
  }
  function busy(on){processing.hidden=!on;}
  async function requestSegmentation(){
    if(!state.captured)return;
    if(state.mask)return;
    if(state.segmentationPending)return state.segmentationPending;
    if(typeof window.SelfieSegmentation!=='function')throw Error('Thiếu mô hình AI. Kiểm tra kết nối hoặc tải lại trang.');
    busy(true);
    const source=state.captured;
    state.segmentationPending=(async()=>{
      const segmenter=state.segmenter||new window.SelfieSegmentation({locateFile:f=>'/mobile/vendor/mediapipe/'+f});
      if(!state.segmenter){segmenter.setOptions({modelSelection:1,selfieMode:false});state.segmenter=segmenter;}
      let resolveResult,rejectResult;
      const resultPromise=new Promise((resolve,reject)=>{resolveResult=resolve;rejectResult=reject;});
      segmenter.onResults(res=>{
        if(!res.segmentationMask){rejectResult(Error('Mô hình không trả về mặt nạ.'));return;}
        try{
          const mask=document.createElement('canvas');mask.width=source.width;mask.height=source.height;
          mask.getContext('2d').drawImage(res.segmentationMask,0,0,mask.width,mask.height);
          if(state.captured===source)state.mask=mask;
          resolveResult();
        }catch(e){rejectResult(e);}
      });
      try{await segmenter.send({image:source});await resultPromise;}catch(e){rejectResult(e);throw e;}
    })();
    try{await state.segmentationPending;}finally{state.segmentationPending=null;busy(false);}
  }
  function drawCover(ctx,image,x,y,w,h){
    const iw=image.width||image.naturalWidth,ih=image.height||image.naturalHeight;
    const ratio=Math.max(w/iw,h/ih),rw=iw*ratio,rh=ih*ratio;
    ctx.drawImage(image,x+(w-rw)/2,y+(h-rh)/2,rw,rh);
  }
  function gradient(ctx,w,h,stops){
    const g=ctx.createLinearGradient(0,0,w,h);
    stops.forEach(([position,color])=>g.addColorStop(position,color));
    ctx.fillStyle=g;ctx.fillRect(0,0,w,h);
  }
  function bloom(ctx,x,y,r,color,alpha=1){
    ctx.save();ctx.globalAlpha=alpha;ctx.fillStyle=color;
    for(let i=0;i<5;i++){const a=i*2*Math.PI/5;ctx.beginPath();ctx.ellipse(x+Math.cos(a)*r*.58,y+Math.sin(a)*r*.58,r*.48,r*.37,a,0,Math.PI*2);ctx.fill();}
    ctx.beginPath();ctx.arc(x,y,r*.24,0,Math.PI*2);ctx.fill();ctx.restore();
  }
  function drawBackground(ctx,w,h){
    const id=state.background.id;
    if(id==='custom'&&state.customBackground){drawCover(ctx,state.customBackground,0,0,w,h);return;}
    if(id==='blur'&&state.captured){ctx.save();ctx.filter='blur(32px) brightness(.93)';drawCover(ctx,state.captured,-50,-50,w+100,h+100);ctx.restore();return;}
    const palettes={rose:['#ffe7e8','#f4b6bc'],sky:['#bce6f8','#f6e9ea'],lilac:['#dcd0f8','#ffebf7'],mint:['#c8e9d6','#f4f5cf'],sunset:['#f4ab8b','#f6d5ba','#c6add4'],studio:['#fff9ef','#eadace'],garden:['#d6edc5','#b3d6c6','#f4ddd4'],night:['#26334e','#71638e']};
    const p=palettes[id]||palettes.studio;
    gradient(ctx,w,h,p.map((color,i)=>[i/(p.length-1),color]));
    if(id==='sky'){ctx.fillStyle='#ffffff99';for(const [x,y,r]of [[.2,.2,90],[.76,.29,130],[.45,.72,105]]){ctx.beginPath();ctx.ellipse(w*x,h*y,r,r*.45,0,0,Math.PI*2);ctx.fill();}}
    if(id==='sunset'){ctx.fillStyle='#ffe9bd88';ctx.beginPath();ctx.arc(w*.72,h*.27,w*.21,0,Math.PI*2);ctx.fill();}
    if(id==='garden'){for(let i=0;i<22;i++){const x=((i*137)%997)/997*w,y=((i*193)%991)/991*h;bloom(ctx,x,y,15+i%5*3,i%2?'#f4b5af':'#fff3d6',.45);}}
    if(id==='night'){ctx.fillStyle='#fff8e8';for(let i=0;i<70;i++){const x=((i*127)%991)/991*w,y=((i*173)%997)/997*h;ctx.beginPath();ctx.arc(x,y,i%7===0?2.5:1.2,0,Math.PI*2);ctx.fill();}}
  }
  function rounded(ctx,x,y,w,h,r){
    r=Math.min(r,w/2,h/2);
    ctx.beginPath();ctx.moveTo(x+r,y);ctx.lineTo(x+w-r,y);ctx.quadraticCurveTo(x+w,y,x+w,y+r);ctx.lineTo(x+w,y+h-r);ctx.quadraticCurveTo(x+w,y+h,x+w-r,y+h);ctx.lineTo(x+r,y+h);ctx.quadraticCurveTo(x,y+h,x,y+h-r);ctx.lineTo(x,y+r);ctx.quadraticCurveTo(x,y,x+r,y);ctx.closePath();
  }
  function drawFrame(ctx,w,h){
    const id=state.frame.id,caption=state.caption.trim();
    if(id==='none')return;
    ctx.save();
    if(id==='custom'&&state.customFrame){ctx.drawImage(state.customFrame,0,0,w,h);ctx.restore();return;}
    if(id==='polaroid'){
      ctx.fillStyle='#fffaf1';ctx.fillRect(0,0,w,h*.063);ctx.fillRect(0,0,w*.055,h);ctx.fillRect(w*.945,0,w*.055,h);ctx.fillRect(0,h*.84,w,h*.16);
      ctx.fillStyle='#8f7a80';ctx.font='italic '+Math.round(w*.04)+'px Georgia';ctx.textAlign='center';ctx.fillText(caption||'made with love ♡',w/2,h*.93,w*.83);
    }else if(id==='film'){
      ctx.fillStyle='#2d2a30';ctx.fillRect(0,0,w,h*.055);ctx.fillRect(0,h*.945,w,h*.055);
      ctx.fillRect(0,0,w*.10,h);ctx.fillRect(w*.90,0,w*.10,h);
      ctx.fillStyle='#f8edd9';for(let i=0;i<10;i++){const y=h*(.075+i*.086);ctx.fillRect(w*.024,y,w*.045,h*.035);ctx.fillRect(w*.931,y,w*.045,h*.035);}
    }else if(id==='rose'||id==='classic'){
      ctx.strokeStyle=id==='rose'?'#e3a0a0':'#c69e6a';ctx.lineWidth=w*.022;ctx.strokeRect(w*.028,h*.025,w*.944,h*.95);
      ctx.strokeStyle=id==='rose'?'#fae2df':'#f9e9cb';ctx.lineWidth=w*.010;ctx.strokeRect(w*.06,h*.052,w*.88,h*.896);
      for(const [x,y] of [[.07,.07],[.93,.07],[.07,.93],[.93,.93]])bloom(ctx,w*x,h*y,w*.037,id==='rose'?'#f5d1d4':'#fff1ca');
    }else if(id==='botanical'){
      ctx.strokeStyle='#688f7c';ctx.lineWidth=w*.023;ctx.strokeRect(w*.025,h*.024,w*.95,h*.952);
      for(let i=0;i<11;i++){const y=h*(.1+i*.08);bloom(ctx,w*.05,y,w*.022,i%2?'#f6dec8':'#dfeccf',.95);bloom(ctx,w*.95,h-y,w*.02,'#eee4d1',.9);}
    }else if(id==='confetti'||id==='stars'){
      ctx.strokeStyle=id==='stars'?'#e5d8fc':'#fff3d3';ctx.lineWidth=w*.035;ctx.strokeRect(w*.02,h*.016,w*.96,h*.968);
      const colors=id==='stars'?['#fff4c6','#fff','#e4b7fd']:['#d6a7b9','#f4c978','#c0d9cc','#fff'];
      for(let i=0;i<45;i++){const x=((i*41)%100)/100*w,y=((i*73+13)%100)/100*h;
        if(x>w*.16&&x<w*.84&&y>h*.13&&y<h*.87)continue;
        ctx.fillStyle=colors[i%colors.length];ctx.save();ctx.translate(x,y);ctx.rotate(i*.9);ctx.fillRect(-w*.004,-w*.015,w*.009,w*.029);ctx.restore();}
    }else if(id==='love'){
      ctx.strokeStyle='#f6b5bc';ctx.lineWidth=w*.045;rounded(ctx,w*.028,h*.02,w*.944,h*.96,w*.07);ctx.stroke();
      for(let i=0;i<8;i++){ctx.fillStyle='#f48da5';ctx.font=Math.round(w*.045)+'px serif';ctx.fillText('♥',w*(.06+(i%2)*.85),h*(.12+Math.floor(i/2)*.23));}
    }else if(id==='magazine'){
      ctx.fillStyle='#fefaf1';ctx.fillRect(0,0,w,h*.17);ctx.fillRect(0,h*.90,w,h*.10);
      ctx.fillStyle='#373234';ctx.font='900 '+Math.round(w*.11)+'px Georgia';ctx.textAlign='center';ctx.fillText('BLOOM',w*.5,h*.115);
      ctx.font=Math.round(w*.023)+'px Arial';ctx.fillText('PHOTO EDITION  •  YOUR STORY',w*.5,h*.953);
    }
    if(caption&&id!=='polaroid'&&id!=='magazine'){
      ctx.font='700 '+Math.round(w*.027)+'px Arial';ctx.textAlign='center';ctx.lineWidth=w*.008;ctx.strokeStyle='#4d333999';ctx.strokeText(caption,w/2,h*.958,w*.8);ctx.fillStyle='#fff';ctx.fillText(caption,w/2,h*.958,w*.8);
    }
    ctx.restore();
  }
  function filtered(){
    if(!state.captured)return null;
    if(state.filterCache&&state.filterCacheKey===state.filter.id)return state.filterCache;
    const canvas=document.createElement('canvas');
    engine.apply(canvas,state.captured,state.filter);
    state.filterCache=canvas;state.filterCacheKey=state.filter.id;
    return canvas;
  }
  function renderTo(target,w,h){
    const ctx=target.getContext('2d',{willReadFrequently:false});
    target.width=w;target.height=h;
    const photo=filtered();if(!photo)return;
    if(state.background.id==='original'||!state.mask){
      drawCover(ctx,photo,0,0,w,h);
    }else{
      drawBackground(ctx,w,h);
      const person=document.createElement('canvas');person.width=photo.width;person.height=photo.height;
      const pc=person.getContext('2d',{willReadFrequently:true});pc.drawImage(photo,0,0);
      const matte=document.createElement('canvas');matte.width=photo.width;matte.height=photo.height;
      const mc=matte.getContext('2d',{willReadFrequently:true});mc.drawImage(state.mask,0,0,matte.width,matte.height);
      const pixels=mc.getImageData(0,0,matte.width,matte.height);
      const strength=1+(state.edgeStrength/100)*2;
      for(let i=0;i<pixels.data.length;i+=4){
        const confidence=pixels.data[i]/255;
        const alpha=clamp((confidence-.5)*strength+.5,0,1);
        pixels.data[i]=255;pixels.data[i+1]=255;pixels.data[i+2]=255;pixels.data[i+3]=Math.round(alpha*255);
      }
      mc.putImageData(pixels,0,0);
      pc.globalCompositeOperation='destination-in';
      pc.drawImage(matte,0,0,person.width,person.height);
      pc.globalCompositeOperation='source-over';
      drawCover(ctx,person,0,0,w,h);
    }
    drawFrame(ctx,w,h);
  }
  let scheduled=false;
  function scheduleRender(){
    if(!state.captured||scheduled)return;
    scheduled=true;
    requestAnimationFrame(()=>{scheduled=false;try{renderTo(preview,600,750);preview.style.display='block';}catch(e){setStatus('Không tạo được bản xem trước: '+e.message);}});
  }
  async function doDownload(){
    if(!state.captured)return;
    download.disabled=true;
    try{
      if(state.background.id!=='original'&&!state.mask)await requestSegmentation();
      const c=document.createElement('canvas');renderTo(c,1200,1500);
      const blob=await new Promise((resolve,reject)=>c.toBlob(b=>b?resolve(b):reject(Error('Không thể xuất ảnh JPEG.')),'image/jpeg',.93));
      const url=URL.createObjectURL(blob);
      const a=document.createElement('a');a.href=url;a.download='bloom-booth-'+Date.now()+'.jpg';
      document.body.appendChild(a);a.click();a.remove();
      setStatus('Đã tạo ảnh JPEG. Nếu Safari hiện bản xem trước, dùng Chia sẻ → Lưu hình ảnh.');
      setTimeout(()=>URL.revokeObjectURL(url),60000);
    }catch(e){setStatus('Không tải được ảnh: '+e.message);}finally{download.disabled=false;}
  }
  function resetEdit(){
    state.filter=engine.presets[0];state.background=backgrounds[0];state.frame=frames[0];state.caption='';state.filterCache=null;
    el('captionText').value='';camera.style.filter='none';
    redrawOptions();scheduleRender();setStatus('Đã đặt lại bộ lọc, phông nền và khung.');
  }
  el('pick').addEventListener('change',captureFromFile);
  el('nativeCamera').addEventListener('change',captureFromFile);
  el('customBackground').addEventListener('change',e=>{
    readImage(e.target.files?.[0],12,img=>{state.customBackground=img;selectOption('background',backgrounds.find(x=>x.id==='custom'));});
    e.target.value='';
  });
  el('customFrame').addEventListener('change',e=>{
    readImage(e.target.files?.[0],12,img=>{state.customFrame=img;selectOption('frame',frames.find(x=>x.id==='custom'));});
    e.target.value='';
  });
  el('captionText').addEventListener('input',e=>{state.caption=e.target.value;scheduleRender();});
  el('bgStrength').addEventListener('input',e=>{state.edgeStrength=Number(e.target.value);el('bgStrengthLabel').textContent=e.target.value+'%';scheduleRender();});
  start.addEventListener('click',openCamera);shoot.addEventListener('click',capture);
  switchBtn.addEventListener('click',()=>{state.facing=state.facing==='user'?'environment':'user';openCamera();});
  retake.addEventListener('click',()=>{
    state.captured=null;state.mask=null;state.filterCache=null;preview.style.display='none';placeholder.hidden=false;
    download.disabled=true;start.hidden=false;retake.hidden=true;shoot.disabled=true;switchBtn.disabled=true;openCamera();
    if(!secureCamera)setStatus('Bấm “Chụp bằng camera iPhone” hoặc “Chọn ảnh có sẵn”.');
  });
  download.addEventListener('click',doDownload);
  el('resetEdit').addEventListener('click',resetEdit);
  window.addEventListener('pagehide',closeCamera);
  redrawOptions();
  if(!secureCamera)setStatus('Safari trên HTTP: chọn “Chụp bằng camera iPhone”. Live camera cần HTTPS.');
})();