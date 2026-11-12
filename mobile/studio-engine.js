'use strict';
window.BloomStudio = (() => {
  const palettes = [
    ['Classic Cream','#fff8ed','#685349','#d9bfa7'],
    ['Coquette Pink','#ffe0ea','#a24f76','#f5a4bb'],
    ['Y2K Chrome','#e6e8f2','#4e5a7e','#95aedc'],
    ['Kawaii Peach','#ffe2cc','#a86471','#ffa6a3'],
    ['Vintage Film','#e8d8bd','#63513f','#ac8a60'],
    ['Noir Editorial','#272936','#f7f2e7','#a6a8b6'],
    ['Sage Garden','#dce9d3','#51745a','#91b58d'],
    ['Lavender Dream','#e9dcfa','#746193','#b6a0d8']
  ];
  const accents = [
    ['Minimal','minimal'],['Ribbon','ribbon'],['Sticker Pop','sticker'],
    ['Sparkle','sparkle'],['Doodle','doodle'],['Film Grain','film']
  ];
  const frames = [{id:'plain',label:'Original',category:'classic',bg:'#f9f5ec',ink:'#645c53',accent:'#dac8ae',decor:'minimal'}];
  palettes.forEach(([name,bg,ink,accent],i) => accents.forEach(([decorName,decor],j) => {
    const id='theme-'+i+'-'+j;
    frames.push({id,label:name+' · '+decorName,category:i===1||i===3?'cute':i===2||i===7?'trend':i===4||i===5?'retro':'classic',bg,ink,accent,decor});
  }));
  const layouts=[
    {id:'vertical',label:'Dải dọc'},
    {id:'grid',label:'Lưới ảnh'},
    {id:'zigzag',label:'Zigzag'},
    {id:'collage',label:'Collage'}
  ];
  function dimensions(count){return count===1?{w:1200,h:1600}:count===3?{w:1200,h:2700}:{w:1200,h:3500};}
  function presets(count,layout){
    if(count===1)return [{x:.09,y:.13,w:.82,h:.73}];
    if(layout==='grid'){
      if(count===3)return [
        {x:.09,y:.15,w:.82,h:.32},
        {x:.09,y:.51,w:.39,h:.34},
        {x:.52,y:.51,w:.39,h:.34}
      ];
      return [
        {x:.08,y:.13,w:.4,h:.21},{x:.52,y:.13,w:.4,h:.21},
        {x:.08,y:.38,w:.84,h:.24},
        {x:.08,y:.66,w:.4,h:.21},{x:.52,y:.66,w:.4,h:.21}
      ];
    }
    if(layout==='zigzag'){
      const countMargin=count===3?.11:.065;
      const slotH=count===3?.22:.145, gap=count===3?.048:.027;
      return Array.from({length:count},(_,i)=>({x:i%2===0?.075:.255,y:countMargin+i*(slotH+gap),w:.67,h:slotH}));
    }
    if(layout==='collage'){
      if(count===3)return [
        {x:.08,y:.13,w:.56,h:.33},{x:.44,y:.37,w:.47,h:.29},{x:.12,y:.66,w:.68,h:.22}
      ];
      return [
        {x:.08,y:.13,w:.55,h:.21},{x:.49,y:.28,w:.43,h:.20},
        {x:.09,y:.49,w:.58,h:.19},{x:.46,y:.65,w:.46,h:.16},
        {x:.09,y:.8,w:.47,h:.10}
      ];
    }
    const margin=count===3?.12:.105;
    const space=count===3?.025:.015;
    const height=(.77-(count-1)*space)/count;
    return Array.from({length:count},(_,i)=>({x:.09,y:margin+i*(height+space),w:.82,h:height}));
  }
  function cloneRects(count,layout){return presets(count,layout).map(x=>({...x}));}
  function constrain(r){
    const w=Math.max(.15,Math.min(.9,Number(r.w)||.4));
    const h=Math.max(.09,Math.min(.80,Number(r.h)||.2));
    return {x:Math.max(.025,Math.min(.975-w,Number(r.x)||0)),y:Math.max(.065,Math.min(.91-h,Number(r.y)||0)),w,h};
  }
  function hit(rects,x,y){
    for(let i=rects.length-1;i>=0;i--){const r=rects[i];if(x>=r.x&&x<=r.x+r.w&&y>=r.y&&y<=r.y+r.h)return i;}
    return -1;
  }
  function photo(ctx,img,r,w,h){
    const sw=img.width||img.videoWidth,sh=img.height||img.videoHeight;
    if(!sw||!sh)return;
    const x=r.x*w,y=r.y*h,rw=r.w*w,rh=r.h*h;
    const contain=Math.min(rw/sw,rh/sh),cw=sw*contain,ch=sh*contain;
    const cover=Math.max(rw/sw,rh/sh),bw=sw*cover,bh=sh*cover;
    ctx.save();ctx.beginPath();ctx.rect(x,y,rw,rh);ctx.clip();
    ctx.fillStyle='#ffffff';ctx.fillRect(x,y,rw,rh);
    // Background is filled without cropping the central photograph.
    ctx.globalAlpha=.45;ctx.drawImage(img,x+(rw-bw)/2,y+(rh-bh)/2,bw,bh);ctx.globalAlpha=1;
    ctx.drawImage(img,x+(rw-cw)/2,y+(rh-ch)/2,cw,ch);ctx.restore();
  }
  function petals(ctx,x,y,r,color){
    ctx.fillStyle=color;
    for(let i=0;i<5;i++){
      const a=i*Math.PI*2/5;
      ctx.beginPath();ctx.ellipse(x+Math.cos(a)*r*.62,y+Math.sin(a)*r*.62,r*.5,r*.36,a,0,Math.PI*2);ctx.fill();
    }
    ctx.beginPath();ctx.arc(x,y,r*.24,0,Math.PI*2);ctx.fill();
  }
  function decorate(ctx,w,h,style,rects){
    const {ink,accent,decor}=style;
    ctx.save();ctx.fillStyle=ink;ctx.strokeStyle=ink;ctx.textAlign='center';
    if(decor==='ribbon'){
      ctx.font=Math.round(w*.055)+'px Georgia';ctx.fillText('♡    ✿    ♡',w/2,h*.065);
      ctx.font=Math.round(w*.08)+'px Georgia';ctx.fillText('୨୧',w*.88,h*.97);
    }
    if(decor==='sticker'){
      const icons=['★','♡','✿','✦','☆','♥','✧','☻'];
      ctx.font=Math.round(w*.045)+'px Georgia';
      for(let i=0;i<18;i++){
        const x=w*(.055+(i%2)*.89),y=h*(.08+(i/18)*.86);
        ctx.fillStyle=i%2?ink:accent;
        ctx.fillText(icons[i%icons.length],x,y);
      }
    }
    if(decor==='sparkle'){
      ctx.font=Math.round(w*.045)+'px Georgia';
      for(let i=0;i<22;i++){
        ctx.fillStyle=i%2?ink:accent;
        const x=w*(.035+(i%2)*.93),y=h*(.08+i*.039);
        ctx.fillText(i%2?'✧':'✦',x,y);
      }
    }
    if(decor==='doodle'){
      for(let i=0;i<16;i++){
        petals(ctx,w*(.052+(i%2)*.89),h*(.08+i*.053),w*.015,i%3?accent:ink);
      }
    }
    if(decor==='film'){
      ctx.fillStyle=ink;
      ctx.fillRect(w*.009,0,w*.032,h);ctx.fillRect(w*.959,0,w*.032,h);
      ctx.fillStyle=style.bg;
      for(let i=0;i<Math.ceil(h/(w*.09));i++){
        const y=i*w*.09+w*.025;
        ctx.fillRect(w*.018,y,w*.014,w*.045);ctx.fillRect(w*.968,y,w*.014,w*.045);
      }
    }
    ctx.restore();
  }
  function render(canvas,opts){
    const {count,layout,rects,shots,frame,filter,filterEngine,selected=-1,preview=false,preFiltered=false}=opts;
    const ctx=canvas.getContext('2d');const w=canvas.width,h=canvas.height;
    const style=frames.find(f=>f.id===frame)||frames[0];
    ctx.fillStyle=style.bg;ctx.fillRect(0,0,w,h);
    ctx.fillStyle=style.ink;ctx.textAlign='center';
    ctx.font='800 '+Math.max(8,Math.round(w*.049))+'px Arial';
    ctx.fillText('BLOOM BOOTH',w/2,h*.058);
    ctx.font=Math.max(5,Math.round(w*.019))+'px Arial';
    ctx.fillText('COLLECT YOUR LITTLE MOMENTS',w/2,h*.077);
    const actual=rects||cloneRects(count,layout);
    actual.forEach((r,i)=>{
      const x=r.x*w,y=r.y*h,rw=r.w*w,rh=r.h*h;
      ctx.fillStyle=style.accent;ctx.fillRect(x-w*.006,y-w*.006,rw+w*.012,rh+w*.012);
      if(shots[i]){
        let image=shots[i];
        if(!preFiltered&&filterEngine){
          const c=document.createElement('canvas');filterEngine.apply(c,image,filter);image=c;
        }
        photo(ctx,image,r,w,h);
      }else{
        ctx.fillStyle=style.bg;ctx.fillRect(x,y,rw,rh);
        ctx.fillStyle=style.ink;ctx.globalAlpha=.45;
        ctx.font='700 '+Math.max(10,Math.round(w*.065))+'px Arial';
        ctx.fillText(String(i+1).padStart(2,'0'),x+rw/2,y+rh/2);
        ctx.globalAlpha=1;
      }
      ctx.strokeStyle=style.ink;ctx.lineWidth=Math.max(1,w*.003);ctx.strokeRect(x,y,rw,rh);
      if(preview&&selected===i){
        ctx.save();ctx.setLineDash([w*.015,w*.009]);ctx.lineWidth=Math.max(2,w*.008);
        ctx.strokeStyle='#e03f74';ctx.strokeRect(x-w*.009,y-w*.009,rw+w*.018,rh+w*.018);ctx.restore();
      }
    });
    decorate(ctx,w,h,style,actual);
    ctx.fillStyle=style.ink;ctx.textAlign='center';
    ctx.font='italic '+Math.max(7,Math.round(w*.026))+'px Georgia';
    ctx.fillText(count===1?'One lovely moment':count+' little moments in one',w/2,h*.959);
    return actual;
  }
  return Object.freeze({frames,layouts,dimensions,presets,cloneRects,constrain,hit,render});
})();
