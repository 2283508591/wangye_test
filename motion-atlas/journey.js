'use strict';
// Shared navigation math: every destination is a fully presented scene.
const MotionJourney=(()=>{
  const names=['home','about','selected','archive'];
  function stops(top,travel,archiveTop,maxScroll){
    return [top,top+travel*.30,top+travel,archiveTop].map(y=>Math.max(0,Math.min(maxScroll,y)));
  }
  function nearest(points,y){return points.reduce((best,p,i)=>Math.abs(p-y)<Math.abs(points[best]-y)?i:best,0);}
  function settle(points,start,end,options={}){
    const delta=end-start;
    const threshold=Math.min(80,Math.max(48,(options.view||800)*.07));
    const flick=options.input==='touch'&&options.velocity>.45&&Math.abs(delta)>=28;
    if(Math.abs(delta)<threshold&&!flick)return null;
    // A short screen may need ordinary scrolling inside the last page.
    if(start>=points[3]-2&&end>=points[3]-2)return null;
    const from=nearest(points,start);let to=nearest(points,end);
    if(to===from)to=Math.max(0,Math.min(3,from+Math.sign(delta)));
    return names[to];
  }
  function next(progress,archiveVisible){return archiveVisible?'home':progress<.16?'about':progress<.89?'selected':'archive';}
  // Exact critically damped response: retain momentum when input changes,
  // and use elapsed seconds so 60 Hz and 120 Hz displays behave alike.
  function damp(state,target,seconds,smoothTime=.18){
    const omega=2/smoothTime,dt=Math.max(0,seconds),decay=Math.exp(-omega*dt);
    const change=state.value-target,temp=(state.velocity+omega*change)*dt;
    return {value:target+(change+temp)*decay,velocity:(state.velocity-omega*temp)*decay};
  }
  function ease(t){t=Math.max(0,Math.min(1,t));return t*t*t*(t*(t*6-15)+10);}
  function wheelPixels(delta,mode,view){return delta*(mode===1?16:mode===2?view:1);}
  return {names,stops,nearest,settle,next,damp,ease,wheelPixels};
})();
if(typeof module==='object'&&module.exports)module.exports=MotionJourney;
