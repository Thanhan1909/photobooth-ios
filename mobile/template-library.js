'use strict';
/**
 * Private local template storage for the signed iPhone app / offline PWA.
 * No network, no third-party template scraping, and no personal photos stored.
 */
window.BloomTemplateLibrary=(()=>{
  const DB='BloomBoothPersonalFrames',STORE='templates',VERSION=1;
  function open(){
    return new Promise((resolve,reject)=>{
      if(!('indexedDB' in window)){reject(Error('Thiết bị không hỗ trợ lưu mẫu'));return;}
      const req=indexedDB.open(DB,VERSION);
      req.onupgradeneeded=()=>{const db=req.result;if(!db.objectStoreNames.contains(STORE))db.createObjectStore(STORE,{keyPath:'id'});};
      req.onsuccess=()=>resolve(req.result);
      req.onerror=()=>reject(req.error||Error('Không thể mở thư viện mẫu'));
    });
  }
  async function transact(mode,operation){
    const db=await open();
    try{
      return await new Promise((resolve,reject)=>{
        const tx=db.transaction(STORE,mode),store=tx.objectStore(STORE);
        const req=operation(store);
        let result;
        req.onsuccess=()=>{result=req.result;};
        req.onerror=()=>reject(req.error||Error('Lỗi lưu khung'));
        tx.oncomplete=()=>resolve(result);
        tx.onerror=()=>reject(tx.error||Error('Lỗi giao dịch'));
        tx.onabort=()=>reject(tx.error||Error('Giao dịch bị hủy'));
      });
    }finally{db.close();}
  }
  async function save(template){
    if(!template||!Array.isArray(template.rects)||!Number.isInteger(template.count)||
      template.count<1||template.count>10||template.rects.length!==template.count)
      throw Error('Bố cục mẫu không hợp lệ');
    const id=String(template.id||('local-'+Date.now()+'-'+Math.floor(Math.random()*1e6)));
    const name=String(template.name||'Khung cá nhân').trim().slice(0,90);
    await transact('readwrite',store=>store.put({
      id,name,count:template.count,ratio:template.ratio,
      layoutId:template.layoutId,
      rects:template.rects.map(r=>({...r})),
      background:template.background||null,
      overlay:template.overlay||null,
      savedAt:Date.now()
    }));
    return id;
  }
  const list=()=>transact('readonly',store=>store.getAll());
  const get=id=>transact('readonly',store=>store.get(String(id)));
  const remove=id=>transact('readwrite',store=>store.delete(String(id)));
  return Object.freeze({save,list,get,remove});
})();
