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
  return {names,stops,nearest,settle,next};
})();
if(typeof module==='object'&&module.exports)module.exports=MotionJourney;
