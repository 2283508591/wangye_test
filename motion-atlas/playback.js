'use strict';
// Mobile-only bounded video retention. Original URLs and encoded media are unchanged.
const MotionPlayback=(()=>{
  function createPreview({slow=false,delay=180,setTimer=setTimeout,clearTimer=clearTimeout,onState=()=>{},onTrace=()=>{}}={}){
    let items=[],index=-1,direction=1,enabled=false,suspended=false,busy=false,timer,warmTimer,releaseTimer,revision=0,clock=0;
    const retained=new Map(),pending=new Map(),listeners=new Map();
    const current=()=>items[index];
    const allowed=()=>enabled&&!suspended&&!busy;
    function clearJobs(){clearTimer(timer);clearTimer(warmTimer);timer=warmTimer=undefined;}
    function release(entry){
      const v=entry.video;v.pause();onState(entry,'paused');
      if(v.getAttribute('src')){v.removeAttribute('src');v.preload='none';v.load();onTrace('release',entry);}
      retained.delete(v);
    }
    function attach(entry,preload){
      const v=entry.video;v.preload=preload;
      if(v.getAttribute('src')!==entry.src){v.src=entry.src;v.load();onTrace('load',entry);}
      retained.set(v,{entry,touched:++clock});
    }
    function trim(){
      const ordered=[...retained.values()].sort((a,b)=>b.touched-a.touched);
      const keep=new Set([current()?.video]);
      for(const item of ordered)if(keep.size<3)keep.add(item.entry.video);
      for(const {entry} of ordered)if(!keep.has(entry.video))release(entry);
    }
    function ahead(v){
      for(let i=0;i<v.buffered.length;i++)if(v.buffered.start(i)<=v.currentTime+.05&&v.buffered.end(i)>v.currentTime)return v.buffered.end(i)-v.currentTime;
      return 0;
    }
    function warm(){
      warmTimer=undefined;const entry=current();
      // One speculative short preview only, after the current clip has a safe buffer.
      if(slow||!allowed()||!entry||entry.video.paused||entry.video.readyState<3||ahead(entry.video)<3||items.length<2)return;
      const next=items[(index+direction+items.length)%items.length];
      if(next.src===entry.src)return;
      if(!next.video.getAttribute('src')){attach(next,'auto');trim();onTrace('warm',next);}
    }
    function queueWarm(){if(!slow&&allowed()&&warmTimer===undefined)warmTimer=setTimer(warm,1000);}
    function pauseAll(){
      for(const {entry} of retained.values()){entry.video.pause();onState(entry,'paused');}
    }
    function schedule(wait=delay){clearTimer(timer);timer=allowed()?setTimer(start,wait):undefined;}
    function start(){
      clearTimer(timer);timer=undefined;const entry=current();if(!allowed()||!entry)return;
      const v=entry.video;attach(entry,'auto');trim();
      if(!v.paused){queueWarm();return;}
      if(pending.has(v))return;
      const request=revision;let aborted=false;
      onTrace('play',entry);
      let attempt;
      try{attempt=v.play();}catch(error){attempt=Promise.reject(error);}
      const promise=Promise.resolve(attempt).catch(error=>{
        aborted=error.name==='AbortError';
        if(current()===entry&&request===revision&&allowed()&&!aborted)onState(entry,error.name==='NotAllowedError'?'blocked':'error');
      }).finally(()=>{
        if(pending.get(v)!==promise)return;pending.delete(v);
        if(current()!==entry||!allowed()){v.pause();return;}
        // A quickly revisited clip may still be finishing the previous aborted request.
        if(v.paused&&request!==revision)schedule();
      });
      pending.set(v,promise);
    }
    function select(next,{immediate=false}={}){
      if(!items.length)return;
      const old=index;next=((next%items.length)+items.length)%items.length;
      if(old>=0&&old!==next){let d=(next-old+items.length)%items.length;direction=d<=items.length/2?1:-1;}
      if(next!==index)revision++;
      index=next;suspended=false;clearJobs();
      for(const {entry} of retained.values())if(entry!==current()){entry.video.pause();onState(entry,'paused');}
      if(retained.has(current().video))retained.get(current().video).touched=++clock;
      trim();schedule(immediate?0:delay);
    }
    function cancelSpeculation(){
      const v=current()?.video;
      for(const {entry} of [...retained.values()])if(entry.video!==v&&entry.video.readyState<4)release(entry);
    }
    function refresh(){
      clearJobs();clearTimer(releaseTimer);
      if(allowed())schedule();
      else{pauseAll();cancelSpeculation();releaseTimer=setTimer(()=>{for(const {entry} of [...retained.values()])release(entry);},30000);}
    }
    function setItems(next){
      clearJobs();clearTimer(releaseTimer);revision++;
      for(const [v,events] of listeners)for(const [name,fn] of events)v.removeEventListener(name,fn);
      listeners.clear();for(const {entry} of [...retained.values()])release(entry);
      items=next;index=-1;
      for(const entry of items){
        const v=entry.video;
        const playing=()=>{if(current()!==entry||!allowed()){v.pause();onState(entry,'paused');return;}onState(entry,'playing');queueWarm();};
        const progress=()=>{if(current()===entry)queueWarm();};
        const waiting=()=>{if(current()!==entry)return;clearTimer(warmTimer);warmTimer=undefined;cancelSpeculation();onTrace('waiting',entry);};
        const events=[['playing',playing],['progress',progress],['waiting',waiting]];
        events.forEach(([name,fn])=>v.addEventListener(name,fn));listeners.set(v,events);
      }
    }
    return {setItems,select,start,suspend(value=true){suspended=value;revision++;refresh();},setVisible(value){enabled=value;revision++;refresh();},setBusy(value){if(busy===value)return;busy=value;revision++;refresh();},release(){enabled=false;setItems([]);},snapshot:()=>({index,retained:retained.size,pending:pending.size,enabled,busy,suspended})};
  }
  function createPlayer(video,{ttl=60000,setTimer=setTimeout,clearTimer=clearTimeout}={}){
    let timer;
    function release(){clearTimer(timer);video.pause();video.removeAttribute('src');video.preload='none';video.load();}
    return {
      open(src,{restart=false,force=false}={}){
        clearTimer(timer);video.preload='auto';
        if(force||video.error||video.getAttribute('src')!==src){video.src=src;video.load();return true;}
        if(restart&&video.readyState>=1)video.currentTime=0;
        return false;
      },
      close(){video.pause();video.preload='none';clearTimer(timer);timer=setTimer(release,ttl);},release
    };
  }
  return {createPreview,createPlayer};
})();
if(typeof module==='object'&&module.exports)module.exports=MotionPlayback;
