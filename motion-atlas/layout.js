'use strict';
// One geometry model for the GPU wall and pointer hit-testing.
const MotionLayout=(()=>{
  const cols=6,rows=4,cw=384,ch=223,gutter=8,angle=.003;
  function archiveMetrics(width,height){
    const ratio=width/height;
    const tileWidth=width<600?180:Math.min(440,Math.max(240,width/6));
    const zoomX=width/(cols*tileWidth);
    return {ratio,zoom:[zoomX,zoomX*(cols*cw)/(rows*ch)/ratio]};
  }
  function archiveHit(nx,ny,{ratio,zoom},shift,z=1,strength=.05){
    const px=(nx*2-1)*ratio,py=1-ny*2,c=Math.cos(angle),s=Math.sin(angle);
    const u=(c*px+s*py)/(ratio*2)*zoom[0]*z+.5+shift[0];
    const v=(-s*px+c*py)/2*zoom[1]*z+.5+shift[1];
    const cellX=Math.floor(u*cols),cellY=Math.floor(v*rows);
    const sx=((cellX+.5)/cols-.5-shift[0])/(zoom[0]*z)*ratio;
    const sy=((cellY+.5)/rows-.5-shift[1])/(zoom[1]*z);
    const edge=Math.min(1,Math.hypot(sx,sy)/Math.max(ratio,1));
    const scale=1-strength*(1-edge);
    const lx=(u*cols-cellX-.5)/scale+.5,ly=(v*rows-cellY-.5)/scale+.5;
    if(lx<gutter/cw||lx>1-gutter/cw||ly<gutter/ch||ly>1-gutter/ch)return null;
    const column=((cellX%cols)+cols)%cols,glRow=((cellY%rows)+rows)%rows;
    return (rows-1-glRow)*cols+column;
  }
  return {archiveMetrics,archiveHit,cols,rows,cw,ch,gutter};
})();
if(typeof module==='object'&&module.exports)module.exports=MotionLayout;
