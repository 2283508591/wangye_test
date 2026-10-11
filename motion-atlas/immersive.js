'use strict';
(() => {
  const journey=document.getElementById('journey');
  const stage=journey.querySelector('.journey-sticky');
  const hero=document.querySelector('.hero');
  const advance=document.getElementById('journey-advance');
  const selected=document.getElementById('selected');
  const archive=document.getElementById('archive');
  const sceneButton=document.getElementById('scene-next');
  const sceneLabel=document.getElementById('scene-next-label');
  const sceneIcon=document.getElementById('scene-next-icon');
  const phaseLabel=document.querySelector('.journey-phase');
  const navLinks=[...document.querySelectorAll('.nav-link')];
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const clamp=v=>Math.min(1,Math.max(0,v));
  const smooth=(a,b,v)=>{const t=clamp((v-a)/(b-a));return t*t*(3-2*t);};
  let frame=0,lastVisible=false,lens=null,currentProgress=0,geometry;
  let navigationFrame=0,navigating=false,settleTimer=0,gestureStart=null,touching=false,isScrolling=false,lastScrollY=scrollY;
  let downPoint=null,touchOrigin=null,ignoreTapUntil=0,lastDestination='';
  let inputKind='scroll',peakVelocity=0,movementAt=performance.now();
  let visual={value:scrollY,velocity:0},visualTime=0;
  let wheelFrame=0,wheelTime=0,wheelTarget=scrollY,wheelState={value:scrollY,velocity:0},wheelIntentTimer=0,wheelAligning=false;
  const smoothWheel=!reduced&&matchMedia('(hover:hover) and (pointer:fine)').matches;
  let lastPhase='',lastNav='',lastAdvance='';
  const diagnostic=new URLSearchParams(location.search).has('qa')?document.createElement('output'):null;
  const trace=[];
  if(diagnostic){diagnostic.id='motion-diagnostics';diagnostic.hidden=true;document.body.append(diagnostic);}
  function record(event){if(diagnostic){trace.push(event);diagnostic.textContent=JSON.stringify(trace.slice(-12));}}
  const properties=new Map();
  function setScene(name,value){if(properties.get(name)!==value){properties.set(name,value);stage.style.setProperty(name,value);}}
  function measure(){
    const j=journey.getBoundingClientRect(),a=archive.getBoundingClientRect();
    geometry={top:j.top+scrollY,height:journey.offsetHeight,stage:stage.offsetHeight,archiveTop:a.top+scrollY,archiveHeight:archive.offsetHeight,view:innerHeight,width:innerWidth};
    geometry.travel=Math.max(1,geometry.height-geometry.stage);
    geometry.points=MotionJourney.stops(geometry.top,geometry.travel,geometry.archiveTop,document.documentElement.scrollHeight-innerHeight);
  }
  function updateJourney(time=performance.now()){
    frame=0;if(!geometry)measure();
    const dt=visualTime?Math.min((time-visualTime)/1000,.05):1/60;visualTime=time;
    // Native touch scrolling stays responsive. Only the pinned visual timeline
    // follows a short damped response; click navigation already has its own easing.
    visual=reduced?{value:scrollY,velocity:0}:MotionJourney.damp(visual,scrollY,dt,navigating?.10:.16);
    const unsettled=Math.abs(visual.value-scrollY)>.08||Math.abs(visual.velocity)>.5;
    if(!unsettled)visual={value:scrollY,velocity:0};
    const g=geometry,y=visual.value,bottom=g.top+g.height-scrollY,archiveTop=g.archiveTop-scrollY;
    const p=clamp((y-g.top)/g.travel);currentProgress=p;
    MotionMedia.prepare(p,archiveTop,g.view);
    const push=smooth(.44,.84,p),gather=smooth(.49,.89,p),settled=smooth(.80,.94,p);
    const heroOpacity=smooth(.10,.21,p)*(1-smooth(.42,.55,p));
    // Scope changing variables to the pinned scene, and never read layout after writes.
    setScene('--portal-scale',(reduced?1:1+smooth(.02,.29,p)*.17+push*4.2).toFixed(3));
    setScene('--portal-alpha',(1-smooth(.66,.84,p)).toFixed(3));
    setScene('--cloud-scale',(reduced?1:1.1+push*.12).toFixed(3));
    setScene('--cloud-soft-alpha',smooth(.71,.91,p).toFixed(3));
    setScene('--scene-dim',(.14+settled*.29).toFixed(3));
    setScene('--hero-alpha',heroOpacity.toFixed(3));
    setScene('--entry-hint-alpha',(1-smooth(.08,.16,p)).toFixed(3));
    setScene('--rail-alpha',Math.max(heroOpacity,settled).toFixed(3));
    setScene('--selected-alpha',settled.toFixed(3));
    setScene('--film-alpha',smooth(.50,.65,p).toFixed(3));
    setScene('--entry-offset',((reduced?26:67)*(1-gather)).toFixed(3));
    setScene('--entry-drop',((g.width<600?65:105)*(1-gather)).toFixed(3));
    setScene('--entry-turn',((reduced?0:19)*(1-gather)).toFixed(3));
    setScene('--entry-tilt',((reduced?0:8)*(1-gather)).toFixed(3));
    setScene('--journey-progress',p.toFixed(4));
    journey.classList.toggle('is-gathering',p<.91);
    hero.inert=heroOpacity<.4;selected.inert=p<.89||bottom<g.stage*.25;
    advance.disabled=p>=.89||bottom<g.stage*.5;
    const advanceLabel=p<.16?'进入个人信息':'进入精选作品';
    if(advanceLabel!==lastAdvance){lastAdvance=advanceLabel;advance.setAttribute('aria-label',advanceLabel);}
    const phaseText=p<.49?'01 / INTO THE DREAM':'02 / SELECTED MOTION';
    if(phaseLabel.textContent!==phaseText)phaseLabel.textContent=phaseText;
    const visible=p>.89&&bottom>g.stage*.65&&y>g.top;
    if(visible!==lastVisible){lastVisible=visible;document.dispatchEvent(new CustomEvent('journeyvisibility',{detail:visible}));}
    const entry=clamp((g.view-archiveTop)/g.view);
    const navTarget=archiveTop<g.view*.48?'#archive':p>.63?'#selected':'#about';
    if(navTarget!==lastNav){lastNav=navTarget;navLinks.forEach(a=>a.classList.toggle('active',a.getAttribute('href')===navTarget));}
    const destination=MotionJourney.next(p,archiveTop<g.view*.5);
    if(destination!==lastDestination){
      lastDestination=destination;sceneButton.dataset.destination=destination;
      sceneButton.setAttribute('aria-label',({about:'进入个人信息',selected:'进入精选作品',archive:'进入全部作品',home:'返回顶部'})[destination]);
      sceneLabel.textContent=({about:'个人信息',selected:'进入作品',archive:'下一页',home:'返回顶部'})[destination];
      sceneIcon.textContent=destination==='home'?'↑':'↓';
      sceneButton.classList.toggle('is-return',destination==='home');
    }
    if(lens){lens.entry=entry;lens.visible=archiveTop<g.view&&archiveTop+g.archiveHeight>0;lens.request();}
    const phase=archiveTop<g.view*.5?'archive':p<.12?'entrance':p<.49?'about':p<.89?'gather':'films';
    if(phase!==lastPhase){lastPhase=phase;document.body.dataset.journeyPhase=phase;}
    if(unsettled)requestUpdate();
  }
  function requestUpdate(){if(!frame)frame=requestAnimationFrame(updateJourney);}
  function cancelNavigation(){cancelAnimationFrame(navigationFrame);navigationFrame=0;navigating=false;}
  function cancelWheel(){cancelAnimationFrame(wheelFrame);clearTimeout(wheelIntentTimer);wheelFrame=0;wheelTime=0;wheelAligning=false;}
  function scrollToPhase(id,behavior=reduced?'auto':'smooth'){
    const index=MotionJourney.names.indexOf(id);if(index<0)return;
    cancelNavigation();cancelWheel();clearTimeout(settleTimer);gestureStart=null;isScrolling=false;measure();
    const start=scrollY,target=geometry.points[index];
    record({action:'navigate',id,start,target});
    history.replaceState(null,'','#'+id);
    if(behavior==='auto'||Math.abs(target-start)<2){visual={value:target,velocity:0};lastScrollY=target;window.scrollTo(0,target);requestUpdate();return;}
    navigating=true;let started,previousTime;const frameTimes=[];
    const duration=Math.min(1500,Math.max(850,Math.abs(target-start)*.42));
    function step(time){
      if(diagnostic&&previousTime)frameTimes.push(time-previousTime);previousTime=time;
      started??=time;const t=clamp((time-started)/duration),ease=MotionJourney.ease(t);
      window.scrollTo(0,start+(target-start)*ease);requestUpdate();
      if(t<1)navigationFrame=requestAnimationFrame(step);
      else{
        navigationFrame=0;navigating=false;window.scrollTo(0,target);requestUpdate();lens?.request();
        if(diagnostic&&frameTimes.length){const sorted=[...frameTimes].sort((a,b)=>a-b);record({action:'complete',id,frames:frameTimes.length,medianFrameMs:+sorted[Math.floor(sorted.length*.5)].toFixed(1),p95FrameMs:+sorted[Math.floor(sorted.length*.95)].toFixed(1)});}
      }
    }
    navigationFrame=requestAnimationFrame(step);
  }
  function nextScene(){if(document.getElementById('player-dialog').open||!document.getElementById('editor').hidden)return;scrollToPhase(lastDestination||'about');}
  function settleGesture(){
    clearTimeout(settleTimer);
    if(navigating||wheelFrame||touching||gestureStart===null)return;
    const start=gestureStart;gestureStart=null;isScrolling=false;
    const destination=MotionJourney.settle(geometry.points,start,scrollY,{view:geometry.view,input:inputKind,velocity:peakVelocity});
    record({action:'settle',start,end:scrollY,input:inputKind,destination});
    peakVelocity=0;
    if(destination)scrollToPhase(destination);else lens?.request();
  }
  function queueSettle(){clearTimeout(settleTimer);settleTimer=setTimeout(settleGesture,440);}
  function beginGesture(kind=inputKind){cancelNavigation();if(kind!=='wheel')cancelWheel();inputKind=kind;if(gestureStart===null){gestureStart=lastScrollY;peakVelocity=0;movementAt=performance.now();}}
  function moveWheel(time){
    const dt=wheelTime?Math.min((time-wheelTime)/1000,.05):1/60;wheelTime=time;
    wheelState=MotionJourney.damp(wheelState,wheelTarget,dt,wheelAligning?.30:.17);
    window.scrollTo(0,wheelState.value);requestUpdate();
    if(Math.abs(wheelState.value-wheelTarget)>.35||Math.abs(wheelState.velocity)>3)wheelFrame=requestAnimationFrame(moveWheel);
    else{wheelFrame=0;wheelTime=0;wheelAligning=false;isScrolling=false;window.scrollTo(0,wheelTarget);queueSettle();lens?.request();}
  }
  function alignWheel(){
    if(!wheelFrame||gestureStart===null||touching)return;
    const id=MotionJourney.settle(geometry.points,gestureStart,wheelTarget,{view:geometry.view,input:'wheel'});
    if(!id)return;
    // Extend the same damped trajectory before it comes to rest. Do not stop
    // the wheel animation and then launch a second page-snap animation.
    record({action:'wheel-align',id,start:wheelState.value,target:geometry.points[MotionJourney.names.indexOf(id)]});
    wheelTarget=geometry.points[MotionJourney.names.indexOf(id)];wheelAligning=true;gestureStart=null;
    clearTimeout(settleTimer);history.replaceState(null,'','#'+id);
  }
  addEventListener('wheel',e=>{
    if(e.ctrlKey||e.metaKey||e.shiftKey||Math.abs(e.deltaY)<Math.abs(e.deltaX)||e.target.closest('dialog,.editor'))return;
    beginGesture('wheel');
    if(!smoothWheel||!e.cancelable)return;
    e.preventDefault();clearTimeout(settleTimer);
    if(wheelAligning){wheelTarget=wheelState.value;wheelAligning=false;}
    if(!wheelFrame){wheelState={value:scrollY,velocity:0};wheelTarget=scrollY;}
    wheelTarget=Math.max(0,Math.min(document.documentElement.scrollHeight-innerHeight,wheelTarget+MotionJourney.wheelPixels(e.deltaY,e.deltaMode,geometry.view)));
    if(!wheelFrame)wheelFrame=requestAnimationFrame(moveWheel);
    clearTimeout(wheelIntentTimer);wheelIntentTimer=setTimeout(alignWheel,220);
  },{passive:false});
  addEventListener('pointerdown',e=>{
    if(e.target.closest('dialog,.editor'))return;
    if(e.pointerType!=='touch'&&e.target.closest('button,a,input,select,textarea,video'))return;
    cancelWheel();beginGesture(e.pointerType==='touch'?'touch':'scroll');gestureStart=scrollY;touching=e.pointerType==='touch';downPoint={x:e.clientX,y:e.clientY};
  },{passive:true});
  addEventListener('pointerup',e=>{if(downPoint&&Math.hypot(e.clientX-downPoint.x,e.clientY-downPoint.y)>12)ignoreTapUntil=performance.now()+450;touching=false;downPoint=null;queueSettle();},{passive:true});
  // Native mobile panning cancels pointer events before the finger is released.
  // Track touch end separately so settling never interrupts a held gesture.
  addEventListener('pointercancel',()=>{ignoreTapUntil=performance.now()+450;downPoint=null;queueSettle();},{passive:true});
  addEventListener('touchstart',e=>{if(e.target.closest('dialog,.editor'))return;touching=true;touchOrigin=e.touches[0];beginGesture('touch');gestureStart=scrollY;},{passive:true});
  function finishTouch(e){const end=e.changedTouches[0];if(touchOrigin&&end&&Math.hypot(end.clientX-touchOrigin.clientX,end.clientY-touchOrigin.clientY)>12)ignoreTapUntil=performance.now()+450;touchOrigin=null;touching=!!e.touches.length;queueSettle();}
  addEventListener('touchend',finishTouch,{passive:true});
  addEventListener('touchcancel',finishTouch,{passive:true});
  addEventListener('scroll',()=>{
    const y=scrollY,now=performance.now(),dt=now-movementAt;
    if(!navigating&&dt>0&&dt<120)peakVelocity=Math.max(peakVelocity,Math.abs(y-lastScrollY)/dt);
    movementAt=now;
    // Only deliberate input may trigger page alignment. Focus restoration and
    // browser resize/anchor adjustments must never start a second navigation.
    if(!navigating&&gestureStart!==null&&Math.abs(y-lastScrollY)>.5){isScrolling=true;queueSettle();}
    lastScrollY=y;requestUpdate();
  },{passive:true});
  // Wait for both native inertia and the last input burst before aligning a scene.
  addEventListener('scrollend',queueSettle,{passive:true});
  sceneButton.addEventListener('click',nextScene);
  advance.addEventListener('click',nextScene);
  stage.addEventListener('click',e=>{
    if(performance.now()<ignoreTapUntil||e.target.closest('button,a,input,select,textarea,video,canvas,[role="slider"]'))return;
    nextScene();
  });
  document.querySelectorAll('a[href="#home"],a[href="#about"],a[href="#selected"],a[href="#archive"]').forEach(a=>a.addEventListener('click',e=>{e.preventDefault();scrollToPhase(a.getAttribute('href').slice(1));}));
  document.addEventListener('keydown',e=>{if(['ArrowDown','ArrowUp','PageDown','PageUp','Home','End',' '].includes(e.key)&&!e.target.closest('button,a,input,textarea,select,dialog,.editor,#carousel'))beginGesture('keyboard');});
  document.getElementById('field-select').addEventListener('change',e=>{
    const field=e.target.value;
    scrollToPhase(field.startsWith('selected')?'selected':field.startsWith('contact')||field==='footerName'?'archive':'about');
  });
  let resizeTimer;
  function refreshSize(){
    const index=MotionJourney.nearest(geometry.points,scrollY);
    const aligned=!navigating&&gestureStart===null&&Math.abs(geometry.points[index]-scrollY)<4;
    measure();if(aligned)scrollToPhase(MotionJourney.names[index],'auto');else requestUpdate();lens?.resize();
  }
  function queueResize(){clearTimeout(resizeTimer);resizeTimer=setTimeout(refreshSize,140);}
  addEventListener('resize',queueResize,{passive:true});
  addEventListener('orientationchange',queueResize,{passive:true});
  addEventListener('hashchange',()=>{const id=location.hash.slice(1);if(MotionJourney.names.includes(id))scrollToPhase(id);});
  addEventListener('pageshow',()=>{measure();requestUpdate();});
  document.addEventListener('visibilitychange',()=>{if(!document.hidden){measure();requestUpdate();}});
  measure();updateJourney();
  if(MotionJourney.names.includes(location.hash.slice(1)))requestAnimationFrame(()=>scrollToPhase(location.hash.slice(1),'auto'));

  // Keep every poster rigid: gently shrink whole cells, with a subtle RGB fringe.
  // The DOM wall remains the keyboard-accessible and WebGL-unavailable fallback.
  function initLens(workList){
    if(lens)return;
    const canvas=document.getElementById('archive-lens');
    const gl=canvas.getContext('webgl',{alpha:false,antialias:false,powerPreference:'low-power'});
    if(!gl)return;
    const vertex=`attribute vec2 a_position; varying vec2 v_uv; void main(){v_uv=a_position*.5+.5;gl_Position=vec4(a_position,0.,1.);}`;
    const fragment=`precision mediump float;
      varying vec2 v_uv; uniform sampler2D u_texture; uniform float u_aspect; uniform vec2 u_zoom; uniform vec2 u_shift; uniform float u_strength; uniform float u_fringe;
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
        vec2 fringe=normalize(p+vec2(.0001))*(.00008+.00022*min(r2,2.5))*u_fringe;
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
    const uniforms=Object.fromEntries(['u_aspect','u_zoom','u_shift','u_strength','u_fringe'].map(n=>[n,gl.getUniformLocation(program,n)]));
    gl.uniform1f(uniforms.u_fringe,MotionMedia.compact?0:1);
    const atlasScale=MotionMedia.compact?(MotionMedia.light?1.25:1.5):1;
    const atlas=document.createElement('canvas');atlas.width=2304*atlasScale;atlas.height=892*atlasScale;
    const ctx=atlas.getContext('2d');const cols=6,rows=4,cw=atlas.width/cols,ch=atlas.height/rows;
    const atlasWorks=[...workList,...[8,13,6,16,11].map(i=>workList[i]).filter(Boolean)];
    const images=atlasWorks.map(w=>{const im=new Image();im.src=MotionMedia.poster(w);return im;});
    let category='全部',renderFrame=0,ready=false,shiftX=0,shiftY=0,targetX=0,targetY=0,panX=0,ratio=1,zoom=[1,1],strength=.10,contextLost=false;
    // Texture-space drift is separate from the user's drag and pointer parallax.
    // Negative texture movement makes the visible wall travel gently to the right.
    const driftPixelsPerSecond=6;
    let driftX=0,lastTime=0,lastDraw=0;
    function roundedRect(x,y,w,h,r){ctx.beginPath();ctx.moveTo(x+r,y);ctx.arcTo(x+w,y,x+w,y+h,r);ctx.arcTo(x+w,y+h,x,y+h,r);ctx.arcTo(x,y+h,x,y,r);ctx.arcTo(x,y,x+w,y,r);ctx.closePath();}
    function uploadAtlas(){
      ctx.fillStyle='#140d1b';ctx.fillRect(0,0,atlas.width,atlas.height);
      atlasWorks.forEach((w,i)=>{
        const unit=atlasScale;
        const image=images[i],x=(i%cols)*cw+8*unit,y=Math.floor(i/cols)*ch+8*unit,width=cw-16*unit,height=ch-16*unit;
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
      const rect=archive.getBoundingClientRect(),dpr=Math.min(devicePixelRatio||1,MotionMedia.light?1.5:innerWidth<600?2:1.5);
      const width=Math.round(rect.width*dpr),height=Math.round(rect.height*dpr);
      if(canvas.width===width&&canvas.height===height)return;
      canvas.width=width;canvas.height=height;ratio=rect.width/rect.height;
      zoom=MotionLayout.archiveMetrics(rect.width,rect.height).zoom;strength=.05;
      gl.viewport(0,0,canvas.width,canvas.height);requestDraw();
    }
    function render(time){
      renderFrame=0;
      if(!ready||contextLost||!lens.visible||document.hidden||isScrolling||navigating){lastTime=0;return;}
      const elapsed=lastTime?Math.min((time-lastTime)/1000,.1):0;lastTime=time;
      const paused=down||document.getElementById('player-dialog').open||!document.getElementById('editor').hidden||archive.querySelector('.archive-wall:focus-within');
      if(!reduced&&!paused){
        const width=canvas.clientWidth||1,z=.96+.04*lens.entry;
        driftX=(driftX-driftPixelsPerSecond*elapsed/width*zoom[0]*z)%1;
      }
      // Keep fractional movement crisp on high-density phones. Low-power devices
      // retain a smaller drawing budget without dropping below native CSS resolution.
      const drawRate=MotionMedia.light?30:MotionMedia.compact?60:30;
      if(!reduced&&time-lastDraw<1000/drawRate-1){requestDraw();return;}
      const response=1-Math.exp(-8*Math.min((time-lastDraw)/1000,.1));lastDraw=time;
      shiftX+=(targetX-shiftX)*response;shiftY+=(targetY-shiftY)*response;
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
    canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();contextLost=true;canvas.classList.remove('is-ready');archive.classList.remove('lens-ready');});
    lens={request:requestDraw,resize,entry:0,visible:false};resize();
    Promise.all(images.map(image=>image.decode().catch(()=>{}))).then(()=>{uploadAtlas();requestUpdate();});
  }
  let archivePrepared=!MotionMedia.compact,introPrepared=!MotionMedia.compact,workData=[];
  function prepareIntro(){document.querySelectorAll('.intro-reel').forEach(b=>{const w=workData[+b.dataset.workIndex];if(!w)return;const image=b.querySelector('img');image.decoding='async';image.src=MotionMedia.poster(w);b.setAttribute('aria-label','预览作品 '+w.title);if(!b.dataset.bound){b.dataset.bound='true';b.addEventListener('click',()=>openPlayer(w));}});}
  MotionMedia.on('intro',()=>{introPrepared=true;prepareIntro();});
  MotionMedia.on('archive',()=>{archivePrepared=true;if(workData.length)initLens(workData);});
  document.addEventListener('motionworksready',e=>{workData=e.detail;if(archivePrepared)initLens(workData);if(introPrepared)prepareIntro();});
  if(typeof works!=='undefined'&&works.length){workData=works;if(archivePrepared)initLens(works);if(introPrepared)prepareIntro();}
})();
