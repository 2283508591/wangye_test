'use strict';
const $ = (s, root = document) => root.querySelector(s);
const $$ = (s, root = document) => [...root.querySelectorAll(s)];
const fields = {brand:'导航 · 名称',eyebrow:'首页 · 顶部短句',heroLine1:'首页 · 标题第一行',heroLine2:'首页 · 标题第二行',heroDescription:'首页 · 简介',name:'开场 · 姓名',bio:'开场 · 个人介绍',selectedTitle:'精选 · 标题',selectedDescription:'精选 · 说明',contactEyebrow:'末页 · 顶部短句',contactLine1:'末页 · 标题第一行',contactLine2:'末页 · 标题第二行',contactDescription:'末页 · 介绍',contactButton:'末页 · 联系按钮',footerName:'页脚 · 名称'};
const storageKey = 'xiaohulu-motion-atlas-v1';
const defaults = Object.fromEntries($$('[data-copy]').map(el => [el.dataset.copy, [...el.childNodes].map(node=>node.nodeName==='BR'?'\n':node.textContent).join('')]));
let config = {fields:{}, contact:''};
let storageAvailable = true;
try {const saved=JSON.parse(localStorage.getItem(storageKey)); if(saved) config=validateConfig(saved);} catch {storageAvailable=false;}
function validateConfig(data) {
  if(!data || typeof data !== 'object' || !data.fields || typeof data.fields !== 'object') throw new Error('配置格式不正确');
  const out={fields:{},contact:typeof data.contact==='string'?data.contact.slice(0,500):''};
  for(const key of Object.keys(fields)) {
    const f=data.fields[key]; if(!f || typeof f !== 'object') continue;
    const clean={}; if(typeof f.text==='string') clean.text=f.text.slice(0,3000);
    if(['inherit',"'Microsoft YaHei',sans-serif","'SimSun',serif","'KaiTi',serif",'Arial,sans-serif','Georgia,serif',"'Courier New',monospace"].includes(f.font)) clean.font=f.font;
    if(/^#[0-9a-f]{6}$/i.test(f.color||'')) clean.color=f.color;
    if(Number.isFinite(+f.size) && +f.size>=10 && +f.size<=180) clean.size=+f.size;
    if(['inherit','300','400','500','600','700'].includes(f.weight)) clean.weight=f.weight;
    if(['left','center','right'].includes(f.align)) clean.align=f.align;
    out.fields[key]=clean;
  } return out;
}
function applyField(key) {
  const f=config.fields[key]||{};
  $$(`[data-copy="${key}"]`).forEach(el=>{
    el.textContent=f.text??defaults[key];
    el.style.fontFamily=f.font && f.font!=='inherit'?f.font:'';
    el.style.color=f.color||'';
    el.style.webkitTextStroke=f.color?'0':'';
    el.style.fontSize=f.size?`clamp(10px, ${f.size/1440*100}vw + ${f.size*.35}px, ${f.size}px)`:'';
    el.style.fontWeight=f.weight&&f.weight!=='inherit'?f.weight:'';
    el.style.textAlign=f.align||'';
    if(f.align) {el.style.display='block';el.style.width='100%';} else {el.style.display='';el.style.width='';}
  });
}
function applyConfig(){Object.keys(fields).forEach(applyField);updateContact();}
function updateContact() {$('#contact-hint').textContent=config.contact;$('#contact-hint').hidden=!config.contact;}
applyConfig();
$('#year').textContent=new Date().getFullYear();
let toastTimer;
function toast(message){$('#toast').textContent=message;$('#toast').classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').classList.remove('visible'),2800);}
$('#contact-button').addEventListener('click',async()=>{
  const value=config.contact.trim();
  if(!value) {toast('联系方式即将更新，感谢关注');return;}
  if(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) location.href='mailto:'+value;
  else if(/^https?:\/\//i.test(value)) window.open(value,'_blank','noopener,noreferrer');
  else {try {await navigator.clipboard.writeText(value);toast('联系方式已复制：'+value);} catch {toast('联系方式：'+value);}}
});
const menuToggle=$('#menu-toggle');
function closeMenu(){menuToggle.setAttribute('aria-expanded','false');menuToggle.setAttribute('aria-label','打开导航');$('.site-header').classList.remove('menu-open');}
menuToggle.addEventListener('click',()=>{const open=menuToggle.getAttribute('aria-expanded')!=='true';menuToggle.setAttribute('aria-expanded',String(open));menuToggle.setAttribute('aria-label',open?'关闭导航':'打开导航');$('.site-header').classList.toggle('menu-open',open);});
$$('#main-nav a').forEach(a=>a.addEventListener('click',closeMenu));
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeMenu();});
// Editor: text is rendered with textContent and style values are validated on import.
for(const [value,label] of Object.entries(fields)) {const option=document.createElement('option');option.value=value;option.textContent=label;$('#field-select').append(option);}
let fieldKey='brand';
function colorToHex(value){const rgb=value.match(/\d+/g);return rgb?'#'+rgb.slice(0,3).map(n=>(+n).toString(16).padStart(2,'0')).join(''):'#ffffff';}
function loadField(){
  $$('.editing-target').forEach(el=>el.classList.remove('editing-target'));
  fieldKey=$('#field-select').value;const f=config.fields[fieldKey]||{};const el=$(`[data-copy="${fieldKey}"]`);
  const computed=getComputedStyle(el);$('#copy-input').value=f.text??defaults[fieldKey];$('#font-input').value=f.font||'inherit';$('#color-input').value=f.color||colorToHex(computed.color);$('#size-input').value=f.size||'';$('#size-input').placeholder=Math.round(parseFloat(computed.fontSize))+'（自动）';$('#weight-input').value=f.weight||'inherit';
  $$('.alignment-controls button').forEach(b=>b.classList.toggle('active',b.dataset.align===(f.align||computed.textAlign)));
  if(!$('#editor').hidden) el.classList.add('editing-target');
}
function closeEditor(){$('#editor').hidden=true;$$('.editing-target').forEach(el=>el.classList.remove('editing-target'));}
$('#close-editor').addEventListener('click',closeEditor);
$('#field-select').addEventListener('change',loadField);
function changeField(prop,value){config.fields[fieldKey]??={};if(value==='') delete config.fields[fieldKey][prop];else config.fields[fieldKey][prop]=value;applyField(fieldKey);$('#editor-status').textContent='修改已预览 · 点击保存可在下次打开时恢复';}
$('#copy-input').addEventListener('input',e=>changeField('text',e.target.value));
$('#font-input').addEventListener('change',e=>changeField('font',e.target.value));
$('#color-input').addEventListener('input',e=>changeField('color',e.target.value));
$('#size-input').addEventListener('input',e=>{const n=+e.target.value;if(!e.target.value)changeField('size','');else if(n>=10&&n<=180)changeField('size',n);});
$('#weight-input').addEventListener('change',e=>changeField('weight',e.target.value));
$$('.alignment-controls button').forEach(b=>b.addEventListener('click',()=>{changeField('align',b.dataset.align);loadField();}));
$('#contact-input').addEventListener('input',e=>{config.contact=e.target.value;updateContact();$('#editor-status').textContent='联系方式已预览 · 点击保存保留修改';});
$('#save-config').addEventListener('click',()=>{try {localStorage.setItem(storageKey,JSON.stringify(config));storageAvailable=true;$('#editor-status').textContent='已保存到当前浏览器。分享给他人前可导出配置。';toast('文字与样式已保存');} catch {storageAvailable=false;$('#editor-status').textContent='浏览器不允许本地保存，请导出配置备份。';toast('请使用「导出配置」保留修改');}});
$('#export-config').addEventListener('click',()=>{const blob=new Blob([JSON.stringify(config,null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='小葫芦-网站文案配置.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);toast('配置已导出');});
$('#import-config').addEventListener('click',()=>$('#config-file').click());
$('#config-file').addEventListener('change',async e=>{const file=e.target.files[0];if(!file)return;try {if(file.size>100000)throw new Error();config=validateConfig(JSON.parse(await file.text()));applyConfig();$('#contact-input').value=config.contact;loadField();toast('配置已导入，保存后可保留');} catch {toast('无法读取配置，请选择导出的 JSON 文件');}e.target.value='';});
$('#reset-field').addEventListener('click',()=>{delete config.fields[fieldKey];applyField(fieldKey);loadField();$('#editor-status').textContent='当前项已重置 · 点击保存保留修改';});
$$('[data-copy]').forEach(el=>el.addEventListener('click',e=>{if(!$('#editor').hidden){e.preventDefault();e.stopPropagation();$('#field-select').value=el.dataset.copy;loadField();}}));
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!$('#editor').hidden)closeEditor();});

let works=[],filtered=[],carouselWorks=[],active=0,cards=[],carouselVisible=false,playTimer,wheelLock=false;
const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)').matches;
let selectedReady=!MotionMedia.compact,archiveReady=!MotionMedia.compact,archiveBuilt=false;
function hydrateCard(card,work){const img=$('img',card);if(!img.getAttribute('src'))img.src=MotionMedia.poster(work);const video=$('video',card);if(!video.getAttribute('poster'))video.poster=MotionMedia.poster(work);}
function hydrateVisibleCards(){if(!selectedReady)return;cards.forEach((card,i)=>{let d=Math.abs(i-active);d=Math.min(d,cards.length-d);if(!MotionMedia.compact||d<=3)hydrateCard(card,carouselWorks[i]);});}
MotionMedia.on('selected',()=>{selectedReady=true;hydrateVisibleCards();});
MotionMedia.on('archive',()=>{archiveReady=true;if(works.length)buildArchive();});
const workDescriptions={
 'work-01':'一缕清风，也有自己的节奏。','work-02':'从指尖出发，进入另一个世界。',
 'work-03':'让轻盈与活力，一起向前。','work-04':'以柔和光影，探索金属与色彩。',
 'work-05':'把声音的想象，变成画面。','work-06':'在明暗之间，寻找产品的力量。',
 'work-07':'以光影，勾勒每一处结构。','work-08':'让材质细节，在镜头里展开。',
 'work-09':'用镜头，重新认识光的形状。','work-10':'从结构到质感，发现更多细节。',
 'work-11':'为线条赋予节奏，为光留下空间。','work-12':'让精密结构，有自己的表达。',
 'work-13':'从一份包装，打开新的想象。','work-14':'沿着光，驶向更远的地方。',
 'work-15':'把新年的热烈，留在这一帧。','work-16':'在微小之处，看见光的层次。',
 'work-17':'从不同角度，发现产品之美。','work-18':'让光影与速度，一起前行。',
 'work-19':'从细节出发，让质感发生。'
};
const mediaLabel=w=>w.category==='AI 视频'?'AI 影像':'三维动画';
const timeLabel=s=>`${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`;
function prepareInlineVideo(video,preview=false){
  video.playsInline=true;video.setAttribute('playsinline','');video.setAttribute('webkit-playsinline','');
  video.setAttribute('x5-playsinline','');
  if(preview){video.muted=true;video.defaultMuted=true;video.setAttribute('muted','');video.autoplay=true;}
}
function buildCards(){
  cards.forEach(c=>{const v=$('video',c);v.pause();v.removeAttribute('src');v.load();});$('#card-track').replaceChildren();cards=[];
  if(!filtered.length){carouselWorks=[];return;}
  carouselWorks=Array.from({length:Math.max(1,Math.ceil(15/filtered.length))},()=>filtered).flat();
  carouselWorks.forEach((work,i)=>{
    const card=document.createElement('button');card.type='button';card.className='work-card';card.setAttribute('aria-label',`${work.title}，${work.category}，${timeLabel(work.duration)}，点击选中，再次点击完整播放`);
    card.innerHTML='<div class="card-picture"><img alt=""><video muted loop playsinline preload="none"></video></div><div class="card-topline"><span class="card-type"></span><span class="card-expand">↗</span></div><div class="card-content"><span class="card-index"></span><h3></h3><p></p><div class="card-meta"><span>MOTION STUDY</span><span class="card-duration"></span></div><span class="card-play" aria-hidden="true">▶</span></div>';
    $('img',card).decoding='async';if(!MotionMedia.compact)hydrateCard(card,work);$('video',card).muted=true;$('.card-type',card).textContent=work.category;$('.card-index',card).textContent=`SELECTED / ${String(i%filtered.length+1).padStart(2,'0')}`;$('h3',card).textContent=work.title;$('p',card).textContent=workDescriptions[work.id]||'以光影与质感，探索新的表达。';$('.card-meta span',card).textContent=mediaLabel(work);$('.card-duration',card).textContent=timeLabel(work.duration);
    prepareInlineVideo($('video',card),true);
    $('video',card).addEventListener('playing',()=>{card.classList.add('playing');$('.card-meta span',card).textContent=mediaLabel(work);});$('video',card).addEventListener('error',()=>{card.classList.remove('playing');$('.card-meta span',card).textContent='点击完整播放';});
    card.addEventListener('click',()=>{if(dragged)return;if(active===i)openPlayer(work);else {setActive(i);playActive();}});$('#card-track').append(card);cards.push(card);
  });setActive(Math.min(3,filtered.length-1));
}
function setActive(index){
  if(!filtered.length)return;active=((index%carouselWorks.length)+carouselWorks.length)%carouselWorks.length;clearTimeout(playTimer);
  const step=cards[0].offsetWidth*(innerWidth<600?.54:.58);
  const radius=Math.min(8,Math.ceil(innerWidth/(2*step))+2);
  cards.forEach((card,i)=>{let d=((i-active)%cards.length+cards.length)%cards.length;if(d>cards.length/2)d-=cards.length;const distance=Math.abs(d);card.style.setProperty('--card-x',d*step);card.style.setProperty('--card-z',-distance*45);card.style.setProperty('--card-turn',d===0?0:d>0?-26:26);card.style.setProperty('--card-scale',Math.max(.72,1-distance*.035));card.style.setProperty('--card-side',d<0?-1:1);card.style.zIndex=String(30-distance);card.style.opacity=distance>radius?'0':String(Math.max(.55,1-distance*.07));card.style.filter=distance?'brightness(.8)':'none';card.style.visibility=distance>radius?'hidden':'visible';if(MotionMedia.compact)card.style.willChange=distance<=2?'transform':'auto';card.style.pointerEvents=distance>radius?'none':'auto';card.classList.toggle('active',d===0);card.setAttribute('aria-current',d===0?'true':'false');card.tabIndex=distance>radius?-1:0;const v=$('video',card);if(d!==0){v.pause();card.classList.remove('playing');if(v.getAttribute('src')){v.removeAttribute('src');v.load();}}});
  hydrateVisibleCards();
  const work=carouselWorks[active],workIndex=active%filtered.length;$('#current-title').textContent=work.title;$('#current-category').textContent=work.category==='AI 视频'?'AI FILM / VISUAL EXPLORATION':'3D ANIMATION / PRODUCT FILM';$('#current-index').textContent=`${String(workIndex+1).padStart(2,'0')} / ${String(filtered.length).padStart(2,'0')}`;$('#carousel-progress').style.width=`${(workIndex+1)/filtered.length*100}%`;$$('.carousel-position i').forEach((dot,i)=>dot.classList.toggle('active',i===Math.min(4,Math.floor(workIndex/filtered.length*5))));$('#previous').disabled=filtered.length<2;$('#next').disabled=filtered.length<2;playTimer=setTimeout(playActive,400);
}
async function playActive(){if(!carouselVisible||document.hidden||$('#player-dialog').open)return;const card=cards[active];if(!card)return;const video=$('video',card);if(!video.getAttribute('src')){video.src=MotionMedia.preview(carouselWorks[active]);video.load();}video.muted=true;try {await video.play();}catch(error){if(card!==cards[active])return;card.classList.remove('playing');if(error.name==='NotAllowedError')$('.card-meta span',card).textContent='点击播放';}}
function pauseCards(){cards.forEach(c=>$('video',c).pause());}
$('#previous').addEventListener('click',()=>{setActive(active-1);playActive();});$('#next').addEventListener('click',()=>{setActive(active+1);playActive();});$('#open-current').addEventListener('click',()=>openPlayer(carouselWorks[active]));
$('#carousel').addEventListener('keydown',e=>{if(e.key==='ArrowRight'||e.key==='ArrowLeft'){e.preventDefault();setActive(active+(e.key==='ArrowRight'?1:-1));}});
let pointerStart=null,dragged=false;
$('#carousel').addEventListener('pointerdown',e=>{if(e.button!==0)return;pointerStart={x:e.clientX,y:e.clientY,id:e.pointerId};dragged=false;pauseCards();});
$('#carousel').addEventListener('pointermove',e=>{if(!pointerStart)return;const dx=e.clientX-pointerStart.x;if(Math.abs(dx)>12&&Math.abs(dx)>Math.abs(e.clientY-pointerStart.y)){dragged=true;if(!$('#carousel').hasPointerCapture(e.pointerId))$('#carousel').setPointerCapture(e.pointerId);}});
function finishDrag(e){if(!pointerStart)return;const dx=e.clientX-pointerStart.x;if(dragged&&Math.abs(dx)>35)setActive(active+(dx<0?1:-1)*Math.max(1,Math.min(3,Math.floor(Math.abs(dx)/160))));else playActive();pointerStart=null;setTimeout(()=>dragged=false,60);}
$('#carousel').addEventListener('pointerup',finishDrag);$('#carousel').addEventListener('pointercancel',()=>{pointerStart=null;dragged=false;});
$('#carousel').addEventListener('wheel',e=>{if(Math.abs(e.deltaX)>Math.abs(e.deltaY)||e.shiftKey){e.preventDefault();const delta=e.deltaX||e.deltaY;if(!wheelLock&&Math.abs(delta)>5){wheelLock=true;setActive(active+(delta>0?1:-1));setTimeout(()=>wheelLock=false,420);}}},{passive:false});
let resizeTimer,layoutWidth=innerWidth,layoutHeight=document.querySelector('.journey-sticky').offsetHeight;
window.addEventListener('resize',()=>{clearTimeout(resizeTimer);resizeTimer=setTimeout(()=>{const height=document.querySelector('.journey-sticky').offsetHeight;if(innerWidth===layoutWidth&&height===layoutHeight)return;layoutWidth=innerWidth;layoutHeight=height;setActive(active);},150);});
document.addEventListener('journeyvisibility',e=>{carouselVisible=!!e.detail;if(carouselVisible)playActive();else pauseCards();});
document.addEventListener('visibilitychange',()=>{if(document.hidden)pauseCards();else playActive();});
$('#selected-filters').addEventListener('click',e=>{const btn=e.target.closest('[data-category]');if(!btn)return;$$('button',$('#selected-filters')).forEach(b=>{b.classList.toggle('active',b===btn);b.setAttribute('aria-pressed',String(b===btn));});filtered=works.filter(w=>btn.dataset.category==='全部'||w.category===btn.dataset.category);buildCards();});
function buildArchive(){
  if(archiveBuilt||!archiveReady)return;archiveBuilt=true;
  // Every original appears once; five repeats close the perspective wall without fetching extra media.
  [...works,...works.slice(0,5)].forEach((w,i)=>{const b=document.createElement('button');b.className='archive-tile';b.dataset.category=w.category;b.setAttribute('aria-label',`播放 ${w.title}，${w.category}`);if(i>=works.length){b.setAttribute('aria-hidden','true');b.tabIndex=-1;}const img=document.createElement('img');img.src=MotionMedia.poster(w);img.alt='';img.loading='lazy';img.decoding='async';const span=document.createElement('span');span.textContent=w.title+' / '+w.category;b.append(img,span);b.addEventListener('click',()=>openPlayer(w));$('#archive-wall').append(b);});
}
let previousFocus,playerWork,playerTimer,playerOffset=0;
const qualityButtons=$$('[data-quality]'),qualitySwitch=$('.quality-switch');let playerQuality='smooth';$('.mobile-quality').hidden=!MotionMedia.compact;
function playerSource(){return MotionMedia.playback(playerWork,playerQuality);}
function changeQuality(value,restart=true){
  const changed=value!==playerQuality;playerQuality=value;qualitySwitch.style.setProperty('--quality-position',value==='hd'?1:0);
  qualityButtons.forEach(b=>{const selected=b.dataset.quality===value;b.setAttribute('aria-checked',String(selected));b.tabIndex=selected?0:-1;});
  if(changed&&restart&&playerWork&&$('#player-dialog').open){playerOffset=$('#full-video').currentTime||0;startPlayer(true);}
}
qualityButtons.forEach((button,i)=>{
  button.addEventListener('click',()=>changeQuality(button.dataset.quality));
  button.addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;e.preventDefault();const next=e.key==='Home'?0:e.key==='End'?1:1-i;qualityButtons[next].focus();changeQuality(qualityButtons[next].dataset.quality);});
});
let qualityGesture=null,qualityClickUntil=0;
qualitySwitch.addEventListener('pointerdown',e=>{
  if(e.button!==0)return;
  qualityGesture={id:e.pointerId,x:e.clientX,y:e.clientY,start:playerQuality==='hd'?1:0,drag:false};
});
qualitySwitch.addEventListener('pointermove',e=>{
  const g=qualityGesture;if(!g||g.id!==e.pointerId)return;
  const dx=e.clientX-g.x,dy=e.clientY-g.y;
  if(!g.drag&&Math.abs(dy)>Math.abs(dx)&&Math.abs(dy)>8){qualityGesture=null;return;}
  if(!g.drag&&Math.abs(dx)>8){g.drag=true;qualitySwitch.setPointerCapture(e.pointerId);qualitySwitch.classList.add('is-dragging');}
  if(g.drag){const travel=qualitySwitch.clientWidth/2-4;qualitySwitch.style.setProperty('--quality-position',Math.max(0,Math.min(1,g.start+dx/travel)));}
});
function finishQualityGesture(e){
  const g=qualityGesture;if(!g||g.id!==e.pointerId)return;
  qualityGesture=null;qualitySwitch.classList.remove('is-dragging');
  if(g.drag){qualityClickUntil=Date.now()+400;const dx=e.clientX-g.x;changeQuality(e.type==='pointercancel'?playerQuality:Math.abs(dx)>14?(dx>0?'hd':'smooth'):playerQuality);}
}
qualitySwitch.addEventListener('pointerup',finishQualityGesture);
qualitySwitch.addEventListener('pointercancel',finishQualityGesture);
qualitySwitch.addEventListener('click',e=>{if(Date.now()<qualityClickUntil){e.preventDefault();e.stopImmediatePropagation();}},true);
$('#full-video').addEventListener('loadedmetadata',()=>{if(playerOffset){$('#full-video').currentTime=Math.min(playerOffset,Math.max(0,$('#full-video').duration-.1));playerOffset=0;}});
const playerStatus=$('#player-status'),retryPlayer=$('#retry-player');
function playerMessage(message,retry=false){playerStatus.textContent=message;retryPlayer.hidden=!retry;}
function startPlayer(reload=false){
  if(!playerWork||!$('#player-dialog').open)return;
  const v=$('#full-video');clearTimeout(playerTimer);playerMessage('正在加载视频…');
  if(reload||!v.getAttribute('src')){v.src=playerSource();$('#video-direct').href=playerSource();v.load();}
  playerTimer=setTimeout(()=>{if($('#player-dialog').open&&(v.readyState<3||v.paused))playerMessage('加载较慢，可以重试或在浏览器中打开视频',true);},12000);
  v.play().catch(error=>{if(error.name==='AbortError'||!$('#player-dialog').open)return;clearTimeout(playerTimer);playerMessage(error.name==='NotAllowedError'?'点按播放，开始观看':'视频暂时未能加载，请重试',true);});
}
function openPlayer(work){if(!work)return;previousFocus=document.activeElement;playerWork=work;playerOffset=0;changeQuality('smooth',false);pauseCards();$('#player-title').textContent=work.title;$('#player-category').textContent=work.category+' / '+timeLabel(work.duration);const v=$('#full-video');prepareInlineVideo(v);v.poster=MotionMedia.poster(work);$('#video-direct').href=playerSource();if(!$('#player-dialog').open)$('#player-dialog').showModal();startPlayer(true);}
retryPlayer.addEventListener('click',()=>startPlayer(!!$('#full-video').error||$('#full-video').readyState===0));
$('#full-video').addEventListener('playing',()=>{clearTimeout(playerTimer);playerMessage('');});
$('#full-video').addEventListener('error',()=>{if($('#player-dialog').open){clearTimeout(playerTimer);playerMessage('视频未能加载，请重试或直接打开',true);}});
// A real touch is required by some embedded browsers even for muted previews.
document.addEventListener('touchend',()=>playActive(),{passive:true});
document.addEventListener('WeixinJSBridgeReady',()=>playActive());
function closePlayer(){if($('#player-dialog').open)$('#player-dialog').close();}
$('#close-player').addEventListener('click',closePlayer);$('#player-dialog').addEventListener('click',e=>{if(e.target===$('#player-dialog')){const r=e.target.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)closePlayer();}});
$('#player-dialog').addEventListener('close',()=>{clearTimeout(playerTimer);playerWork=null;const v=$('#full-video');v.pause();v.removeAttribute('src');v.load();previousFocus?.focus({preventScroll:true});playActive();});
fetch('works.json?v=12').then(r=>{if(!r.ok)throw new Error();return r.json();}).then(data=>{works=data;filtered=works;buildCards();buildArchive();document.dispatchEvent(new CustomEvent('motionworksready',{detail:works}));}).catch(()=>{toast('作品列表未能加载，请刷新页面');$('#current-title').textContent='作品加载失败';});
