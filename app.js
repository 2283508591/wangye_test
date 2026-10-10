import * as THREE from './assets/three.module.js';
import { flyToWorld } from './flight.js';
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
const planets=[
  {
    "name": "Mercury",
    "texture": "mercury",
    "color": 10854033,
    "scene": "mars-landscape",
    "filter": "grayscale(1) brightness(.65)",
    "facts": [
      "距太阳约 5,800 万千米，约 0.39 个天文单位。",
      "绕太阳一周，约为 88 个地球日。",
      "白昼约 430 ℃，夜晚可低至 −180 ℃。",
      "仅有极稀薄的外逸层，几乎没有大气。"
    ],
    "zh": "水星",
    "kicker": "第一站 · 寂静边界",
    "caption": "离光最近，也离喧嚣最远。"
  },
  {
    "name": "Venus",
    "texture": "venus_surface",
    "color": 13872244,
    "scene": "mars-landscape",
    "filter": "sepia(.6) hue-rotate(8deg) saturate(.7)",
    "facts": [
      "距太阳约 1.08 亿千米，约 0.72 个天文单位。",
      "绕太阳一周，约为 225 个地球日。",
      "地表约 465 ℃，是太阳系最热的行星。",
      "浓密的二氧化碳大气，覆盖着硫酸云层。"
    ],
    "zh": "金星",
    "kicker": "第二站 · 金色迷雾",
    "caption": "穿过迷雾，想象另一种可能。"
  },
  {
    "name": "Earth",
    "texture": "earth",
    "color": 7319006,
    "scene": "earth-landscape",
    "filter": "none",
    "facts": [
      "距太阳约 1.5 亿千米，约 1 个天文单位。",
      "绕太阳一周，约为 365.25 个地球日。",
      "全球地表平均温度约为 15 ℃。",
      "以氮气和氧气为主，孕育着丰富的生命。"
    ],
    "zh": "地球",
    "kicker": "第三站 · 蓝色故乡",
    "caption": "走得再远，也记得这一抹蓝。"
  },
  {
    "name": "Mars",
    "texture": "mars",
    "color": 13596752,
    "scene": "mars-landscape",
    "filter": "none",
    "facts": [
      "距太阳约 2.28 亿千米，约 1.5 个天文单位。",
      "绕太阳一周，约为 687 个地球日。",
      "平均约 −60 ℃，冬季极地可降至 −125 ℃。",
      "非常稀薄，约 95% 为二氧化碳，常有沙尘暴。"
    ],
    "zh": "火星",
    "kicker": "第四站 · 红色荒原",
    "caption": "把想象，降落在远方。"
  },
  {
    "name": "Jupiter",
    "texture": "jupiter",
    "color": 13873816,
    "scene": "jupiter-world",
    "filter": "none",
    "facts": [
      "距太阳约 7.78 亿千米，约 5.2 个天文单位。",
      "绕太阳一周，约为 12 个地球年。",
      "云顶附近约为 −110 ℃。",
      "主要由氢和氦组成，拥有强烈而持久的风暴。"
    ],
    "zh": "木星",
    "kicker": "第五站 · 风暴之眼",
    "caption": "在巨大的风暴里，看见宇宙的浪漫。"
  },
  {
    "name": "Saturn",
    "texture": "saturn",
    "color": 13942156,
    "scene": "saturn-world",
    "filter": "none",
    "facts": [
      "距太阳约 14 亿千米，约 9.5 个天文单位。",
      "绕太阳一周，约为 29 个地球年。",
      "云顶附近约为 −140 ℃。",
      "主要由氢和氦组成，周围环绕着冰质星环。"
    ],
    "zh": "土星",
    "kicker": "第六站 · 光环来信",
    "caption": "宇宙把浪漫，写成了一圈光环。"
  },
  {
    "name": "Uranus",
    "texture": "uranus",
    "color": 9554379,
    "scene": "uranus-world",
    "filter": "none",
    "facts": [
      "距太阳约 29 亿千米，约 19 个天文单位。",
      "绕太阳一周，约为 84 个地球年。",
      "大气温度最低可达约 −224 ℃。",
      "以氢、氦和甲烷为主，呈现淡淡的蓝绿色。"
    ],
    "zh": "天王星",
    "kicker": "第七站 · 青色梦境",
    "caption": "在遥远的青色里，让时间慢下来。"
  },
  {
    "name": "Neptune",
    "texture": "neptune",
    "color": 4354002,
    "scene": "neptune-world",
    "filter": "none",
    "facts": [
      "距太阳约 45 亿千米，约 30 个天文单位。",
      "绕太阳一周，约为 165 个地球年。",
      "上层大气温度约为 −200 ℃。",
      "以氢、氦和甲烷为主，拥有极其猛烈的风。"
    ],
    "zh": "海王星",
    "kicker": "第八站 · 深蓝尽头",
    "caption": "越过已知的边界，继续好奇。"
  }
];
const labels=['日距','公转','温度','大气'];
let current=3,next=2,busy=false,paused=reduced,activePanel=null,previousFocus=null;
let renderer,scene,camera,globe,stars,rings,atmosphere,clouds,frameId,lastTime=0;
const textures=new Map(),canvas=$('#planet-canvas');
const preload=src=>new Promise(resolve=>{const img=new Image();img.onload=()=>resolve(img);img.onerror=()=>resolve(null);img.src=src});
const duration=ms=>reduced?1:ms;
const wait=ms=>new Promise(r=>setTimeout(r,ms));
function populate(){
 $('#planet-navigation').innerHTML=planets.map((p,i)=>`<button class="planet-link${i===current?' active':''}" data-planet="${i}" aria-label="前往${p.zh}" ${i===current?'aria-current="true"':''}>${p.zh}</button>`).join('');
 $('#menu-planets').innerHTML=planets.map((p,i)=>`<button class="menu-destination${i===current?' active':''}" data-planet="${i}">${p.zh}<span>[${String(i+1).padStart(2,'0')}] ↗</span></button>`).join('');
 $$('[data-planet]').forEach(b=>b.addEventListener('click',()=>travel(Number(b.dataset.planet),false)));
}
function updateInformation(){
 const planet=planets[current];next=current===3?2:current===2?3:(current+1)%8;
 $('#planet-title').textContent=planet.zh;
 $('#planet-kicker').textContent=planet.kicker;$('#planet-caption').textContent=planet.caption;
 $('#planet-facts').innerHTML=planet.facts.map((fact,i)=>`<div class="fact-row"><dt>${labels[i]}：</dt><dd>${fact}</dd></div>`).join('');
 $('#next-number').textContent=`[${String(next+1).padStart(2,'0')}]`;$('#next-name').textContent=planets[next].zh;
 $('#portal').setAttribute('aria-label',`降落${planets[next].zh}`);$('#enter-button').setAttribute('aria-label',`降落${planets[next].zh}`);
 $$('[data-planet]').forEach(b=>{const isCurrent=Number(b.dataset.planet)===current;b.classList.toggle('active',isCurrent);if(isCurrent)b.setAttribute('aria-current','true');else b.removeAttribute('aria-current')});
 $('.portal-fallback').style.setProperty('--planet-texture',`url('assets/${planets[next].texture}.jpg')`);
 if(globe){globe.material.map=textures.get(next)||null;globe.material.color.set(textures.has(next)?0xffffff:planets[next].color);globe.material.needsUpdate=true;globe.rotation.set(.13,next===2?-4.05:-1.8,-.07);if(clouds){clouds.visible=next===2;clouds.rotation.copy(globe.rotation)}rings.visible=next===5;atmosphere.material.uniforms.glowColor.value.set(planets[next].color);renderOnce()}
 document.title=`${planet.zh} · 星际漫游`;
}
function setBackground(index,el){const p=planets[index];el.style.backgroundImage=`url('assets/${p.scene}.webp')`;el.style.filter=p.filter}
function renderOnce(){if(renderer)renderer.render(scene,camera)}
async function initializeGlobe(){
 try{
 renderer=new THREE.WebGLRenderer({canvas,alpha:true,antialias:true,powerPreference:'low-power',preserveDrawingBuffer:true});renderer.setPixelRatio(Math.min(devicePixelRatio,1.75));renderer.outputColorSpace=THREE.SRGBColorSpace;
 scene=new THREE.Scene();scene.background=new THREE.Color('#020407');camera=new THREE.PerspectiveCamera(42,1,.1,100);camera.position.set(0,0,5.7);
 const ambient=new THREE.AmbientLight(0xffffff,2.0);scene.add(ambient);const light=new THREE.DirectionalLight(0xfff5e5,2.3);light.position.set(-3,5,7);scene.add(light);
 globe=new THREE.Mesh(new THREE.SphereGeometry(2.6,64,48),new THREE.MeshStandardMaterial({color:0xffffff,roughness:.9,metalness:0}));globe.position.set(.06,-2.0,0);scene.add(globe);
 atmosphere=new THREE.Mesh(new THREE.SphereGeometry(2.625,48,36),new THREE.ShaderMaterial({uniforms:{glowColor:{value:new THREE.Color(0x7aaedb)}},vertexShader:'varying vec3 vNormal;varying vec3 vPosition;void main(){vNormal=normalize(normalMatrix*normal);vec4 pos=modelViewMatrix*vec4(position,1.0);vPosition=pos.xyz;gl_Position=projectionMatrix*pos;}',fragmentShader:'varying vec3 vNormal;varying vec3 vPosition;uniform vec3 glowColor;void main(){float intensity=pow(1.0-abs(dot(normalize(vNormal),normalize(-vPosition))),5.0);gl_FragColor=vec4(glowColor,intensity*0.55);}',transparent:true,depthWrite:false,blending:THREE.AdditiveBlending}));atmosphere.position.copy(globe.position);scene.add(atmosphere);
 clouds=new THREE.Mesh(new THREE.SphereGeometry(2.612,64,48),new THREE.MeshStandardMaterial({color:0xffffff,transparent:true,opacity:.68,depthWrite:false,roughness:1}));clouds.position.copy(globe.position);clouds.visible=false;scene.add(clouds);
 const positions=[],colors=[];for(let i=0;i<180;i++){positions.push((Math.random()-.5)*14,(Math.random()-.5)*14,-5-Math.random()*4);const v=.3+Math.random()*.7;colors.push(v*.9,v*.95,v)}
 const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geometry.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));stars=new THREE.Points(geometry,new THREE.PointsMaterial({size:.025,vertexColors:true,transparent:true,opacity:.8}));scene.add(stars);
 rings=new THREE.Mesh(new THREE.RingGeometry(3.1,4.25,96),new THREE.MeshBasicMaterial({color:0xcab797,side:THREE.DoubleSide,transparent:true,opacity:.68}));rings.position.copy(globe.position);rings.rotation.x=-1.05;rings.rotation.z=-.28;rings.visible=false;scene.add(rings);
 const resize=()=>{const rect=$('#portal').getBoundingClientRect();renderer.setSize(rect.width,rect.height,false);camera.aspect=rect.width/rect.height;camera.updateProjectionMatrix();renderOnce()};new ResizeObserver(resize).observe($('#portal'));resize();
 const loader=new THREE.TextureLoader();await Promise.all([2,3].map(async i=>{try{const t=await loader.loadAsync(`assets/${planets[i].texture}.jpg`);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=renderer.capabilities.getMaxAnisotropy();textures.set(i,t)}catch{}}));try{const cloudTexture=await loader.loadAsync('assets/earth-clouds.jpg');clouds.material.alphaMap=cloudTexture;clouds.material.needsUpdate=true;clouds.visible=next===2}catch{}updateInformation();
 $('.portal-fallback').style.opacity='0';
 [0,1,4,5,6,7].forEach(async i=>{try{const t=await loader.loadAsync(`assets/${planets[i].texture}.jpg`);t.colorSpace=THREE.SRGBColorSpace;textures.set(i,t);if(next===i)updateInformation()}catch{}});
 if(!paused)startAnimation();
 }catch(err){console.info('Using the lightweight planet fallback.',err.message)}
}
function animate(time){frameId=requestAnimationFrame(animate);if(document.hidden||paused||time-lastTime<32)return;const dt=Math.min((time-lastTime)/1000,.1);lastTime=time;if(globe){globe.rotation.y+=dt*.018;if(clouds)clouds.rotation.copy(globe.rotation);stars.rotation.z+=dt*.001;renderOnce()}drawDust(time)}
function startAnimation(){if(!frameId)frameId=requestAnimationFrame(animate)}
function stopAnimation(){cancelAnimationFrame(frameId);frameId=null;renderOnce()}
let dustParticles=[];const dustCanvas=$('#dust'),dustContext=dustCanvas.getContext('2d');
function resizeDust(){dustCanvas.width=innerWidth;dustCanvas.height=$('.voyage').clientHeight;dustParticles=Array.from({length:innerWidth<769?30:65},()=>({x:Math.random()*dustCanvas.width,y:Math.random()*dustCanvas.height*.65,r:Math.random()*1.2+.2,s:Math.random()*.25+.1,a:Math.random()*.3+.08}));drawDust(0)}
function drawDust(time){dustContext.clearRect(0,0,dustCanvas.width,dustCanvas.height);for(const d of dustParticles){const x=(d.x+time*.004*d.s)%dustCanvas.width;const y=d.y+Math.sin(time*.0001+d.x)*10;dustContext.beginPath();dustContext.fillStyle=`rgba(255,232,207,${d.a})`;dustContext.arc(x,y,d.r,0,Math.PI*2);dustContext.fill()}}
async function travel(index,throughPortal=true){
 if(busy)return;if(index===current){closePanels();return}busy=true;closePanels(false);
 const rect=$('#portal').getBoundingClientRect(),layer=$('#transition-layer'),incoming=$('.incoming');setBackground(index,incoming);incoming.style.opacity='0';
 document.body.classList.add('traveling');$('#portal').disabled=true;$('#enter-button').disabled=true;
 // Keep every destination reachable even on devices without WebGL.
 try{
  if(!reduced){
   try{await flyToWorld({layer,portalRect:rect,planet:planets[index],texture:textures.get(index),cloudTexture:clouds?.material.alphaMap,rotation:index===next&&globe?globe.rotation.clone():new THREE.Euler(.13,index===2?-4.05:-1.8,-.07),reduced,notify:message=>{$('#announcement').textContent=message;if(message.includes('降落'))incoming.style.opacity='1'}})}
   catch(err){console.info('飞行镜头使用轻量模式',err.message);await incoming.animate([{opacity:0,transform:'scale(1.25) translateY(4%)'},{opacity:1,transform:'scale(1.015) translateY(0)'}],{duration:1100,easing:'cubic-bezier(.2,.8,.3,1)',fill:'forwards'}).finished}
  }
  current=index;setBackground(current,$('.current'));incoming.getAnimations().forEach(a=>a.cancel());incoming.style.opacity='0';updateInformation();history.replaceState(null,'',`#${planets[current].name.toLowerCase()}`);$('#announcement').textContent=`已抵达${planets[current].zh}，下一站是${planets[next].zh}。`;
  if(innerWidth<769){const b=$(`#planet-navigation [data-planet="${current}"]`),nav=$('#planet-navigation');nav.scrollTo({left:b.offsetLeft-nav.clientWidth/2+b.offsetWidth/2,behavior:reduced?'instant':'smooth'})}
 }finally{layer.getAnimations().forEach(a=>a.cancel());layer.style.opacity='0';document.body.classList.remove('traveling');document.body.classList.add('landed');setTimeout(()=>document.body.classList.remove('landed'),900);$('#portal').disabled=false;$('#enter-button').disabled=false;busy=false}
}
function openPanel(id,trigger){if(busy)return;const wasOpen=activePanel?.id===id;closePanels(false);if(wasOpen){trigger?.focus();return}previousFocus=trigger||document.activeElement;activePanel=$(`#${id}`);activePanel.inert=false;activePanel.setAttribute('role','dialog');activePanel.setAttribute('aria-modal','true');activePanel.classList.add('open');$('#panel-backdrop').classList.add('open');trigger?.setAttribute('aria-expanded','true');$('.voyage').querySelectorAll('.interface').forEach(el=>el.inert=true);requestAnimationFrame(()=>activePanel?.querySelector('button').focus())}
function closePanels(restore=true){if(!activePanel)return;activePanel.classList.remove('open');activePanel.inert=true;activePanel.removeAttribute('aria-modal');activePanel=null;$('#panel-backdrop').classList.remove('open');$$('[aria-expanded]').forEach(b=>b.setAttribute('aria-expanded','false'));$$('.interface').forEach(el=>el.inert=false);if(restore)previousFocus?.focus()}
$('#about-button').addEventListener('click',e=>openPanel('about-panel',e.currentTarget));$('#menu-button').addEventListener('click',e=>openPanel('menu-panel',e.currentTarget));$('#planets-button').addEventListener('click',e=>openPanel('menu-panel',e.currentTarget));$('#explore-button').addEventListener('click',()=>travel(next));$('#portal').addEventListener('click',()=>travel(next));$('#enter-button').addEventListener('click',()=>travel(next));$$('.close-panel').forEach(b=>b.addEventListener('click',()=>closePanels()));$('#panel-backdrop').addEventListener('click',()=>closePanels());$('#start-exploring').addEventListener('click',()=>closePanels());$('.brand').addEventListener('click',e=>{e.preventDefault();travel(3,false)});
$('#motion-toggle').addEventListener('click',()=>{paused=!paused;document.body.classList.toggle('paused',paused);$('#motion-toggle').setAttribute('aria-pressed',String(paused));$('#motion-toggle').setAttribute('aria-label',paused?'恢复环境动画':'暂停环境动画');$('#motion-toggle svg').innerHTML=paused?'<path d="M5 3l7 5-7 5Z"/>':'<path d="M5 3v10M11 3v10"/>';if(paused)stopAnimation();else startAnimation()});
addEventListener('keydown',e=>{if(e.key==='Escape')closePanels();if(activePanel&&e.key==='Tab'){const focusables=[...activePanel.querySelectorAll('button,a')];const first=focusables[0],last=focusables.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus()}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus()}return}if(activePanel||busy||e.altKey||e.ctrlKey||e.metaKey)return;if(e.key==='ArrowRight'||e.key==='ArrowLeft'){e.preventDefault();travel((current+(e.key==='ArrowRight'?1:7))%8,false)}});
let touchStart=null;addEventListener('touchstart',e=>{if(e.target.closest('nav,.panel'))return;touchStart={x:e.touches[0].clientX,y:e.touches[0].clientY}},{passive:true});addEventListener('touchend',e=>{if(!touchStart||activePanel)return;const dx=e.changedTouches[0].clientX-touchStart.x,dy=e.changedTouches[0].clientY-touchStart.y;if(Math.abs(dx)>65&&Math.abs(dx)>Math.abs(dy)*1.4)travel((current+(dx<0?1:7))%8,false);touchStart=null},{passive:true});
let pointer={x:0,y:0},pointerQueued=false;addEventListener('pointermove',e=>{if(reduced||paused||innerWidth<769||e.pointerType==='touch')return;pointer={x:(e.clientX/innerWidth-.5)*18,y:(e.clientY/innerHeight-.5)*14};if(!pointerQueued){pointerQueued=true;requestAnimationFrame(()=>{document.documentElement.style.setProperty('--px',`${pointer.x}px`);document.documentElement.style.setProperty('--py',`${pointer.y}px`);pointerQueued=false})}},{passive:true});
addEventListener('resize',()=>{resizeDust();updateInformation()});document.addEventListener('visibilitychange',()=>{if(document.hidden)stopAnimation();else if(!paused)startAnimation()});
async function boot(){populate();const initial=planets.findIndex(p=>`#${p.name.toLowerCase()}`===location.hash);if(initial>=0)current=initial;updateInformation();setBackground(current,$('.current'));resizeDust();const assets=['assets/mars-landscape.webp','assets/earth-landscape.webp','assets/earth.jpg','assets/mars.jpg','assets/earth-aerial.webp','assets/mars-aerial.webp'];let completed=0;const start=performance.now();const ticker=setInterval(()=>{$('#progress').textContent=String(Math.min(99,Math.round(completed/assets.length*85+Math.min((performance.now()-start)/100,14))))},40);await Promise.all(assets.map(src=>preload(src).then(()=>completed++)));await Promise.all([Promise.all([document.fonts.ready,document.fonts.load('900 100px VoyageSC','火星地球天王星'),document.fonts.load('600 14px VoyageSC','关于启程')]),initializeGlobe(),wait(reduced?0:950)]);clearInterval(ticker);$('#progress').textContent='100';await wait(reduced?0:170);document.body.classList.add('ready');if(!paused)startAnimation();if(paused){$('#motion-toggle').setAttribute('aria-pressed','true');$('#motion-toggle').setAttribute('aria-label','恢复环境动画');$('#motion-toggle svg').innerHTML='<path d="M5 3l7 5-7 5Z"/>'}}
boot().catch(err=>{console.error(err);document.body.classList.add('ready')});
