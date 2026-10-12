'use strict';
// The approved phone composition uses real poster buttons, never a flattened mockup.
(() => {
  const archive=document.getElementById('archive');
  const media=matchMedia('(max-width:600px), (pointer:coarse) and (max-width:1000px) and (max-height:500px)');
  const reduced=matchMedia('(prefers-reduced-motion:reduce)');
  let workList=[],built=false,visible=false,prepared=false;
  const groups=[[13,3,2,7,11,5],[6,14,5,1,10,8],[13,10,15,16,12,17],[14,5,6,18,4,8]];
  function updatePlayback(){
    const paused=!visible||document.hidden||reduced.matches||!!document.querySelector('dialog[open]')||!document.getElementById('editor').hidden;
    archive.classList.toggle('archive-drift-paused',paused);
  }
  function sync(){
    archive.classList.toggle('mobile-archive',media.matches);
    if(media.matches&&prepared&&workList.length&&!built){
      built=true;
      const fragment=document.createDocumentFragment();
      for(let band=0;band<2;band++){
        const ribbon=document.createElement('div');
        ribbon.className='mobile-art-ribbon '+(band?'mobile-art-bottom':'mobile-art-top');
        ribbon.setAttribute('aria-label',band?'更多动态作品':'动态作品选集');
        for(let row=0;row<2;row++){
          const window=document.createElement('div');window.className='mobile-art-window';
          const track=document.createElement('div');track.className='mobile-art-track';
          const selected=groups[band*2+row].map(i=>workList[i%workList.length]);
          for(let repeat=0;repeat<2;repeat++){
            const sequence=document.createElement('div');sequence.className='mobile-art-sequence';
            selected.forEach(w=>{
              const button=document.createElement('button');button.className='mobile-art-card';button.type='button';
              button.setAttribute('aria-label','播放 '+w.title);
              const image=document.createElement('img');image.src=MotionMedia.poster(w);image.alt='';image.decoding='async';image.draggable=false;
              button.append(image);button.addEventListener('click',()=>openPlayer(w));
              // Repeated visual content must not double the keyboard navigation.
              if(repeat){button.tabIndex=-1;button.setAttribute('aria-hidden','true');}
              sequence.append(button);
            });track.append(sequence);
          }
          // Six CSS pixels per second, shared with the existing canvas wall.
          window.append(track);ribbon.append(window);
        }
        fragment.append(ribbon);
      }
      for(const edge of ['top','bottom']){const blur=document.createElement('div');blur.className='mobile-art-edge mobile-art-edge-'+edge;blur.setAttribute('aria-hidden','true');fragment.append(blur);}
      archive.insertBefore(fragment,archive.querySelector('.archive-vignette'));
      measure();
    }
    updatePlayback();
  }
  function measure(){
    if(!built||!media.matches)return;
    const landscape=archive.clientWidth>innerHeight;
    const tile=Math.min(archive.clientWidth*.345,landscape?145:175);
    const stride=tile+7,duration=stride*6/6;
    archive.style.setProperty('--mobile-art-width',tile+'px');
    archive.style.setProperty('--mobile-art-duration',duration+'s');
  }
  const observer=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;updatePlayback();},{threshold:0});observer.observe(archive);
  new MutationObserver(updatePlayback).observe(document.getElementById('player-dialog'),{attributes:true,attributeFilter:['open']});
  new MutationObserver(updatePlayback).observe(document.getElementById('contact-dialog'),{attributes:true,attributeFilter:['open']});
  new MutationObserver(updatePlayback).observe(document.getElementById('editor'),{attributes:true,attributeFilter:['hidden']});
  document.addEventListener('visibilitychange',updatePlayback);
  media.addEventListener('change',sync);reduced.addEventListener('change',updatePlayback);
  addEventListener('resize',measure,{passive:true});
  MotionMedia.on('archive',()=>{prepared=true;sync();});
  document.addEventListener('motionworksready',e=>{workList=e.detail;sync();});
  if(typeof works!=='undefined'&&works.length)workList=works;
  sync();
})();
