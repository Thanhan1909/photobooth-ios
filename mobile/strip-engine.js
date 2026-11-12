'use strict';
window.BloomStrip=(()=>{
  const COUNT=3;
  function layout(w,h){
    const scale=w/1200;
    const margin=Math.round(58*scale);
    const top=Math.round(122*scale);
    const bottom=Math.round(135*scale);
    const gap=Math.round(27*scale);
    const innerW=w-2*margin;
    const slotH=(h-top-bottom-2*gap)/3;
    return {margin,top,bottom,gap,innerW,slotH,rects:Array.from({length:3},(_,i)=>({x:margin,y:top+i*(slotH+gap),w:innerW,h:slotH}))};
  }
  function palette(name){
    if(name==='film')return {outer:'#24212c',inner:'#f6f1eb',text:'#f6eceb'};
    if(name==='blush'||name==='hearts')return {outer:'#f5b6c6',inner:'#fff5f6',text:'#884b62'};
    if(name==='botanical')return {outer:'#b7caae',inner:'#f7fbf0',text:'#53735c'};
    if(name==='stars')return {outer:'#a9a4d2',inner:'#f8f4ff',text:'#4b4679'};
    if(name==='retro')return {outer:'#d79e6a',inner:'#fff2db',text:'#704323'};
    if(name==='cream')return {outer:'#efe2c9',inner:'#fffef6',text:'#82705c'};
    if(name==='confetti')return {outer:'#ffdfbd',inner:'#fffaf2',text:'#775d56'};
    if(name==='polaroid')return {outer:'#fffaf0',inner:'#f5eae2',text:'#876f70'};
    return {outer:'#ffe1d9',inner:'#fff8f5',text:'#8c6465'};
  }
  function fit(ctx,image,rect){
    const w=image.width||image.videoWidth,h=image.height||image.videoHeight;
    if(!w||!h)return;
    const scale=Math.min(rect.w/w,rect.h/h);
    const dw=Math.max(1,w*scale),dh=Math.max(1,h*scale);
    ctx.save();
    ctx.beginPath();ctx.rect(rect.x,rect.y,rect.w,rect.h);ctx.clip();
    // Fill the slot with a dimmed full-bleed background while keeping the actual photo uncropped.
    const zoom=Math.max(rect.w/w,rect.h/h);
    const bw=w*zoom,bh=h*zoom;
    if('filter'in ctx)ctx.filter='blur(14px) brightness(.85)';
    ctx.drawImage(image,rect.x+(rect.w-bw)/2,rect.y+(rect.h-bh)/2,bw,bh);
    if('filter'in ctx)ctx.filter='none';
    ctx.drawImage(image,rect.x+(rect.w-dw)/2,rect.y+(rect.h-dh)/2,dw,dh);
    ctx.restore();
  }
  function draw(canvas,shots,filter,frame,filterEngine){
    const ctx=canvas.getContext('2d');
    const w=canvas.width,h=canvas.height,config=layout(w,h),theme=palette(frame);
    ctx.fillStyle=theme.outer;ctx.fillRect(0,0,w,h);
    ctx.fillStyle=theme.text;ctx.textAlign='center';
    ctx.font='700 '+Math.round(w*.046)+'px sans-serif';
    ctx.fillText('BLOOM BOOTH',w/2,config.top*.59);
    ctx.font=Math.round(w*.022)+'px sans-serif';
    ctx.fillText('THREE LITTLE MOMENTS',w/2,config.top*.86);
    config.rects.forEach((rect,i)=>{
      ctx.fillStyle=theme.inner;ctx.fillRect(rect.x-5,rect.y-5,rect.w+10,rect.h+10);
      if(shots[i]){
        const filtered=document.createElement('canvas');
        filterEngine.apply(filtered,shots[i],filter);
        fit(ctx,filtered,rect);
      }else{
        ctx.fillStyle=theme.inner;ctx.fillRect(rect.x,rect.y,rect.w,rect.h);
        ctx.fillStyle=theme.text;ctx.globalAlpha=.42;
        ctx.font='700 '+Math.round(w*.052)+'px sans-serif';
        ctx.fillText(String(i+1).padStart(2,'0'),rect.x+rect.w/2,rect.y+rect.h/2);
        ctx.globalAlpha=1;
      }
      ctx.strokeStyle=theme.outer;ctx.lineWidth=Math.max(2,w*.006);
      ctx.strokeRect(rect.x,rect.y,rect.w,rect.h);
    });
    ctx.fillStyle=theme.text;ctx.font='italic '+Math.round(w*.031)+'px Georgia';
    ctx.fillText('Made with love ♡',w/2,h-config.bottom*.49);
    if(frame==='film'){
      ctx.fillStyle='#fff5ea';
      for(let j=0;j<24;j++){
        const y=(j+.5)*h/24;
        ctx.fillRect(w*.016,y,w*.025,w*.015);ctx.fillRect(w*.958,y,w*.025,w*.015);
      }
    }
    if(frame==='hearts'||frame==='stars'){
      ctx.font=Math.round(w*.045)+'px serif';ctx.fillStyle=theme.text;
      for(let j=0;j<11;j++){
        const y=h*(.07+j*.083);
        ctx.fillText(frame==='hearts'?'♥':'✦',w*.025,y);
        ctx.fillText(frame==='hearts'?'♥':'✧',w*.975,y);
      }
    }
    return config;
  }
  return Object.freeze({COUNT,layout,draw,fit});
})();
