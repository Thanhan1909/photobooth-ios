'use strict';
window.BloomStudio = (() => {
  const frames=window.BloomFrameArt.catalog;
  const layouts=[
    {id:'vertical',label:'Dải dọc'},
    {id:'grid',label:'Lưới ảnh'},
    {id:'zigzag',label:'Zigzag'},
    {id:'collage',label:'Collage'}
  ];
  function dimensions(count){return count===1?{w:1200,h:1600}:count===3?{w:1200,h:2700}:count===5?{w:1200,h:3500}:{w:1200,h:Math.min(4700,1600+count*420)};}
  function presets(count,layout){
    if(count!==1&&count!==3&&count!==5&&window.BloomLayoutCatalog){
      const id=layout==='grid'?'checkerboard':layout==='zigzag'?'alternating':layout==='collage'?'sticker-collage':'classic-strip';
      return window.BloomLayoutCatalog.slots(id,count);
    }
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
  // Artwork shapes are deliberately varied, not color variants of a rectangle.
  function shapePath(ctx,x,y,w,h,motif){
    const oval=['gingham','moon','cloud','rainbow','night','sunset','seashell','wave'];
    const arch=['ribbon','cherry','wildflower','botanical','graduation','christmas'];
    const round=['duckling','strawberry','cherrysoda','lemon','matcha','birthday'];
    const cut=['comic','arcade','pixel','ticket','concert','postcard','airmail'];
    const r=Math.min(w,h)*.13;
    ctx.beginPath();
    if(oval.includes(motif)){
      ctx.ellipse(x+w/2,y+h/2,w/2,h/2,0,0,Math.PI*2);
    }else if(arch.includes(motif)){
      ctx.moveTo(x,y+h);ctx.lineTo(x,y+w/2);
      ctx.ellipse(x+w/2,y+w/2,w/2,w/2,0,Math.PI,0);
      ctx.lineTo(x+w,y+h);ctx.closePath();
    }else if(round.includes(motif)){
      ctx.moveTo(x+r,y);ctx.lineTo(x+w-r,y);
      ctx.quadraticCurveTo(x+w,y,x+w,y+r);ctx.lineTo(x+w,y+h-r);
      ctx.quadraticCurveTo(x+w,y+h,x+w-r,y+h);ctx.lineTo(x+r,y+h);
      ctx.quadraticCurveTo(x,y+h,x,y+h-r);ctx.lineTo(x,y+r);
      ctx.quadraticCurveTo(x,y,x+r,y);ctx.closePath();
    }else if(cut.includes(motif)){
      ctx.moveTo(x+w*.08,y);ctx.lineTo(x+w*.92,y);
      ctx.lineTo(x+w,y+h*.08);ctx.lineTo(x+w,y+h*.92);
      ctx.lineTo(x+w*.92,y+h);ctx.lineTo(x+w*.08,y+h);
      ctx.lineTo(x,y+h*.92);ctx.lineTo(x,y+h*.08);ctx.closePath();
    }else{
      ctx.rect(x,y,w,h);
    }
  }
  function photo(ctx,img,r,w,h,style){
    const sw=img.width||img.videoWidth,sh=img.height||img.videoHeight;
    if(!sw||!sh)return;
    const x=r.x*w,y=r.y*h,rw=r.w*w,rh=r.h*h;
    const contain=Math.min(rw/sw,rh/sh),cw=sw*contain,ch=sh*contain;
    const cover=Math.max(rw/sw,rh/sh),bw=sw*cover,bh=sh*cover;
    ctx.save();shapePath(ctx,x,y,rw,rh,style.motif);ctx.clip();
    ctx.fillStyle='#ffffff';ctx.fillRect(x,y,rw,rh);
    // Background is filled without cropping the central photograph.
    ctx.globalAlpha=.45;ctx.drawImage(img,x+(rw-bw)/2,y+(rh-bh)/2,bw,bh);ctx.globalAlpha=1;
    ctx.drawImage(img,x+(rw-cw)/2,y+(rh-ch)/2,cw,ch);ctx.restore();
  }
  function render(canvas,opts){
    const {count,layout,rects,shots,frame,filter,filterEngine,selected=-1,preview=false,preFiltered=false}=opts;
    const ctx=canvas.getContext('2d');const w=canvas.width,h=canvas.height;
    const style=frames.find(f=>f.id===frame)||frames[0];
    ctx.fillStyle=style.bg;ctx.fillRect(0,0,w,h);
    // Themed artwork draws its own heading. Only the plain frame needs generic lettering.
    // Drawing both caused stacked text (e.g. QUACK over QUACK QUACK).
    if(style.id==='plain'){
      ctx.fillStyle=style.ink;ctx.textAlign='center';
      ctx.font='800 '+Math.max(8,Math.round(w*.049))+'px Arial';
      ctx.fillText('BLOOM BOOTH',w/2,h*.058,w*.87);
      ctx.font=Math.max(5,Math.round(w*.019))+'px Arial';
      ctx.fillText('COLLECT YOUR LITTLE MOMENTS',w/2,h*.077,w*.9);
    }
    // Artwork is behind photos, so text and stickers never cover faces.
    window.BloomFrameArt.draw(ctx,w,h,style);
    const actual=rects||cloneRects(count,layout);
    actual.forEach((r,i)=>{
      const x=r.x*w,y=r.y*h,rw=r.w*w,rh=r.h*h;
      ctx.fillStyle=style.accent;shapePath(ctx,x-w*.008,y-h*.003,rw+w*.016,rh+h*.006,style.motif);ctx.fill();
      if(shots[i]){
        let image=shots[i];
        if(!preFiltered&&filterEngine){
          const c=document.createElement('canvas');filterEngine.apply(c,image,filter);image=c;
        }
        photo(ctx,image,r,w,h,style);
      }else{
        ctx.fillStyle=style.bg;shapePath(ctx,x,y,rw,rh,style.motif);ctx.fill();
        ctx.fillStyle=style.ink;ctx.globalAlpha=.45;
        ctx.font='700 '+Math.max(10,Math.round(w*.065))+'px Arial';
        ctx.fillText(String(i+1).padStart(2,'0'),x+rw/2,y+rh/2);
        ctx.globalAlpha=1;
      }
      ctx.strokeStyle=style.ink;ctx.lineWidth=Math.max(1,w*.003);shapePath(ctx,x,y,rw,rh,style.motif);ctx.stroke();
      if(preview&&selected===i){
        ctx.save();ctx.setLineDash([w*.015,w*.009]);ctx.lineWidth=Math.max(2,w*.008);
        ctx.strokeStyle='#e03f74';ctx.strokeRect(x-w*.009,y-w*.009,rw+w*.018,rh+w*.018);ctx.restore();
      }
    });
    // Every themed design already owns its caption/footer. Avoid second overlay.
    if(style.id==='plain'){
      ctx.fillStyle=style.ink;ctx.textAlign='center';
      ctx.font='italic '+Math.max(7,Math.round(w*.026))+'px Georgia';
      ctx.fillText(count===1?'One lovely moment':count+' little moments in one',w/2,h*.959);
    }
    return actual;
  }
  return Object.freeze({frames,layouts,dimensions,presets,cloneRects,constrain,hit,render});
})();
