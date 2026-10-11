'use strict';
// Select a delivery tier once per visit, so rotating a phone never downloads both tiers.
const MotionMedia=(()=>{
  const compact=matchMedia('(max-width:1100px), (pointer:coarse) and (max-width:1400px)').matches;
  const connection=navigator.connection||navigator.mozConnection||navigator.webkitConnection;
  const slow=!!connection?.saveData||['slow-2g','2g','3g'].includes(connection?.effectiveType);
  const light=compact&&((navigator.deviceMemory&&navigator.deviceMemory<=4)||(navigator.hardwareConcurrency&&navigator.hardwareConcurrency<=4));
  document.documentElement.classList.toggle('compact-media',compact);
  document.documentElement.classList.toggle('light-media',!!light);
  const ready=new Set(),listeners=new Map();
  function mark(name){if(ready.has(name))return;ready.add(name);(listeners.get(name)||[]).forEach(fn=>fn());listeners.delete(name);}
  function on(name,fn){if(!compact||ready.has(name))fn();else{if(!listeners.has(name))listeners.set(name,[]);listeners.get(name).push(fn);}}
  function prepare(progress,archiveDistance,view){
    if(!compact)return;
    if(progress>=.08)mark('intro');
    if(progress>=.20)mark('clouds');
    if(progress>=.46)mark('selected');
    if(archiveDistance<view*1.6)mark('archive');
  }
  on('clouds',()=>{if(compact)document.documentElement.style.setProperty('--mobile-cloud',"url('assets/mobile-v9/clouds.webp')");});
  const poster=w=>compact&&w.mobile?w.mobile.poster:w.poster;
  const preview=w=>compact&&w.mobile?w.mobile.preview:w.src;
  const playback=(w,quality='smooth')=>compact&&quality!=='hd'&&w.mobile?w.mobile.src:w.src;
  return {compact,slow,light,on,prepare,poster,preview,playback};
})();
