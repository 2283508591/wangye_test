import * as THREE from './assets/three.module.js';
const clamp=x=>Math.max(0,Math.min(1,x));
const smooth=(a,b,x)=>{const t=clamp((x-a)/(b-a));return t*t*(3-2*t)};
const mix=(a,b,t)=>a+(b-a)*t;
let engine;
function makeEngine(){
 const canvas=document.createElement('canvas');canvas.className='flight-canvas';canvas.setAttribute('aria-hidden','true');
 const renderer=new THREE.WebGLRenderer({canvas,alpha:false,antialias:true,powerPreference:'low-power'});renderer.setPixelRatio(Math.min(devicePixelRatio,innerWidth<769?1.25:1.5));renderer.outputColorSpace=THREE.SRGBColorSpace;
 const space=new THREE.Scene();space.background=new THREE.Color('#020407');space.add(new THREE.AmbientLight(0xffffff,2));const sun=new THREE.DirectionalLight(0xfff5e5,2.3);sun.position.set(-3,5,7);space.add(sun);
 const globe=new THREE.Mesh(new THREE.SphereGeometry(2.6,72,56),new THREE.MeshStandardMaterial({roughness:.9}));space.add(globe);
 const clouds=new THREE.Mesh(new THREE.SphereGeometry(2.617,64,48),new THREE.MeshStandardMaterial({color:0xffffff,transparent:true,opacity:.68,depthWrite:false}));space.add(clouds);
 const positions=[];for(let i=0;i<350;i++)positions.push((Math.random()-.5)*18,(Math.random()-.5)*18,-6-Math.random()*5);const starGeometry=new THREE.BufferGeometry();starGeometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));const stars=new THREE.Points(starGeometry,new THREE.PointsMaterial({color:0xdbe5ed,size:.025,transparent:true,opacity:.8}));space.add(stars);
 const rings=new THREE.Mesh(new THREE.RingGeometry(3.1,4.25,96),new THREE.MeshBasicMaterial({color:0xcab797,side:THREE.DoubleSide,transparent:true,opacity:.65}));rings.rotation.set(-1.05,0,-.28);space.add(rings);
 const camera=new THREE.PerspectiveCamera(42,1,.03,1000);
 const groundScene=new THREE.Scene();groundScene.background=new THREE.Color('#8a5d42');
 const fogScene=new THREE.Scene(),fogCamera=new THREE.OrthographicCamera(-1,1,1,-1,0,1);
 const fogMaterial=new THREE.ShaderMaterial({transparent:true,depthTest:false,depthWrite:false,uniforms:{uTime:{value:0},uOpacity:{value:0},uWarm:{value:0}},vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}',fragmentShader:`varying vec2 vUv;uniform float uTime,uOpacity,uWarm;
 float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1.,0.)),f.x),mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.,1.)),f.x),f.y);}float fbm(vec2 p){float v=0.,a=.5;for(int i=0;i<5;i++){v+=noise(p)*a;p=p*2.04+vec2(31.7,17.3);a*=.5;}return v;}
 void main(){vec2 p=vUv-.5;float radius=length(p);vec2 wind=p/(.44+uTime*.25)+vec2(uTime*.12,-uTime*.17);float n=fbm(wind*7.);float streak=fbm(p*14.+vec2(-uTime*.9,uTime*.4));float density=smoothstep(.18,.73,n*.8+streak*.2);vec3 cold=mix(vec3(.48,.57,.63),vec3(.97,.985,1.),density);vec3 warm=mix(vec3(.45,.25,.14),vec3(.98,.82,.62),density);vec3 color=mix(cold,warm,uWarm);float alpha=uOpacity*(.76+.24*density);gl_FragColor=vec4(color,alpha);}`});fogScene.add(new THREE.Mesh(new THREE.PlaneGeometry(2,2),fogMaterial));
 return{canvas,renderer,space,camera,globe,clouds,rings,stars,groundScene,fogScene,fogCamera,fogMaterial,loader:new THREE.TextureLoader(),landscapes:new Map()};
}
function createSurface(texture,aerial,aspect,mobile){
 const material=new THREE.ShaderMaterial({depthTest:false,depthWrite:false,uniforms:{tGround:{value:texture},tAerial:{value:aerial},uProgress:{value:0},uAspect:{value:aspect},uGroundAspect:{value:texture.image.width/texture.image.height},uAerialAspect:{value:aerial.image.width/aerial.image.height},uMobile:{value:mobile?1:0}},vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}',fragmentShader:`varying vec2 vUv;uniform sampler2D tGround,tAerial;uniform float uProgress,uAspect,uGroundAspect,uAerialAspect,uMobile;
 vec2 cover(vec2 uv,float imageAspect){vec2 scale=vec2(1.);if(uAspect>imageAspect)scale.y=imageAspect/uAspect;else scale.x=uAspect/imageAspect;return clamp(vec2(.5+.07*uMobile*(1.-scale.x),.5)+(uv-.5)*scale,vec2(.002),vec2(.998));}
 vec4 blurPhoto(sampler2D tex,vec2 uv,float amount){vec2 direction=(uv-.5)*amount;vec4 c=texture2D(tex,uv)*.4;c+=texture2D(tex,uv+direction)*.2;c+=texture2D(tex,uv-direction)*.2;c+=texture2D(tex,uv+direction*2.)*.1;c+=texture2D(tex,uv-direction*2.)*.1;return c;}
 void main(){float p=clamp(uProgress,0.,1.),land=p*p*(3.-2.*p);vec2 aerialUv=(vUv-.5)/mix(1.04,1.7,land)+.5;aerialUv.x=.5+(aerialUv.x-.5)/(1.+.14*(1.-land)*(aerialUv.y-.5));aerialUv.y+=land*.055;vec2 groundUv=(vUv-.5)/mix(1.38,1.0556,land)+.5;groundUv.x=.5+(groundUv.x-.5)/(1.+.12*(1.-land)*(groundUv.y-.5));groundUv.y+=(1.-land)*.045;vec4 a=blurPhoto(tAerial,cover(aerialUv,uAerialAspect),(1.-land)*.016);vec4 g=blurPhoto(tGround,cover(groundUv,uGroundAspect),(1.-land)*.008);gl_FragColor=mix(a,g,smoothstep(.4,.97,land));
#include <colorspace_fragment>
}`});
 return new THREE.Mesh(new THREE.PlaneGeometry(2,2),material);
}
export async function flyToWorld({layer,portalRect,planet,texture,cloudTexture,rotation,reduced,notify}){
 if(reduced)return;
 engine??=makeEngine();const e=engine;const mobile=innerWidth<769,fullW=innerWidth,fullH=document.querySelector('.voyage').clientHeight;
 const url=`assets/${planet.scene}.webp`;if(!e.landscapes.has(url)){const t=await e.loader.loadAsync(url);t.colorSpace=THREE.SRGBColorSpace;e.landscapes.set(url,t)}
 const aerialUrl=planet.scene.endsWith('-landscape')?`assets/${planet.scene.replace('-landscape','-aerial')}.webp`:url;if(!e.landscapes.has(aerialUrl)){const t=await e.loader.loadAsync(aerialUrl);t.colorSpace=THREE.SRGBColorSpace;e.landscapes.set(aerialUrl,t)}
 const surface=createSurface(e.landscapes.get(url),e.landscapes.get(aerialUrl),fullW/fullH,mobile);e.groundScene.add(surface);
 e.globe.material.map=texture||null;e.globe.material.color.set(texture?0xffffff:planet.color);e.globe.material.needsUpdate=true;e.globe.rotation.copy(rotation);e.clouds.rotation.copy(rotation);e.clouds.material.alphaMap=cloudTexture||null;e.clouds.material.needsUpdate=true;e.clouds.visible=planet.zh==='地球'&&!!cloudTexture;e.rings.visible=planet.zh==='土星';e.fogMaterial.uniforms.uWarm.value=planet.zh==='地球'?0:.7;
 const status=document.createElement('div');status.className='flight-status';status.innerHTML='<span class="flight-status-dot"></span><span class="flight-status-text">正在离开地表</span><span class="flight-status-number">01 / 03</span>';layer.replaceChildren(e.canvas,status);layer.classList.add('flying');layer.style.filter=planet.filter==='none'?'none':planet.filter;layer.style.opacity='1';
 let phase='',lastWidth=0,lastHeight=0;const setPhase=(id,text,n)=>{if(phase===id)return;phase=id;layer.dataset.phase=id;status.querySelector('.flight-status-text').textContent=text;status.querySelector('.flight-status-number').textContent=`0${n} / 03`;notify?.(text)};
 const started=performance.now(),total=3200;let frame=0;
 try{await new Promise(resolve=>{const tick=now=>{
  const p=clamp((now-started)/total),expand=smooth(0,.23,p);const width=mix(portalRect.width,fullW,expand),height=mix(portalRect.height,fullH,expand);
  Object.assign(layer.style,{left:`${mix(portalRect.left,0,expand)}px`,top:`${mix(portalRect.top,0,expand)}px`,width:`${width}px`,height:`${height}px`,borderRadius:`${mix(Math.min(portalRect.width,portalRect.height)*.26,0,expand)}px`});
  const rw=Math.round(width),rh=Math.round(height);if(rw!==lastWidth||rh!==lastHeight){e.renderer.setSize(rw,rh,false);lastWidth=rw;lastHeight=rh;}
  if(p<.56){const dive=smooth(.2,.56,p);e.camera.aspect=width/height;e.camera.fov=mix(42,52,dive);e.camera.position.set(0,0,mix(5.7,2.69,dive));e.camera.lookAt(0,0,-1);e.camera.updateProjectionMatrix();e.globe.position.set(.06*(1-dive),mix(-2,0,dive),0);e.clouds.position.copy(e.globe.position);e.rings.position.copy(e.globe.position);e.globe.rotation.y=rotation.y+dive*.12;e.clouds.rotation.copy(e.globe.rotation);e.stars.position.z=dive*.8;e.renderer.render(e.space,e.camera);setPhase(p<.4?'orbit':'clouds',p<.4?'正在接近'+planet.zh:'正在穿越云层',p<.4?1:2)}
  else{const q=clamp((p-.56)/.4);surface.material.uniforms.uProgress.value=q;e.renderer.render(e.groundScene,e.fogCamera);setPhase('descent','正在降落'+planet.zh,3)}
  e.fogMaterial.uniforms.uTime.value=p*4;e.fogMaterial.uniforms.uOpacity.value=smooth(.4,.55,p)*(1-smooth(.59,.76,p));e.renderer.autoClear=false;e.renderer.render(e.fogScene,e.fogCamera);e.renderer.autoClear=true;
  layer.style.opacity=String(1-smooth(.92,1,p));status.style.opacity=String(smooth(.12,.25,p)*(1-smooth(.84,.94,p)));if(p<1)frame=requestAnimationFrame(tick);else resolve();};frame=requestAnimationFrame(tick)})}
 finally{cancelAnimationFrame(frame);e.groundScene.remove(surface);surface.geometry.dispose();surface.material.dispose();layer.classList.remove('flying');layer.style.opacity='0';layer.removeAttribute('data-phase');e.canvas.remove()}
}
