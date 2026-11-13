'use strict';
/** Selection rules independent of the UI. No image data is uploaded or persisted here. */
window.BloomSelection=(()=>{
  const VALID_COUNTS=[1,3,5];
  function config(frameCount,captureCount=frameCount){
    if(!VALID_COUNTS.includes(frameCount))throw Error('Invalid layout count');
    if(!Number.isInteger(captureCount)||captureCount<frameCount||captureCount>10)throw Error('Invalid capture count');
    return {frameCount,captureCount,needsSelection:captureCount>frameCount};
  }
  function choose(picked,index,required,total){
    if(!Number.isInteger(index)||index<0||index>=total)throw Error('Invalid photo index');
    const next=[...picked];
    const existing=next.indexOf(index);
    if(existing!==-1){next.splice(existing,1);return next;}
    if(next.length>=required)return next;
    next.push(index);return next;
  }
  function arrange(shots,picked,required){
    if(shots.length<required||picked.length!==required||
      new Set(picked).size!==picked.length ||
      picked.some(i=>!Number.isInteger(i)||i<0||i>=shots.length||!shots[i]))
      throw Error('Select exactly '+required+' captured photos');
    return picked.map(i=>shots[i]);
  }
  return Object.freeze({config,choose,arrange});
})();