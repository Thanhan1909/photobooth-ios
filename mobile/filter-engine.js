/* Photobooth mobile filter engine.
 * Adapted design ideas: manekinekko/photobooth (MIT), peterpeterparker/web-photo-filter (MIT),
 * xdadda/mini-gl (MIT), njpietrow/Filter.io (MIT), a-hakim/senangwebs-photobooth (MIT).
 * See FILTER-SOURCES.md. All pixel-processing implementations below are original.
 */
'use strict';
window.PhotoboothFilters = (() => {
  const raw = [
    ['none','Không filter','none','base'],
    ['color','Vivid','saturate(1.55) contrast(1.08)','base'],
    ['cool','Cool','saturate(1.12) hue-rotate(14deg)','base'],
    ['warm','Warm','sepia(.23) saturate(1.22) brightness(1.06)','base'],
    ['antique','Antique','sepia(.75) contrast(1.12) brightness(.92)','base'],
    ['aqua','Aqua','hue-rotate(155deg) saturate(1.65)','base'],
    ['blue','Blue','sepia(.45) hue-rotate(160deg) saturate(1.7)','base'],
    ['blur','Soft Blur','blur(2px)','base'],
    ['everglow','Everglow','brightness(1.19) saturate(1.25)','base'],
    ['grayscale','B&W','grayscale(1)','base'],
    ['green','Green','sepia(.45) hue-rotate(60deg) saturate(1.5)','base'],
    ['negative','Negative','invert(1)','base'],
    ['pink','Pink','sepia(.3) hue-rotate(285deg) saturate(1.4)','base'],
    ['red','Red','sepia(.5) hue-rotate(305deg) saturate(1.55)','base'],
    ['retro','Retro','sepia(.45) contrast(1.13) saturate(.78)','base'],
    ['sepia','Sepia','sepia(.8)','base'],
    ['summer','Summer','sepia(.18) saturate(1.4) brightness(1.09)','base'],
    ['vintage','Vintage','sepia(.55) contrast(.86) brightness(.96)','base'],
    ['washed','Washed','contrast(.72) brightness(1.13)','base'],
    ['yellow','Golden','sepia(.4) saturate(1.4) hue-rotate(347deg)','base'],
    ['polaroid','Polaroid','contrast(1.1) saturate(.8) sepia(.15) brightness(1.05)','web-photo-filter'],
    ['kodachrome','Kodachrome','contrast(1.22) saturate(1.35) sepia(.1)','web-photo-filter'],
    ['technicolor','Technicolor','contrast(1.22) saturate(1.9)','web-photo-filter'],
    ['cookie','Cookie','sepia(.24) contrast(1.14) saturate(1.25)','web-photo-filter'],
    ['blue-monotone','Blue Monotone','grayscale(.85) sepia(.32) hue-rotate(167deg)','web-photo-filter'],
    ['tomato','Tomato','sepia(.38) saturate(1.85) hue-rotate(309deg)','web-photo-filter'],
    ['brownie','Brownie','sepia(.73) contrast(1.34) saturate(.83)','manekinekko'],
    ['pinhole','Pinhole','sepia(.23) contrast(1.22) brightness(.87)','manekinekko'],
    ['crt','CRT','contrast(1.2) saturate(.8)','manekinekko'],
    ['clarendon','Clarendon','contrast(1.27) saturate(1.35) brightness(1.04)','mini-gl'],
    ['juno','Juno','sepia(.14) saturate(1.5) contrast(1.09)','mini-gl'],
    ['lark','Lark','brightness(1.12) saturate(.86) contrast(1.05)','mini-gl'],
    ['reyes','Reyes','sepia(.27) brightness(1.1) contrast(.9)','mini-gl'],
    ['crema','Crema','sepia(.23) contrast(.89) brightness(1.1)','mini-gl'],
    ['aden','Aden','sepia(.19) saturate(.87) brightness(1.1)','mini-gl'],
    ['ludwig','Ludwig','brightness(1.1) saturate(1.11) contrast(1.15)','mini-gl'],
    ['sharpen','Sharpen','contrast(1.08)','senangwebs'],
    ['emboss','Emboss','grayscale(1) contrast(1.3)','manekinekko'],
    ['edges','Edges','grayscale(1) contrast(1.4)','manekinekko'],
    ['pixelate','Pixelate','none','manekinekko'],
    ['vignette','Vignette','contrast(1.09)','manekinekko'],
    ['film-grain','Film Grain','sepia(.13) contrast(1.09)','senangwebs'],
    ['soft-portrait','Portrait','brightness(1.08) contrast(.92) saturate(1.12)','senangwebs']
  ];
  const presets = raw.map(([id,label,css,source]) => ({id,label,css,source}));
  const clamp = x => Math.max(0, Math.min(255, x));
  function convolution(imageData, kernel, divisor=1, bias=0) {
    const {width:w,height:h,data:original} = imageData;
    const source = new Uint8ClampedArray(original), size = Math.sqrt(kernel.length);
    const center = Math.floor(size/2);
    for(let y=1;y<h-1;y++) for(let x=1;x<w-1;x++) {
      const p=(y*w+x)*4;
      for(let c=0;c<3;c++) {
        let sum=0;
        for(let ky=0;ky<size;ky++) for(let kx=0;kx<size;kx++){
          const xx=Math.min(w-1,Math.max(0,x+kx-center));
          const yy=Math.min(h-1,Math.max(0,y+ky-center));
          sum+=source[(yy*w+xx)*4+c]*kernel[ky*size+kx];
        }
        original[p+c]=clamp(sum/divisor+bias);
      }
    }
  }
  function cssPixels(img, spec) {
    if (!spec || spec === 'none') return;
    const steps = [...spec.matchAll(/([a-z-]+)\(([^)]+)\)/g)];
    if (!steps.length) return;
    const data = img.data;
    const values = steps.map(([, name, v]) => {
      const number = parseFloat(v), amount = v.endsWith('%') ? number / 100 : number;
      return {name, amount: Number.isFinite(amount) ? amount : 0};
    });
    const rad = Math.PI / 180;
    const luma = [0.2126,0.7152,0.0722];
    for (let i = 0; i < data.length; i += 4) {
      let r=data[i], g=data[i+1], b=data[i+2];
      for (const {name,amount:a} of values) {
        let rr=r, gg=g, bb=b;
        if (name === 'brightness') {rr=r*a;gg=g*a;bb=b*a;}
        if (name === 'contrast') {rr=(r-127.5)*a+127.5;gg=(g-127.5)*a+127.5;bb=(b-127.5)*a+127.5;}
        if (name === 'invert') {rr=r*(1-a)+(255-r)*a;gg=g*(1-a)+(255-g)*a;bb=b*(1-a)+(255-b)*a;}
        if (name === 'grayscale' || name === 'saturate') {
          const s = name === 'grayscale' ? 1-Math.min(1,a) : a;
          const gray=luma[0]*r+luma[1]*g+luma[2]*b;
          rr=gray*(1-s)+r*s;gg=gray*(1-s)+g*s;bb=gray*(1-s)+b*s;
        }
        if (name === 'sepia') {
          const sr=.393*r+.769*g+.189*b;
          const sg=.349*r+.686*g+.168*b;
          const sb=.272*r+.534*g+.131*b;
          rr=r*(1-a)+sr*a;gg=g*(1-a)+sg*a;bb=b*(1-a)+sb*a;
        }
        if (name === 'hue-rotate') {
          const angle=a*rad, c=Math.cos(angle), s=Math.sin(angle);
          rr=(.213+c*.787-s*.213)*r+(.715-c*.715-s*.715)*g+(.072-c*.072+s*.928)*b;
          gg=(.213-c*.213+s*.143)*r+(.715+c*.285+s*.140)*g+(.072-c*.072-s*.283)*b;
          bb=(.213-c*.213-s*.787)*r+(.715-c*.715+s*.715)*g+(.072+c*.928+s*.072)*b;
        }
        r=Math.max(0,Math.min(255,rr));
        g=Math.max(0,Math.min(255,gg));
        b=Math.max(0,Math.min(255,bb));
      }
      data[i]=r;data[i+1]=g;data[i+2]=b;
    }
    if (values.some(v=>v.name==='blur')) {
      convolution(img,[1,2,1,2,4,2,1,2,1],16);
    }
  }
  function pixelate(imageData,block=9){
    const {width:w,height:h,data:a}=imageData;
    for(let y=0;y<h;y+=block)for(let x=0;x<w;x+=block){
      let red=0,green=0,blue=0,n=0;
      for(let yy=y;yy<Math.min(h,y+block);yy++)for(let xx=x;xx<Math.min(w,x+block);xx++){
        const i=(yy*w+xx)*4;red+=a[i];green+=a[i+1];blue+=a[i+2];n++;
      }
      red/=n;green/=n;blue/=n;
      for(let yy=y;yy<Math.min(h,y+block);yy++)for(let xx=x;xx<Math.min(w,x+block);xx++){
        const i=(yy*w+xx)*4;a[i]=red;a[i+1]=green;a[i+2]=blue;
      }
    }
  }
  function grain(imageData) {
    const {data:a,width:w}=imageData;
    for(let i=0;i<a.length;i+=4){
      // Stable pseudo-noise by pixel index. Results stay identical across downloads.
      const x=i/4, noise=(((x*1103515245+12345)>>>8)&31)-15;
      a[i]=clamp(a[i]+noise);a[i+1]=clamp(a[i+1]+noise);a[i+2]=clamp(a[i+2]+noise);
    }
  }
  function matrix(imageData,id) {
    // Neutral color grading approximations inspired by the MIT-licensed filter collections.
    const matrices={
      'polaroid':[[1.15,-.08,-.08,8],[-.05,1.1,-.02,5],[-.04,-.04,1.03,2]],
      'kodachrome':[[1.27,-.12,-.09,4],[-.07,1.12,-.02,0],[-.02,-.18,1.24,1]],
      'technicolor':[[1.48,-.28,-.17,0],[-.2,1.38,-.15,0],[-.14,-.15,1.35,0]],
      'cookie':[[1.13,.03,-.1,8],[.01,1.04,-.07,3],[-.07,.07,.89,4]],
      'blue-monotone':[[.38,.40,.17,2],[.18,.57,.1,3],[.12,.39,.69,13]],
      'tomato':[[1.19,.05,.04,12],[-.06,.96,-.01,0],[-.11,-.06,.75,0]]
    };
    const m=matrices[id];if(!m)return;
    const a=imageData.data;
    for(let i=0;i<a.length;i+=4){
      const r=a[i],g=a[i+1],b=a[i+2];
      for(let c=0;c<3;c++)a[i+c]=clamp(m[c][0]*r+m[c][1]*g+m[c][2]*b+m[c][3]);
    }
  }
  function vignette(ctx,w,h){
    const gradient=ctx.createRadialGradient(w/2,h/2,Math.min(w,h)*.12,w/2,h/2,Math.max(w,h)*.72);
    gradient.addColorStop(0,'rgba(0,0,0,0)');
    gradient.addColorStop(1,'rgba(0,0,0,.58)');
    ctx.fillStyle=gradient;ctx.fillRect(0,0,w,h);
  }
  function apply(canvas,source,preset){
    const max=1600, w=source.width||source.naturalWidth, h=source.height||source.naturalHeight;
    if(!w||!h)throw Error('Không đọc được kích thước ảnh');
    const scale=Math.min(1,max/Math.max(w,h));
    canvas.width=Math.max(1,Math.round(w*scale));
    canvas.height=Math.max(1,Math.round(h*scale));
    const ctx=canvas.getContext('2d',{willReadFrequently:true});
    const useMatrix=preset.source==='web-photo-filter';
    ctx.drawImage(source,0,0,canvas.width,canvas.height);
    const id=preset.id;
    if(preset.css !== 'none' || useMatrix || ['sharpen','emboss','edges','pixelate','film-grain'].includes(id)){
      const img=ctx.getImageData(0,0,canvas.width,canvas.height);
      if(useMatrix)matrix(img,id);
      else cssPixels(img,preset.css);
      if(id==='sharpen')convolution(img,[0,-1,0,-1,5,-1,0,-1,0]);
      if(id==='emboss')convolution(img,[-2,-1,0,-1,1,1,0,1,2],1,128);
      if(id==='edges')convolution(img,[-1,-1,-1,-1,8,-1,-1,-1,-1]);
      if(id==='pixelate')pixelate(img);
      if(id==='film-grain')grain(img);
      ctx.putImageData(img,0,0);
    }
    if(['vignette','pinhole','crt'].includes(id))vignette(ctx,canvas.width,canvas.height);
    if(id==='crt'){
      ctx.fillStyle='rgba(0,0,0,.16)';
      for(let y=0;y<canvas.height;y+=4)ctx.fillRect(0,y,canvas.width,1);
    }
    return canvas;
  }
  return Object.freeze({presets,apply});
})();
