'use strict';
/**
 * Original BloomBooth frame designs.
 * Penci's public gallery is used solely as high-level visual inspiration.
 * No third-party templates, photographs or branded artwork are copied.
 */
window.BloomFrameArt=(()=>{
  const definitions=[
    ['plain','Khung nguyên bản','classic','#fff8f2','#655c59','#e7c5b5','plain','BLOOM BOOTH'],
    ['duckling','Vịt vàng vui nhộn','cute','#fff9d9','#76582b','#facb57','duckling','QUACK QUACK'],
    ['blue-gingham','Caro xanh idol','trend','#d7e9fd','#254e7f','#84b5e6','gingham','BLUE DAY'],
    ['pink-ribbon','Nơ hồng Coquette','trend','#ffe2ef','#965372','#e9a8cb','ribbon','SWEET LITTLE DAY'],
    ['schoolbook','Vở ô ly học trò','classic','#fff8e8','#325f93','#e9ab6e','notebook','OUR SCHOOL DAYS'],
    ['music-player','Máy nghe nhạc Y2K','trend','#fce6f5','#8054a4','#91e4ba','player','PLAY OUR MOMENTS'],
    ['cassette','Băng cassette retro','retro','#f3debf','#684c41','#df967c','cassette','MIXTAPE MEMORIES'],
    ['film-roll','Cuộn phim 35mm','retro','#26272b','#f7f1e4','#d2a565','film','FRAME BY FRAME'],
    ['newspaper','Trang báo kỷ niệm','retro','#f7f0df','#45403c','#bcaa8d','newspaper','THE DAILY BLOOM'],
    ['postcard','Bưu thiếp du lịch','classic','#f9ebd8','#795f4a','#d79e7e','postcard','WISH YOU WERE HERE'],
    ['airmail','Phong thư Air Mail','retro','#fff9ed','#b35b52','#496d99','airmail','LOVE FROM HERE'],
    ['polaroid','Polaroid xếp chồng','retro','#ece1cd','#5e5451','#f5faf7','polaroid','INSTANT MOMENTS'],
    ['heart-stamp','Tem trái tim','cute','#ffeaec','#a44265','#fd9cbe','heartstamp','LOVE POST'],
    ['sticker-sheet','Trang sticker đáng yêu','cute','#f0edff','#6652a3','#f6b2d9','stickers','STICKER CLUB'],
    ['pixel-game','Máy chơi game pixel','trend','#d5eff1','#305c67','#c7a1ff','pixel','PLAYER ONE'],
    ['comic-book','Truyện tranh Pop Art','trend','#fdf0c8','#242a5d','#fd608b','comic','WOW!'],
    ['arcade','Máy game Arcade','trend','#2a1d4e','#e5ff7c','#f38afa','arcade','LEVEL UP!'],
    ['starry-night','Bầu trời sao','cute','#222746','#ecddff','#91a7fc','night','STARRY MOMENTS'],
    ['moon-phase','Pha mặt trăng','classic','#33354f','#f3dfba','#d3b3a3','moon','UNDER THE MOON'],
    ['cloud-dream','Mây trắng bồng bềnh','cute','#c8e9fd','#386f91','#fffdf6','cloud','DREAM A LITTLE'],
    ['sunset','Nắng chiều hoàng hôn','trend','#ffe2ce','#955269','#f3a480','sunset','GOLDEN HOUR'],
    ['rainbow','Cầu vồng pastel','cute','#fff1fa','#9c78a3','#f9c77e','rainbow','OVER THE RAINBOW'],
    ['cherry-blossom','Hoa anh đào','cute','#ffedf4','#b36b83','#f9b8c9','cherry','SPRING BLOOM'],
    ['sunflower','Vườn hướng dương','cute','#fff5cc','#6f7048','#f1bc42','sunflower','HELLO SUNSHINE'],
    ['botanical','Lá cỏ ép khô','classic','#f2f6e8','#4a7555','#9ab98c','botanical','GROW TOGETHER'],
    ['wildflower','Hoa dại mùa xuân','cute','#fdf4e7','#8b6177','#c29cce','wildflower','FLOWER FIELD'],
    ['sea-shell','Biển xanh vỏ sò','classic','#e3f7f5','#3c8793','#f6c7a9','seashell','SALT & SUN'],
    ['ocean-wave','Sóng biển dập dìu','trend','#d7ecfc','#295c8d','#75b9e9','wave','OCEAN MEMORIES'],
    ['lemon-picnic','Tiệc picnic chanh','cute','#f8f7cf','#57764b','#ebcf54','lemon','PICNIC DAY'],
    ['strawberry','Dâu tây ngọt','cute','#ffeaef','#9e4865','#ec7693','strawberry','BERRY SWEET'],
    ['cherry-soda','Cherry Soda','trend','#f9dada','#942e4f','#f5a1ac','cherrysoda','CHERRY POP'],
    ['matcha-cafe','Quán cà phê matcha','trend','#e1eacc','#48634d','#9db882','matcha','MATCHA DATE'],
    ['coffee-receipt','Hóa đơn tiệm cà phê','retro','#fff9ec','#6a5c53','#c6aa86','receipt','YOUR PHOTO RECEIPT'],
    ['ticket','Vé xem phim','retro','#f7e7d7','#854e49','#d8998d','ticket','ADMIT ONE'],
    ['concert','Vé concert idol','trend','#dddefb','#4c3b92','#e29ffc','concert','BACKSTAGE PASS'],
    ['graduation','Kỷ yếu tốt nghiệp','classic','#f0e5df','#444c70','#d5ad85','graduation','CLASS OF MEMORIES'],
    ['birthday','Bánh kem sinh nhật','cute','#ffeff2','#a365a3','#f2bd6c','birthday','HAPPY BIRTHDAY'],
    ['christmas','Noel tuyết rơi','cute','#f5f1e9','#416c53','#c73a49','christmas','CHRISTMAS TIME'],
    ['halloween','Đêm Halloween','trend','#3e3455','#ffe3a6','#f19b55','halloween','BOO!'],
    ['vietnam','Việt Nam trong tim','classic','#ffede4','#ad3f3d','#eab84b','vietnam','VIET NAM'],
    ['lunar-new-year','Tết hoa mai','classic','#fff1e4','#b84846','#edba55','tet','HAPPY NEW YEAR']
  ];
  const catalog=definitions.map(([id,label,category,bg,ink,accent,motif,title])=>({id,label,category,bg,ink,accent,motif,title}));
  const PI=Math.PI;
  function draw(ctx,w,h,frame){
    if(!frame||frame.id==='plain')return;
    const u=w/1000, P=(x)=>x*u, Y=(y)=>h*y;
    const c=frame.accent,k=frame.ink;
    const fill=(x,y,ww,hh,col=c)=>{ctx.fillStyle=col;ctx.fillRect(P(x),Y(y),P(ww),Y(hh));};
    const line=(x1,y1,x2,y2,col=k,thick=3)=>{
      ctx.beginPath();ctx.strokeStyle=col;ctx.lineWidth=P(thick);
      ctx.moveTo(P(x1),Y(y1));ctx.lineTo(P(x2),Y(y2));ctx.stroke();
    };
    const oval=(x,y,r,col=c)=>{
      ctx.beginPath();ctx.fillStyle=col;ctx.arc(P(x),Y(y),P(r),0,PI*2);ctx.fill();
    };
    const ring=(x,y,r,col=k)=>{
      ctx.beginPath();ctx.strokeStyle=col;ctx.lineWidth=P(4);ctx.arc(P(x),Y(y),P(r),0,PI*2);ctx.stroke();
    };
    const label=(s,x,y,size=35,col=k,weight='700')=>{
      ctx.fillStyle=col;ctx.font=weight+' '+Math.round(P(size))+'px Arial,sans-serif';
      ctx.textAlign='center';ctx.fillText(s,P(x),Y(y),P(900));
    };
    const star=(x,y,r=18,col=c)=>{
      ctx.beginPath();ctx.fillStyle=col;
      for(let j=0;j<10;j++){
        const a=j*PI/5-PI/2,R=j%2===0?P(r):P(r*.44);
        const xx=P(x)+Math.cos(a)*R, yy=Y(y)+Math.sin(a)*R;
        if(j===0)ctx.moveTo(xx,yy);else ctx.lineTo(xx,yy);
      }
      ctx.closePath();ctx.fill();
    };
    const flower=(x,y,r=17,col=c)=>{
      for(let j=0;j<5;j++){
        const a=j*PI*2/5;
        oval(x+Math.cos(a)*r*.65,y+Math.sin(a)*r*.65*u/h,r*.44,col);
      }
      oval(x,y,r*.3,'#fff5d8');
    };
    const heart=(x,y,r=20,col=c)=>{label('♥',x,y,r*1.8,col,'900');};
    const diamond=(x,y,r=20,col=c)=>{
      ctx.beginPath();ctx.fillStyle=col;
      ctx.moveTo(P(x),Y(y)-P(r));ctx.lineTo(P(x+r),Y(y));ctx.lineTo(P(x),Y(y)+P(r));ctx.lineTo(P(x-r),Y(y));ctx.closePath();ctx.fill();
    };
    const corner=(fn,n=8)=>{
      for(let i=0;i<n;i++){const y=.125+i*(.745/Math.max(1,n-1));fn(40,y,i);fn(960,y,i);}
    };
    const border=(col=k,size=10)=>{ctx.strokeStyle=col;ctx.lineWidth=P(size);ctx.strokeRect(P(18),Y(.025),w-P(36),h*.95);};
    ctx.save();
    switch(frame.motif){
      case 'duckling':{
        corner((x,y,i)=>{oval(x,y,17,'#ffe05f');oval(x-6,y-0.002,3,'#222');oval(x+6,y-0.002,3,'#222');fill(x-8,y+.006,16,.005,'#e99c34');},9);
        label('QUACK!',500,.047,54,'#e8a22f');label('little sunshine',500,.978,28,k);break;
      }
      case 'gingham':{
        for(let x=0;x<1000;x+=74){fill(x,0,27,1,'#9dc5ed66');}
        for(let i=0;i<32;i++){
          const y=i/32;
          line(0,y,72,y,'#7aa9d96a',2);
          line(928,y,1000,y,'#7aa9d96a',2);
        }
        corner((x,y,i)=>diamond(x,y,14,i%2?k:c),10);label('BLUE CHECK DAY',500,.978,32);break;
      }
      case 'ribbon':{
        corner((x,y,i)=>{heart(x,y,17,i%2?c:k);},8);
        label('୨୧  SWEET DAYS  ୨୧',500,.045,40);
        line(155,.963,845,.963,c,8);label('made of tiny moments',500,.98,24);break;
      }
      case 'notebook':{
        for(let i=0;i<60;i++){
          line(0,i/60,75,i/60,'#e3a97455',2);
          line(925,i/60,1000,i/60,'#e3a97455',2);
        }
        line(85,0,85,1,'#ce77778c',7);corner((x,y,i)=>ring(x,y,11,'#92a9c2'),12);
        label('Dear diary...',500,.972,44,k,'400');break;
      }
      case 'player':{
        fill(40,.95,920,.033,'#ffb3d3');oval(220,.965,19,'#82d7ad');
        label('◀',390,.973,34,k);label('▶',610,.973,34,k);
        label('♪',820,.973,47,k);label('00:23  —  03:45',500,.05,31,k);border('#df9bc6',5);break;
      }
      case 'cassette':{
        fill(100,.945,800,.05,'#b77e66');oval(325,.969,35,'#ead4ae');oval(675,.969,35,'#ead4ae');
        ring(325,.969,25,k);ring(675,.969,25,k);label('SIDE A · 90 MIN',500,.047,40);corner((x,y)=>oval(x,y,7,k),12);break;
      }
      case 'film':{
        fill(0,0,85,1,k);fill(915,0,85,1,k);
        for(let i=0;i<27;i++){fill(20,i/27+.004,45,.017,'#fff7e6');fill(935,i/27+.004,45,.017,'#fff7e6');}
        label('35 MM — 400 ISO',500,.05,36,c);label('01 · 02 · 03',500,.973,33,c);break;
      }
      case 'newspaper':{
        line(68,.084,932,.084,k,8);line(68,.935,932,.935,k,8);
        label('THE BLOOM TIMES',500,.046,60,k,'900');
        label('A MOMENT TO REMEMBER',500,.965,29);corner((x,y,i)=>label('NEWS',x,y,16),6);break;
      }
      case 'postcard':{
        border('#bb9169',5);fill(740,.036,160,.045,'#f4d6c5');
        label('POST CARD',500,.063,57);label('SENT WITH LOVE',500,.962,32);
        corner((x,y,i)=>star(x,y,13,i%2?k:c),7);break;
      }
      case 'airmail':{
        for(let i=0;i<18;i++){
          const x=i*60;fill(x,0,30,.019,i%2?'#bf4d50':'#547ca6');
          fill(x,.983,30,.017,i%2?'#547ca6':'#bf4d50');
        }
        border('#be5d58',5);label('AIR MAIL',500,.05,49);label('FROM ME TO YOU',500,.969,34);break;
      }
      case 'polaroid':{
        fill(0,.9,1000,.1,'#fefbf2');
        label('instant camera',500,.95,48,k,'400');
        for(let i=0;i<6;i++){line(60,.07+i*.015,940,.07+i*.015,'#ddccbc',2);}
        label('♡',850,.976,56,c);break;
      }
      case 'heartstamp':{
        for(let i=0;i<15;i++){
          const y=i*.066;heart(30,y+.04,22,i%2?c:k);heart(970,y+.04,22,i%2?k:c);
        }
        border(c,3);label('LOVE LETTER',500,.05,47);label('SEALED WITH A KISS',500,.974,30);break;
      }
      case 'stickers':{
        const signs=['★','✿','♡','☆','✦','☻','☁','♥'];
        corner((x,y,i)=>{label(signs[i%signs.length],x,y,43,i%2?c:k);},12);
        fill(250,.955,500,.032,'#efd0e9');label('STICKER CLUB',500,.979,34);break;
      }
      case 'pixel':{
        for(let i=0;i<12;i++){fill(i%2?15:940,.1+i*.07,42,.021,i%3?c:k);}
        label('PIXEL WORLD',500,.046,52);label('HP  ♥ ♥ ♥',500,.975,45,'#de77a8');border('#6e9ca5',7);break;
      }
      case 'comic':{
        border('#242a5d',12);corner((x,y,i)=>star(x,y,19,i%2?c:'#ffe66f'),6);
        fill(205,.95,590,.041,'#fff');
        label('POW! WOW!',500,.982,58,'#e54276','900');break;
      }
      case 'arcade':{
        border('#ff95e8',11);
        for(let i=0;i<20;i++){diamond(i%2?44:956,.1+i*.04,11,i%2?c:k);}
        label('INSERT COIN',500,.047,53,'#d4fa79');label('HIGH SCORE 99999',500,.975,37,'#b6f79c');break;
      }
      case 'night':{
        for(let i=0;i<64;i++){const x=(i*157)%1000,y=((i*73)%1000)/1000;oval(x,y,i%7?2:6,'#ebe8ff');}
        label('★ STARRY NIGHT ★',500,.048,40,'#e5d8ff');label('dreaming with you',500,.974,32,'#e5d8ff');break;
      }
      case 'moon':{
        for(let i=0;i<7;i++){const x=155+i*115;oval(x,.044,24,'#e7d9ba');oval(x+13,.042,20,frame.bg);}
        corner((x,y)=>star(x,y,9,'#e8d5b5'),9);label('MOONLIGHT',500,.973,44,'#f8ead0');break;
      }
      case 'cloud':{
        for(const y of [.02,.975]){
          for(let i=0;i<9;i++){oval(i*130,y,42,'#ffffff');oval(i*130+47,y,35,'#f5fcff');}
        }
        label('CLOUD NINE',500,.059,40);corner((x,y)=>oval(x,y,9,'#fff'),8);break;
      }
      case 'sunset':{
        for(let i=0;i<13;i++){line(0,i*.013,1000,i*.013,i%2?'#f5a480':'#f8c5aa',9);}
        oval(840,.96,61,'#ffa55f');label('GOLDEN HOUR',470,.982,43);corner((x,y)=>star(x,y,12,c),7);break;
      }
      case 'rainbow':{
        const cols=['#f0b7bf','#f2d68b','#a2d7b4','#acc8eb','#d5b5e9'];
        for(let i=0;i<5;i++){
          ctx.beginPath();ctx.strokeStyle=cols[i];ctx.lineWidth=P(18);
          ctx.arc(P(500),Y(.95),P(150-i*24),PI,PI*2);ctx.stroke();
        }
        label('COLOURFUL US',500,.048,41);corner((x,y)=>oval(x,y,8,c),9);break;
      }
      case 'cherry':{
        corner((x,y,i)=>flower(x,y,20,i%2?c:'#fbc3d6'),10);
        label('桜 · SAKURA',500,.048,51);
        for(let i=0;i<14;i++)oval((i*71)%1000,.948+(i%3)*.01,6,'#f4adc2');break;
      }
      case 'sunflower':{
        corner((x,y)=>{for(let i=0;i<8;i++){
          const a=i*PI/4;oval(x+Math.cos(a)*19,y+Math.sin(a)*.008,10,'#e6ae3d');
        }oval(x,y,12,'#694c32');},8);
        label('SUNNY SIDE UP',500,.973,45);break;
      }
      case 'botanical':{
        border('#618b72',4);
        corner((x,y,i)=>{line(x,y-.014,x+12,y+.016,k,3);oval(x+12,y,12,i%2?c:k);},10);
        label('HERBARIUM No. 01',500,.974,35);break;
      }
      case 'wildflower':{
        corner((x,y,i)=>flower(x,y,13,i%3===0?'#f3b69f':i%3===1?c:'#a9c6b7'),13);
        label('WILD & FREE',500,.049,43);label('bloom where you are',500,.97,33);break;
      }
      case 'seashell':{
        corner((x,y,i)=>{for(let j=0;j<5;j++)line(x,y,x+(j-2)*8,y+.016,'#b3887c',3);},10);
        label('BY THE SEASIDE',500,.049,42);label('♡  sea salt  ♡',500,.975,34);break;
      }
      case 'wave':{
        for(let j=0;j<4;j++){
          ctx.beginPath();ctx.strokeStyle=j%2?c:k;ctx.lineWidth=P(8);
          for(let i=0;i<=80;i++){
            const x=i*12.5,y=.94+j*.017+Math.sin(i*.28+j)*.008;
            if(i===0)ctx.moveTo(P(x),Y(y));else ctx.lineTo(P(x),Y(y));
          }ctx.stroke();
        }
        label('WAVE AFTER WAVE',500,.048,39);break;
      }
      case 'lemon':{
        corner((x,y,i)=>{oval(x,y,17,'#f1d85a');line(x+7,y-.008,x+18,y-.016,k,3);},9);
        label('SQUEEZE THE DAY',500,.05,44);label('PICNIC TIME',500,.975,41);break;
      }
      case 'strawberry':{
        corner((x,y,i)=>{oval(x,y,16,'#e65d79');star(x,y-.009,9,'#74996b');},10);
        label('BERRY GOOD DAY',500,.05,43);heart(500,.974,28,c);break;
      }
      case 'cherrysoda':{
        corner((x,y,i)=>{oval(x-10,y,14,'#bf3d59');oval(x+12,y,14,'#bf3d59');line(x-10,y,x+8,y-.019,k,3);},8);
        label('POP! SODA! POP!',500,.051,47);label('CHERRY BABY',500,.975,40);break;
      }
      case 'matcha':{
        corner((x,y,i)=>{fill(x-17,y-.009,34,.02,'#dceac3');oval(x,y,9,'#85a978');},9);
        label('MATCHA O CLOCK',500,.05,41);label('tea time together',500,.97,31);break;
      }
      case 'receipt':{
        for(let i=0;i<12;i++){fill(i*85,.01,40,.005,k);fill(i*85,.99,40,.005,k);}
        label('ORDER # 001',500,.045,40);label('PHOTO x '+frame.title,500,.967,29);
        line(100,.945,900,.945,k,4);break;
      }
      case 'ticket':{
        border('#c78e81',6);
        for(let i=0;i<18;i++){oval(18,.08+i*.047,10,frame.bg);oval(982,.08+i*.047,10,frame.bg);}
        label('ADMIT ONE',500,.048,53);label('TICKET # 0001',500,.975,33);break;
      }
      case 'concert':{
        border('#866cc5',8);corner((x,y,i)=>star(x,y,15,i%2?'#c78ad9':'#9ce8ff'),10);
        label('ALL ACCESS PASS',500,.048,48);label('LIVE • FOREVER',500,.974,41);break;
      }
      case 'graduation':{
        label('CLASS OF 2026',500,.052,51);
        corner((x,y,i)=>{fill(x-17,y-.01,34,.017,'#5c6590');line(x-17,y-.01,x,y-.021,k,3);},8);
        label('THE BEST IS YET TO COME',500,.973,29);break;
      }
      case 'birthday':{
        corner((x,y,i)=>{oval(x,y,15,i%2?c:'#f8c3aa');line(x,y+.01,x+7,y+.021,k,2);},9);
        label('MAKE A WISH!',500,.049,48);label('HAPPY DAY TO YOU',500,.976,37);break;
      }
      case 'christmas':{
        corner((x,y,i)=>{star(x,y,16,i%2?'#d4474f':'#568b6b');},11);
        label('MERRY & BRIGHT',500,.05,45);label('☃  HAPPY HOLIDAYS  ☃',500,.975,34);break;
      }
      case 'halloween':{
        corner((x,y,i)=>{oval(x,y,19,'#e89b51');oval(x-7,y-.003,3,k);oval(x+7,y-.003,3,k);},9);
        label('TRICK OR TREAT',500,.05,47);label('BOO! BOO! BOO!',500,.974,41);break;
      }
      case 'vietnam':{
        border('#b64844',9);corner((x,y,i)=>star(x,y,17,i%2?'#d7ab51':'#b64844'),8);
        label('VIET NAM IN MY HEART',500,.049,35);label('TỰ HÀO VIỆT NAM',500,.977,38);break;
      }
      case 'tet':{
        corner((x,y,i)=>flower(x,y,17,'#eac452'),11);
        label('CHÚC MỪNG NĂM MỚI',500,.05,37);
        label('XUÂN VUI VẺ',500,.976,41);break;
      }
      default:break;
    }
    ctx.restore();
  }
  return Object.freeze({catalog,draw});
})();
