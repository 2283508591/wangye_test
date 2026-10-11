'use strict';
(() => {
  const journey=document.getElementById('journey');
  const stage=journey.querySelector('.journey-sticky');
  const root=document.documentElement;
  const hero=document.querySelector('.hero');
  const advance=document.getElementById('journey-advance');
  const selected=document.getElementById('selected');
  const archive=document.getElementById('archive');
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const clamp=v=>Math.min(1,Math.max(0,v));
  const smooth=(a,b,v)=>{const t=clamp((v-a)/(b-a));return t*t*(3-2*t);};
  let frame=0,lastVisible=false,lens=null,currentProgress=0;
  function updateJourney(){
    frame=0;
    const bounds=journey.getBoundingClientRect();
    const height=stage.getBoundingClientRect().height;
    const p=clamp(-bounds.top/Math.max(1,journey.offsetHeight-height));currentProgress=p;
    const push=smooth(.44,.84,p),gather=smooth(.49,.89,p),settled=smooth(.80,.94,p);
    const heroOpacity=smooth(.10,.21,p)*(1-smooth(.42,.55,p));
    root.style.setProperty('--portal-scale',reduced?1:1+smooth(.02,.29,p)*.17+push*4.2);
    root.style.setProperty('--portal-alpha',1-smooth(.66,.84,p));
    root.style.setProperty('--cloud-scale',reduced?1:1.1+push*.12);
    root.style.setProperty('--backdrop-blur',(smooth(.71,.91,p)*(innerWidth<600?6:9)).toFixed(2)+'px');
    root.style.setProperty('--scene-dim',(.14+settled*.29).toFixed(3));
    root.style.setProperty('--hero-alpha',heroOpacity.toFixed(3));
    root.style.setProperty('--entry-hint-alpha',(1-smooth(.08,.16,p)).toFixed(3));
    root.style.setProperty('--rail-alpha',Math.max(heroOpacity,settled).toFixed(3));
    root.style.setProperty('--selected-alpha',settled.toFixed(3));
    root.style.setProperty('--film-alpha',smooth(.50,.65,p).toFixed(3));
    root.style.setProperty('--entry-offset',((reduced?26:67)*(1-gather)).toFixed(3));
    root.style.setProperty('--entry-drop',((innerWidth<600?65:105)*(1-gather)).toFixed(3));
    root.style.setProperty('--entry-turn',((reduced?0:19)*(1-gather)).toFixed(3));
    root.style.setProperty('--entry-tilt',((reduced?0:8)*(1-gather)).toFixed(3));
    root.style.setProperty('--journey-progress',p.toFixed(4));
    journey.classList.toggle('is-gathering',p<.91);
    hero.inert=heroOpacity<.4;selected.inert=p<.89||bounds.bottom<height*.25;
    advance.disabled=p>=.89||bounds.bottom<height*.5;
    advance.setAttribute('aria-label',p<.16?'进入个人信息':'进入精选作品');
    document.querySelector('.journey-phase').textContent=p<.49?'01 / INTO THE DREAM':'02 / SELECTED MOTION';
    const visible=p>.89&&bounds.bottom>height*.65&&bounds.top<0;
    if(visible!==lastVisible){lastVisible=visible;document.dispatchEvent(new CustomEvent('journeyvisibility',{detail:visible}));}
    const archiveBounds=archive.getBoundingClientRect();
    const entry=clamp((innerHeight-archiveBounds.top)/innerHeight);
    root.style.setProperty('--archive-entry',entry.toFixed(3));
    const navTarget=archiveBounds.top<innerHeight*.48?'#archive':p>.63?'#selected':'#about';
    document.querySelectorAll('.nav-link').forEach(a=>a.classList.toggle('active',a.getAttribute('href')===navTarget));
    if(lens){lens.entry=entry;lens.visible=archiveBounds.top<innerHeight&&archiveBounds.bottom>0;lens.request();}
    document.body.dataset.journeyPhase=p<.12?'entrance':p<.49?'about':p<.89?'gather':'films';
  }
  function requestUpdate(){if(!frame)frame=requestAnimationFrame(updateJourney);}
  function scrollToPhase(id,behavior=reduced?'auto':'smooth'){
    const top=journey.getBoundingClientRect().top+scrollY;
    const travel=journey.offsetHeight-stage.getBoundingClientRect().height;
    const y=id==='selected'?top+travel*.97:id==='about'?top+travel*.30:id==='home'?top:id==='archive'?archive.getBoundingClientRect().top+scrollY:null;
    if(y!==null)window.scrollTo({top:y,behavior});
  }
  document.querySelectorAll('a[href="#home"],a[href="#about"],a[href="#selected"],a[href="#archive"]').forEach(a=>a.addEventListener('click',e=>{e.preventDefault();const id=a.getAttribute('href').slice(1);history.replaceState(null,'','#'+id);scrollToPhase(id);}));
  advance.addEventListener('click',()=>{if(!document.getElementById('editor').hidden)return;const next=currentProgress<.16?'about':'selected';history.replaceState(null,'','#'+next);scrollToPhase(next);});
  document.addEventListener('keydown',e=>{if(e.key==='ArrowDown'&&e.target===advance){e.preventDefault();advance.click();}});
  // Bring the relevant scene into view when selecting a field in the copy editor.
  document.getElementById('field-select').addEventListener('change',e=>{
    const field=e.target.value;
    if(field==='name'||field==='bio')scrollToPhase('about');
    else if(field.startsWith('hero')||field==='eyebrow')scrollToPhase('about');
    else if(field.startsWith('selected'))scrollToPhase('selected');
    else if(field.startsWith('contact')||field==='footerName')scrollToPhase('archive');
  });
  addEventListener('scroll',requestUpdate,{passive:true});
  addEventListener('resize',()=>{requestUpdate();lens?.resize();},{passive:true});
  addEventListener('orientationchange',requestUpdate,{passive:true});
  addEventListener('pageshow',requestUpdate);
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)requestUpdate();});
  updateJourney();
  if(['#selected','#about','#archive'].includes(location.hash))requestAnimationFrame(()=>scrollToPhase(location.hash.slice(1),'auto'));

  // Keep every poster rigid: gently shrink whole cells, with a subtle RGB fringe.
  // The DOM wall remains the keyboard-accessible and WebGL-unavailable fallback.
  function initLens(workList){
    if(lens)return;
    const canvas=document.getElementById('archive-lens');
    const gl=canvas.getContext('webgl',{alpha:false,antialias:false,powerPreference:'low-power',preserveDrawingBuffer:true});
    if(!gl)return;
    const vertex=`attribute vec2 a_position; varying vec2 v_uv; void main(){v_uv=a_position*.5+.5;gl_Position=vec4(a_position,0.,1.);}`;
    const fragment=`precision mediump float;
      varying vec2 v_uv; uniform sampler2D u_texture; uniform float u_aspect; uniform vec2 u_zoom; uniform vec2 u_shift; uniform float u_strength;
      void main(){
        vec2 p=(v_uv*2.-1.)*vec2(u_aspect,1.);
        float r2=dot(p,p);
        vec2 q=p;
        float angle=.003; float c=cos(angle),s=sin(angle);
        q=mat2(c,-s,s,c)*q;
        vec2 raw=q/vec2(u_aspect*2.,2.)*u_zoom+.5+u_shift;
        vec2 grid=vec2(6.,4.),cell=floor(raw*grid);
        vec2 center=((cell+.5)/grid-.5-u_shift)/u_zoom;
        float edgeDistance=clamp(length(center*vec2(u_aspect,1.))/max(u_aspect,1.),0.,1.);
        float cellScale=1.-u_strength*(1.-edgeDistance);
        vec2 local=(fract(raw*grid)-.5)/cellScale+.5;
        if(any(lessThan(local,vec2(0.)))||any(greaterThan(local,vec2(1.)))){
          gl_FragColor=vec4(.0784,.0510,.1059,1.);return;
        }
        vec2 uv=(cell+local)/grid;
        vec2 fringe=normalize(p+vec2(.0001))*(.00008+.00022*min(r2,2.5));
        vec3 color;
        color.r=texture2D(u_texture,fract(uv+fringe)).r;
        color.g=texture2D(u_texture,fract(uv)).g;
        color.b=texture2D(u_texture,fract(uv-fringe)).b;
        color=mix(vec3(dot(color,vec3(.299,.587,.114))),color,.80);
        float edge=1.-.08*smoothstep(.3,2.,r2);
        gl_FragColor=vec4(color*edge,1.);
      }`;
    function shader(type,source){const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS)){gl.deleteShader(s);throw new Error('Lens shader unavailable');}return s;}
    let program;
    try{program=gl.createProgram();gl.attachShader(program,shader(gl.VERTEX_SHADER,vertex));gl.attachShader(program,shader(gl.FRAGMENT_SHADER,fragment));gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))return;}catch{return;}
    gl.useProgram(program);
    const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);
    const position=gl.getAttribLocation(program,'a_position');gl.enableVertexAttribArray(position);gl.vertexAttribPointer(position,2,gl.FLOAT,false,0,0);
    const texture=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,texture);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
    const uniforms=Object.fromEntries(['u_aspect','u_zoom','u_shift','u_strength'].map(n=>[n,gl.getUniformLocation(program,n)]));
    const atlas=document.createElement('canvas');atlas.width=2304;atlas.height=892;
    const ctx=atlas.getContext('2d');const cols=6,rows=4,cw=atlas.width/cols,ch=atlas.height/rows;
    const atlasWorks=[...workList,...[8,13,6,16,11].map(i=>workList[i]).filter(Boolean)];
    const images=atlasWorks.map(w=>{const im=new Image();im.src=w.poster;return im;});
    let category='全部',renderFrame=0,ready=false,shiftX=0,shiftY=0,targetX=0,targetY=0,panX=0,ratio=1,zoom=[1,1],strength=.10,contextLost=false;
    // Texture-space drift is separate from the user's drag and pointer parallax.
    // Negative texture movement makes the visible wall travel gently to the right.
    const driftPixelsPerSecond=6;
    let driftX=0,lastTime=0,lastDraw=0;
    function roundedRect(x,y,w,h,r){ctx.beginPath();ctx.moveTo(x+r,y);ctx.arcTo(x+w,y,x+w,y+h,r);ctx.arcTo(x+w,y+h,x,y+h,r);ctx.arcTo(x,y+h,x,y,r);ctx.arcTo(x,y,x+w,y,r);ctx.closePath();}
    function uploadAtlas(){
      ctx.fillStyle='#140d1b';ctx.fillRect(0,0,atlas.width,atlas.height);
      atlasWorks.forEach((w,i)=>{
        const image=images[i],x=(i%cols)*cw+8,y=Math.floor(i/cols)*ch+8,width=cw-16,height=ch-16;
        ctx.save();roundedRect(x,y,width,height,20);ctx.clip();ctx.fillStyle='#29232f';ctx.fillRect(x,y,width,height);
        if(image.complete&&image.naturalWidth){const cover=Math.max(width/image.naturalWidth,height/image.naturalHeight),sw=width/cover,sh=height/cover;ctx.drawImage(image,(image.naturalWidth-sw)/2,(image.naturalHeight-sh)/2,sw,sh,x,y,width,height);}
        if(category!=='全部'&&w.category!==category){ctx.fillStyle='#100a17e8';ctx.fillRect(x,y,width,height);}
        else{const shade=ctx.createLinearGradient(0,y,0,y+height);shade.addColorStop(0,'#11091a00');shade.addColorStop(.7,'#11091a08');shade.addColorStop(1,'#11091a70');ctx.fillStyle=shade;ctx.fillRect(x,y,width,height);}
        ctx.restore();ctx.strokeStyle='#dfb8f029';ctx.lineWidth=2;roundedRect(x,y,width,height,20);ctx.stroke();
      });
      gl.bindTexture(gl.TEXTURE_2D,texture);gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,atlas);
      ready=true;canvas.classList.add('is-ready');archive.classList.add('lens-ready');requestDraw();
    }
    function resize(){
      const rect=archive.getBoundingClientRect(),dpr=Math.min(devicePixelRatio||1,innerWidth<1100?1.3:1.5);
      canvas.width=Math.round(rect.width*dpr);canvas.height=Math.round(rect.height*dpr);ratio=rect.width/rect.height;
      zoom=MotionLayout.archiveMetrics(rect.width,rect.height).zoom;strength=.05;
      gl.viewport(0,0,canvas.width,canvas.height);requestDraw();
    }
    function render(time){
      renderFrame=0;
      if(!ready||contextLost||!lens.visible||document.hidden){lastTime=0;return;}
      const elapsed=lastTime?Math.min((time-lastTime)/1000,.1):0;lastTime=time;
      const paused=down||document.getElementById('player-dialog').open||!document.getElementById('editor').hidden||archive.querySelector('.archive-wall:focus-within');
      if(!reduced&&!paused){
        const width=canvas.clientWidth||1,z=.96+.04*lens.entry;
        driftX=(driftX-driftPixelsPerSecond*elapsed/width*zoom[0]*z)%1;
      }
      // Thirty draws per second are ample for this slow movement on phones/tablets.
      if(!reduced&&time-lastDraw<1000/30){requestDraw();return;}lastDraw=time;
      shiftX+=(targetX-shiftX)*.12;shiftY+=(targetY-shiftY)*.12;
      gl.useProgram(program);gl.uniform1f(uniforms.u_aspect,ratio);gl.uniform2f(uniforms.u_zoom,zoom[0]*(.96+.04*lens.entry),zoom[1]*(.96+.04*lens.entry));gl.uniform1f(uniforms.u_strength,strength);gl.uniform2f(uniforms.u_shift,shiftX+driftX,shiftY);gl.drawArrays(gl.TRIANGLES,0,6);
      if(!reduced||Math.abs(targetX-shiftX)+Math.abs(targetY-shiftY)>.00008)requestDraw();
    }
    function requestDraw(){if(!renderFrame&&!contextLost)renderFrame=requestAnimationFrame(render);}
    function hitAt(event){
      const rect=canvas.getBoundingClientRect();
      const index=MotionLayout.archiveHit((event.clientX-rect.left)/rect.width,(event.clientY-rect.top)/rect.height,{ratio,zoom},[shiftX+driftX,shiftY],.96+.04*lens.entry,strength);
      const w=index===null?null:atlasWorks[index];return w&&(category==='全部'||w.category===category)?w:null;
    }
    const caption=document.getElementById('lens-caption');let down=null;
    canvas.addEventListener('pointerdown',e=>{if(e.button!==0)return;down={x:e.clientX,y:e.clientY,pan:panX,dragging:false};});
    canvas.addEventListener('pointerup',e=>{if(!down)return;const wasDrag=down.dragging,moved=Math.hypot(e.clientX-down.x,e.clientY-down.y);if(wasDrag)panX=targetX;down=null;if(wasDrag||moved>15)return;const w=hitAt(e);if(w)openPlayer(w);});
    canvas.addEventListener('pointercancel',()=>{if(down?.dragging)panX=targetX;down=null;});
    canvas.addEventListener('pointermove',e=>{
      const rect=canvas.getBoundingClientRect();
      if(down){const dx=e.clientX-down.x,dy=e.clientY-down.y;if(Math.abs(dx)>12&&Math.abs(dx)>Math.abs(dy))down.dragging=true;if(down.dragging){if(!canvas.hasPointerCapture(e.pointerId))canvas.setPointerCapture(e.pointerId);targetX=down.pan-dx/rect.width*.6;caption.classList.remove('visible');canvas.style.cursor='grabbing';requestDraw();return;}}
      if(!reduced&&e.pointerType==='mouse'){targetX=panX+((e.clientX-rect.left)/rect.width-.5)*.025;targetY=-((e.clientY-rect.top)/rect.height-.5)*.014;requestDraw();}
      const w=hitAt(e);if(w&&e.pointerType==='mouse'){caption.textContent=w.title+' / '+w.category+' ↗';caption.style.left=Math.min(rect.width-230,Math.max(15,e.clientX-rect.left+18))+'px';caption.style.top=Math.max(15,e.clientY-rect.top-42)+'px';caption.classList.add('visible');canvas.style.cursor='pointer';}else{caption.classList.remove('visible');canvas.style.cursor='grab';}
    });
    canvas.addEventListener('pointerleave',()=>{caption.classList.remove('visible');if(!down){targetX=panX;targetY=0;}requestDraw();});
    document.getElementById('archive-filters').addEventListener('click',e=>{const b=e.target.closest('[data-category]');if(b){category=b.dataset.category;uploadAtlas();}});
    canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();contextLost=true;canvas.classList.remove('is-ready');archive.classList.remove('lens-ready');});
    lens={request:requestDraw,resize,entry:0,visible:false};resize();
    Promise.all(images.map(image=>image.decode().catch(()=>{}))).then(()=>{uploadAtlas();requestUpdate();});
  }
  document.addEventListener('motionworksready',e=>{initLens(e.detail);document.querySelectorAll('.intro-reel').forEach(b=>{const w=e.detail[+b.dataset.workIndex];if(!w)return;b.querySelector('img').src=w.poster;b.setAttribute('aria-label','预览作品 '+w.title);b.addEventListener('click',()=>openPlayer(w));});});
  if(typeof works!=='undefined'&&works.length)initLens(works);
})();
