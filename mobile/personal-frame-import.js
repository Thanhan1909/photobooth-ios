'use strict';
/**
 * An opt-in importer for images the user has saved for personal use.
 * The public app bundles only slot metadata. JPEGs remain untracked on E:.
 * Imported image files are stored in the device's private IndexedDB.
 */
window.BloomPersonalFrameImporter=(()=>{
  const defs=window.BloomPersonalFrameDefs||[];
  const library=window.BloomTemplateLibrary;
  if(!library)return null;
  const normalize=num=>String(num).padStart(2,'0');
  const getIndex=fileName=>{
    const name=String(fileName).toLowerCase();
    const match=name.match(/(?:ref[_ -]?|pinterest[_ -]?|pin[_ -]?)(\d{1,2})(?:\D|$)/);
    return match?Number(match[1]):null;
  };
  function readImage(file){
    return new Promise((resolve,reject)=>{
      if(!file?.type?.startsWith('image/')){reject(Error('File không phải ảnh'));return;}
      if(file.size>12*1024*1024){reject(Error('File ảnh vượt 12 MB'));return;}
      const reader=new FileReader();
      reader.onerror=()=>reject(reader.error||Error('Không đọc được ảnh'));
      reader.onload=()=>{
        const image=new Image();
        image.onerror=()=>reject(Error('Ảnh không hợp lệ'));
        image.onload=()=>{
          // Limit huge image memory footprint while preserving graphic details.
          const max=1800,scale=Math.min(1,max/Math.max(image.width,image.height));
          const canvas=document.createElement('canvas');
          canvas.width=Math.max(1,Math.round(image.width*scale));
          canvas.height=Math.max(1,Math.round(image.height*scale));
          canvas.getContext('2d').drawImage(image,0,0,canvas.width,canvas.height);
          resolve({dataURL:canvas.toDataURL('image/jpeg',.91),ratio:canvas.width/canvas.height});
        };
        image.src=reader.result;
      };
      reader.readAsDataURL(file);
    });
  }
  async function importFiles(files,onProgress=()=>{}){
    const list=Array.from(files||[]);
    const summary={imported:[],skipped:[],errors:[]};
    for(const file of list){
      const number=getIndex(file.name);
      const def=defs.find(d=>d.number===number);
      if(!def){summary.skipped.push(file.name);continue;}
      try{
        const image=await readImage(file);
        await library.save({
          id:'pinterest-personal-'+normalize(number),
          name:normalize(number)+' · '+def.name,
          count:def.slots.length,
          layoutId:'classic-strip',
          ratio:image.ratio,
          rects:def.slots.map(s=>({...s})),
          background:image.dataURL,
          photoReplace:true,
          referenceFile:file.name
        });
        summary.imported.push(number);
        onProgress('Đã nạp '+summary.imported.length+' khung cá nhân');
      }catch(error){summary.errors.push({name:file.name,error:error?.message||String(error)});}
    }
    return summary;
  }
  async function installLocalPack(onProgress=()=>{}){
    // Works on the user-owned LAN server only. Public GitHub builds do not
    // contain the JPEGs; no Pinterest images are uploaded or shared.
    const base=new URL('./private-frames/',document.baseURI);
    const result={imported:[],skipped:[],errors:[]};
    for(const d of defs){
      const name='ref_'+normalize(d.number)+'.jpg';
      try{
        const response=await fetch(new URL(name,base),{cache:'no-store'});
        if(!response.ok)throw Error('HTTP '+response.status);
        const blob=await response.blob();
        const file=new File([blob],name,{type:'image/jpeg'});
        const one=await importFiles([file],onProgress);
        result.imported.push(...one.imported);
        result.errors.push(...one.errors);
      }catch(error){result.errors.push({name,error:error?.message||String(error)});}
    }
    return result;
  }
  return Object.freeze({importFiles,installLocalPack,getIndex});
})();
