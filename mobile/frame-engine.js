'use strict';
window.BloomFrames=(()=>{
  const frames=[
    {id:'none',label:'Không khung'},
    {id:'polaroid',label:'Polaroid'},
    {id:'film',label:'Film Strip'},
    {id:'blush',label:'Blush Pink'},
    {id:'botanical',label:'Botanical'},
    {id:'hearts',label:'Sweetheart'},
    {id:'stars',label:'Starlight'},
    {id:'retro',label:'Retro'},
    {id:'cream',label:'Cream'},
    {id:'confetti',label:'Confetti'}
  ];
  function flower(ctx,x,y,r,color){
    ctx.fillStyle=color;
    for(let i=0;i<5;i++){const a=i*Math.PI*2/5;ctx.beginPath();ctx.ellipse(x+Math.cos(a)*r*.55,y+Math.sin(a)*r*.55,r*.46,r*.34,a,0,Math.PI*2);ctx.fill();}
    ctx.beginPath();ctx.arc(x,y,r*.19,0,Math.PI*2);ctx.fillStyle='#ffead8';ctx.fill();
  }
  function draw(ctx,w,h,id){
    if(!id||id==='none')return;
    const p=w/100;
    ctx.save();
    if(id==='polaroid'){
      ctx.fillStyle='#fffdf5';
      ctx.fillRect(0,0,w,h*.063);ctx.fillRect(0,0,w*.06,h);ctx.fillRect(w*.94,0,w*.06,h);ctx.fillRect(0,h*.81,w,h*.19);
      ctx.fillStyle='#a38a8c';ctx.textAlign='center';ctx.font='italic '+Math.max(9,w*.035)+'px Georgia';
      ctx.fillText('BloomBooth ♡',w/2,h*.913);
    }
    if(id==='film'){
      ctx.fillStyle='#25222a';ctx.fillRect(0,0,p*11,h);ctx.fillRect(w-p*11,0,p*11,h);ctx.fillRect(0,0,w,p*4);ctx.fillRect(0,h-p*4,w,p*4);
      ctx.fillStyle='#fff9ee';for(let i=0;i<11;i++){ctx.fillRect(p*3,h*(.06+i*.082),p*4,p*4);ctx.fillRect(w-p*7,h*(.06+i*.082),p*4,p*4);}
    }
    if(id==='blush'||id==='cream'||id==='retro'){
      ctx.strokeStyle=id==='blush'?'#f6aebd':id==='cream'?'#fff8e9':'#d89d67';
      ctx.lineWidth=p*5;ctx.strokeRect(p*2.5,p*2.5,w-p*5,h-p*5);
      ctx.strokeStyle=id==='blush'?'#fff5f7':id==='cream'?'#e4d6bc':'#ffdb92';
      ctx.lineWidth=p;ctx.strokeRect(p*5,p*5,w-p*10,h-p*10);
      if(id==='blush'){for(const [x,y]of [[p*8,p*8],[w-p*8,p*8],[p*8,h-p*8],[w-p*8,h-p*8]])flower(ctx,x,y,p*5,'#f2a3ae');}
    }
    if(id==='botanical'){
      ctx.strokeStyle='#8daa88';ctx.lineWidth=p*3;ctx.strokeRect(p*1.5,p*1.5,w-p*3,h-p*3);
      for(let i=0;i<9;i++){const yy=h*(.06+i*.11);flower(ctx,p*4,yy,p*3,'#f7e6ba');flower(ctx,w-p*4,h-yy,p*3,'#e6bcb5');}
    }
    if(id==='hearts'){
      ctx.strokeStyle='#f5abb9';ctx.lineWidth=p*5;ctx.strokeRect(p*2.5,p*2.5,w-p*5,h-p*5);
      ctx.fillStyle='#e88194';ctx.textAlign='center';ctx.font=Math.max(9,p*7)+'px serif';
      for(let i=0;i<6;i++){const y=h*(.13+i*.14);ctx.fillText('♥',p*5,y);ctx.fillText('♥',w-p*5,y);}
    }
    if(id==='stars'){
      ctx.strokeStyle='#b7a2d7';ctx.lineWidth=p*4;ctx.strokeRect(p*2,p*2,w-p*4,h-p*4);
      ctx.fillStyle='#fff0b4';ctx.textAlign='center';ctx.font=Math.max(10,p*7)+'px serif';
      for(let i=0;i<8;i++){const y=h*(.08+i*.12);ctx.fillText('✦',p*5,y);ctx.fillText('✧',w-p*5,y);}
    }
    if(id==='confetti'){
      ctx.strokeStyle='#fff9e4';ctx.lineWidth=p*5;ctx.strokeRect(p*2.5,p*2.5,w-p*5,h-p*5);
      const colors=['#e58aa0','#8db2a3','#e8b76f','#af9fd1'];
      for(let i=0;i<52;i++){
        const x=((i*67)%97)/97*w,y=((i*41+17)%97)/97*h;
        if(x>p*15&&x<w-p*15&&y>p*15&&y<h-p*15)continue;
        ctx.save();ctx.translate(x,y);ctx.rotate(i*.47);ctx.fillStyle=colors[i%4];ctx.fillRect(-p*.45,-p*1.2,p*.9,p*2.4);ctx.restore();
      }
    }
    ctx.restore();
  }
  return Object.freeze({frames,draw});
})();