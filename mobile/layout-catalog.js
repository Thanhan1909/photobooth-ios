'use strict';
/**
 * Original layouts, independent of branded artwork. Every layout owns its
 * background, geometry, title/footer safe zones and target aspect ratio.
 * Slots are normalized (0..1); never reuse a fixed rectangle grid on all frames.
 */
window.BloomLayoutCatalog=(()=>{
  const specs=[
    ['classic-strip','Photo strip cổ điển','strip',.445,'#fff8f1','#d58e96',0],
    ['rounded-strip','Dải bo tròn','strip',.445,'#ffe8e7','#cc8b99',1],
    ['offset-left','Lệch trái','offset',.46,'#faf0db','#947e78',0],
    ['offset-right','Lệch phải','offset',.46,'#ecf2ff','#91aaca',1],
    ['alternating','So le nhịp nhàng','alternating',.47,'#f5f1ff','#ba92bf',0],
    ['checkerboard','Ô caro','checker',.64,'#ffeedf','#e2a28c',1],
    ['editorial-grid','Editorial Grid','checker',.70,'#f2f3f4','#535b69',2],
    ['hero-top','Ảnh lớn ở trên','hero',.62,'#ecf4ff','#557bc4',0],
    ['hero-bottom','Ảnh lớn ở dưới','hero',.62,'#fae4ec','#b36382',1],
    ['hero-left','Ảnh lớn bên trái','hero-side',.75,'#e4f3ef','#438c75',0],
    ['hero-right','Ảnh lớn bên phải','hero-side',.75,'#f4eadc','#b78d6b',1],
    ['magazine','Bìa tạp chí','magazine',.69,'#f7f3ec','#4d4c49',0],
    ['comic-cells','Ô truyện tranh','checker',.72,'#fff1c8','#353b76',3],
    ['polaroid-wall','Tường polaroid','wall',.70,'#fff9e8','#bdab92',0],
    ['sticker-collage','Scrapbook stickers','wall',.75,'#ffeff6','#d98aa5',1],
    ['heart-wall','Trái tim kỷ niệm','wall',.72,'#f6e5f4','#c579a1',2],
    ['film-roll','Dải phim 35mm','strip',.36,'#22242e','#f6d99f',2],
    ['film-contact','Film Contact Sheet','checker',.69,'#24272d','#ecdfc3',4],
    ['ticket-stubs','Vé lưu niệm','offset',.46,'#f5e9dd','#d19a76',2],
    ['postcards','Bưu thiếp xếp lớp','wall',.72,'#e8f5f5','#628c9a',3],
    ['passport','Ảnh thẻ đáng yêu','checker',.65,'#dbe9fb','#91aad9',5],
    ['y2k-bubbles','Y2K Bubble','wall',.72,'#f0e5ff','#8e74ba',4],
    ['kawaii-diary','Nhật ký Kawaii','alternating',.50,'#ffe4ef','#e7a3ba',2],
    ['graduation-strip','Kỷ yếu học đường','strip',.445,'#e8edf7','#8a9cbe',3],
    ['couple-split','Couple Split','hero-side',.78,'#fff0e8','#ca8f8a',2],
    ['duo-mosaic','Mosaic đôi','checker',.77,'#e6f6e9','#90bbaa',6],
    ['vietnam-flag','Việt Nam rực rỡ','strip',.445,'#cf242b','#f7d34d',4],
    ['holiday-cards','Holiday Cards','wall',.70,'#f5f0df','#bdba85',5],
    ['minimal-white','Tối giản trắng','strip',.46,'#ffffff','#a8a8a8',5],
    ['minimal-black','Tối giản đen','strip',.46,'#15181f','#e5dec9',6],
    ['zine-asymmetric','Zine bất đối xứng','magazine',.67,'#ebecd3','#738b70',1],
    ['overlap-art','Ảnh nghệ thuật','wall',.72,'#e6dcf4','#9a85c7',6]
  ];
  const templates=specs.map(([id,label,pattern,ratio,bg,accent,variation])=>({
    id,label,pattern,ratio,bg,accent,variation
  }));
  const clamp=(n,low,high)=>Math.min(high,Math.max(low,n));
  function safe(rect){
    const w=clamp(rect.w,.09,.88),h=clamp(rect.h,.065,.76);
    return {x:clamp(rect.x,.03,.97-w),y:clamp(rect.y,.11,.91-h),w,h};
  }
  function slots(template,count){
    if(!Number.isInteger(count)||count<1||count>10)throw Error('Invalid photo count');
    const t=typeof template==='string'?templates.find(x=>x.id===template):template;
    if(!t)throw Error('Unknown layout');
    const n=count,mode=t.pattern;
    let rects=[];
    if(n===1){rects=[{x:.11,y:.16,w:.78,h:.67}];}
    else if(mode==='strip'){
      const y0=.145,y1=.895,gap=n>7?.008:.014,slotH=(y1-y0-gap*(n-1))/n;
      const left=t.variation%2?.14:.095,width=t.variation%2?.72:.81;
      rects=Array.from({length:n},(_,i)=>({x:left,y:y0+i*(slotH+gap),w:width,h:slotH}));
    } else if(mode==='offset'||mode==='alternating'){
      const gap=n>6?.01:.018,slotH=(.74-gap*(n-1))/n;
      rects=Array.from({length:n},(_,i)=>{
        const side=(i+t.variation)%2;
        return {x:side?.245:.055,y:.14+i*(slotH+gap),w:.70,h:slotH};
      });
    }else if(mode==='checker'){
      const cols=n<=3?2:n>=8?3:2,rows=Math.ceil(n/cols),gap=.024;
      const tileW=(.84-gap*(cols-1))/cols,tileH=(.73-gap*(rows-1))/rows;
      rects=Array.from({length:n},(_,i)=>({
        x:.08+(i%cols)*(tileW+gap),y:.15+Math.floor(i/cols)*(tileH+gap),
        w:tileW,h:tileH
      }));
    }else if(mode==='hero'){
      const top=t.variation%2===0,side=n-1,columns=Math.min(3,side),rows=Math.ceil(side/columns),gap=.014;
      const largeH=.34,smallH=.34;
      if(top)rects.push({x:.08,y:.14,w:.84,h:largeH});
      const startY=top?.53:.15;
      const cellW=(.84-(columns-1)*gap)/columns;
      for(let i=0;i<side;i++)rects.push({
        x:.08+(i%columns)*(cellW+gap),y:startY+Math.floor(i/columns)*(smallH/rows+gap*.35),
        w:cellW,h:Math.max(.065,smallH/rows-gap*.3)
      });
      if(!top)rects.push({x:.08,y:.53,w:.84,h:largeH});
    }else if(mode==='hero-side'){
      const left=t.variation%2===0,cols=Math.min(n-1,2),rows=Math.ceil((n-1)/cols);
      rects.push({x:left?.07:.53,y:.16,w:.40,h:.70});
      const w=.40/cols,gap=.015,cellH=.68/rows;
      for(let i=0;i<n-1;i++)rects.push({
        x:(left?.52:.07)+(i%cols)*w,y:.17+Math.floor(i/cols)*cellH,
        w:w-gap,h:cellH-.018
      });
    }else if(mode==='magazine'){
      rects=[{x:.12,y:.18,w:.76,h:.36}];
      const cols=Math.min(3,n-1),rows=Math.ceil((n-1)/cols),w=.78/cols;
      for(let i=0;i<n-1;i++)rects.push({x:.11+(i%cols)*w,y:.565+Math.floor(i/cols)*(.30/rows),w:w-.014,h:.30/rows-.012});
    } else if(mode==='wall'){
      const columns=n<=3?2:3,rows=Math.ceil(n/columns),gap=.009;
      const cellW=(.84-(columns-1)*gap)/columns,cellH=(.72-(rows-1)*gap)/rows;
      rects=Array.from({length:n},(_,i)=>({
        x:.08+(i%columns)*(cellW+gap)+(Math.sin(i*2.7+t.variation)*.013),
        y:.16+Math.floor(i/columns)*(cellH+gap)+Math.cos(i*1.9+t.variation)*.012,
        w:cellW*.99,h:cellH*.98
      }));
    }
    return rects.map(safe);
  }
  // Unique, original vector ornament families, painted under the subject layer.
  // Art is clipped by image windows when composed, never pasted over faces.
  function ornaments(ctx,w,h,t){
    const id=t.id;
    const accent=t.accent;
    const dot=(x,y,r,color=accent)=>{
      ctx.beginPath();ctx.fillStyle=color;ctx.arc(w*x,h*y,w*r,0,Math.PI*2);ctx.fill();
    };
    const star=(x,y,r,color=accent)=>{
      ctx.beginPath();ctx.fillStyle=color;
      for(let i=0;i<10;i++){
        const a=i*Math.PI/5-Math.PI/2,rr=(i%2?.42:1)*w*r;
        const X=w*x+Math.cos(a)*rr,Y=h*y+Math.sin(a)*rr;
        if(!i)ctx.moveTo(X,Y);else ctx.lineTo(X,Y);
      }
      ctx.closePath();ctx.fill();
    };
    const line=(x,y,x2,y2,color=accent,width=.006)=>{
      ctx.beginPath();ctx.strokeStyle=color;ctx.lineWidth=w*width;
      ctx.moveTo(w*x,h*y);ctx.lineTo(w*x2,h*y2);ctx.stroke();
    };
    const heart=(x,y,size)=>{ctx.save();ctx.fillStyle=accent;ctx.font='bold '+Math.round(w*size)+'px Arial';ctx.textAlign='center';ctx.fillText('♥',w*x,h*y);ctx.restore();};
    const flower=(x,y,r)=>{
      for(let i=0;i<5;i++){
        const a=i*Math.PI*2/5;
        dot(x+Math.cos(a)*r*.8,y+Math.sin(a)*r*w/h,r*.43);
      }dot(x,y,r*.34,'#ffedba');
    };
    ctx.save();
    if(id.includes('film')){
      ctx.fillStyle='#1d2130';ctx.fillRect(0,0,w*.07,h);ctx.fillRect(w*.93,0,w*.07,h);
      ctx.fillStyle='#f1efe6';
      for(let i=0;i<30;i++){
        ctx.fillRect(w*.023,h*(i+.22)/30,w*.025,h*.014);
        ctx.fillRect(w*.953,h*(i+.22)/30,w*.025,h*.014);
      }
    }else if(id.includes('heart')||id.includes('couple')||id.includes('kawaii')){
      for(let i=0;i<11;i++){heart(.045,.13+i*.074,.028);heart(.954,.12+i*.074,.028);}
    }else if(id.includes('graduation')||id.includes('editorial')){
      line(.12,.10,.88,.10,accent,.012);
      line(.12,.93,.88,.93,accent,.012);
      for(let i=0;i<7;i++){star(.05,.17+i*.105,.013);star(.95,.17+i*.105,.013);}
    }else if(id.includes('vietnam')){
      for(let i=0;i<8;i++){star(.042,.14+i*.095,.03,'#ffdc57');star(.96,.14+i*.095,.03,'#ffdc57');}
      line(.09,.09,.91,.09,'#ffdc57',.014);
    }else if(id.includes('ticket')||id.includes('postcard')||id.includes('holiday')){
      ctx.strokeStyle=accent;ctx.lineWidth=w*.008;ctx.setLineDash([w*.015,w*.015]);
      ctx.strokeRect(w*.03,h*.095,w*.94,h*.82);ctx.setLineDash([]);
      for(let i=0;i<12;i++){dot(.03,.14+i*.068,.009,t.bg);dot(.97,.14+i*.068,.009,t.bg);}
    }else if(id.includes('minimal')){
      line(.08,.102,.92,.102,accent,.004);line(.08,.927,.92,.927,accent,.004);
    }else if(id.includes('polaroid')||id.includes('sticker')||id.includes('wall')){
      for(let i=0;i<12;i++){
        if(i%2)star(i%3?.05:.95,.12+i*.07,.017);
        else flower(i%3?.05:.95,.12+i*.07,.015);
      }
      for(let i=0;i<8;i++)line(.20+i*.08,.098,.25+i*.08,.098,accent,.006);
    }else if(id.includes('y2k')||id.includes('arcade')||id.includes('checker')){
      for(let i=0;i<14;i++){
        star(i%2?.055:.945,.13+i*.055,.018,i%2?'#ed92cc':accent);
      }
    }else if(id.includes('strip')||id.includes('offset')||id.includes('alternating')){
      for(let i=0;i<8;i++){flower(.035,.15+i*.095,.013);flower(.964,.15+i*.095,.013);}
    }else{
      for(let i=0;i<10;i++){dot(.05,.145+i*.075,.009);dot(.95,.145+i*.075,.009);}
    }
    ctx.restore();
  }
  function slotShape(ctx,x,y,w,h,template){
    const id=template.id;
    const motif=id.includes('heart')||id.includes('couple')?'heart':
      id.includes('y2k')||id.includes('bubble')||id.includes('passport')?'oval':
      id.includes('diary')||id.includes('graduation')||id.includes('holiday')?'arch':
      id.includes('film')||id.includes('ticket')?'ticket':
      id.includes('polaroid')||id.includes('postcard')?'paper':
      id.includes('comic')||id.includes('zine')?'cut':'round';
    const radius=Math.min(w,h);
    ctx.beginPath();
    if(motif==='oval'){
      ctx.ellipse(x+w/2,y+h/2,w/2,h/2,0,0,Math.PI*2);
    }else if(motif==='heart'){
      ctx.moveTo(x+w/2,y+h*.19);
      ctx.bezierCurveTo(x+w*.06,y-h*.09,x-w*.13,y+h*.37,x+w/2,y+h);
      ctx.bezierCurveTo(x+w*1.13,y+h*.37,x+w*.94,y-h*.09,x+w/2,y+h*.19);
      ctx.closePath();
    }else if(motif==='arch'){
      const r=Math.min(w/2,h*.44);
      ctx.moveTo(x,y+h);ctx.lineTo(x,y+r);
      ctx.arc(x+w/2,y+r,r,Math.PI,0);
      ctx.lineTo(x+w,y+h);ctx.closePath();
    }else if(motif==='ticket'){
      const c=Math.min(w,h)*.075;
      ctx.moveTo(x+c,y);ctx.lineTo(x+w-c,y);
      ctx.quadraticCurveTo(x+w,y,x+w,y+c);
      ctx.lineTo(x+w,y+h/2-c);
      ctx.arc(x+w,y+h/2,c,-Math.PI/2,Math.PI/2,true);
      ctx.lineTo(x+w,y+h-c);ctx.quadraticCurveTo(x+w,y+h,x+w-c,y+h);
      ctx.lineTo(x+c,y+h);ctx.quadraticCurveTo(x,y+h,x,y+h-c);
      ctx.lineTo(x,y+h/2+c);
      ctx.arc(x,y+h/2,c,Math.PI/2,-Math.PI/2,true);
      ctx.lineTo(x,y+c);ctx.quadraticCurveTo(x,y,x+c,y);ctx.closePath();
    }else if(motif==='paper'){
      const c=radius*.09;
      ctx.moveTo(x+c,y);ctx.lineTo(x+w-c,y);ctx.lineTo(x+w,y+c);
      ctx.lineTo(x+w,y+h-c);ctx.lineTo(x+w-c,y+h);ctx.lineTo(x+c,y+h);
      ctx.lineTo(x,y+h-c);ctx.lineTo(x,y+c);ctx.closePath();
    }else if(motif==='cut'){
      ctx.moveTo(x+w*.12,y);ctx.lineTo(x+w,y);ctx.lineTo(x+w,y+h*.88);
      ctx.lineTo(x+w*.88,y+h);ctx.lineTo(x,y+h);ctx.lineTo(x,y+h*.12);ctx.closePath();
    }else{
      ctx.roundRect(x,y,w,h,radius*.085);
    }
  }
  function drawBackground(ctx,w,h,t){
    ctx.save();ctx.fillStyle=t.bg;ctx.fillRect(0,0,w,h);
    const a=t.accent,vari=t.variation;
    ctx.fillStyle=a;
    ctx.globalAlpha=.20;
    if(t.pattern==='checker'||t.pattern==='wall'){
      for(let i=0;i<10;i++)for(let j=0;j<12;j++){
        if((i+j+vari)%3===0)ctx.fillRect(w*i/10,h*j/12,w*.035,h*.018);
      }
    }else if(t.pattern==='strip'){
      ctx.fillRect(w*.045,h*.11,w*.016,h*.79);
      ctx.fillRect(w*.939,h*.11,w*.016,h*.79);
    }else if(t.pattern==='hero'||t.pattern==='hero-side'){
      ctx.fillRect(w*.03,h*.105,w*.94,h*.012);
      ctx.fillRect(w*.03,h*.908,w*.94,h*.012);
    }else{
      for(let i=0;i<17;i++){ctx.beginPath();ctx.arc(w*(i%4)/4,h*(i*7%15)/15,w*.009,0,Math.PI*2);ctx.fill();}
    }
    ctx.globalAlpha=1;
    ctx.fillStyle=(t.id==='minimal-black'||t.id==='vietnam-flag')?'#fff9f5':'#6d565e';
    ctx.textAlign='center';
    ctx.font='bold '+Math.max(10,Math.round(w*.035))+'px sans-serif';
    ctx.fillText(t.label.toUpperCase(),w/2,h*.065,w*.85);
    ctx.font=Math.max(9,Math.round(w*.018))+'px sans-serif';
    ctx.fillText('BLOOMBOOTH · LITTLE MOMENTS',w/2,h*.967,w*.9);
    ornaments(ctx,w,h,t);
    ctx.restore();
  }
  return Object.freeze({templates,slots,slotShape,drawBackground});
})();
