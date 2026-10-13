'use strict';
// Pick a single complete static composition. Never fetch the other candidates.
const MotionHeroStills=(()=>{
  const products=[
    {id:'phone',title:'粉色金属环手机壳'},
    {id:'earbuds',title:'蓝色无线耳机'},
    {id:'fan',title:'手持风扇'},
    {id:'f10',title:'F10 灯组'}
  ];
  function choose(random=Math.random){return products[Math.min(products.length-1,Math.max(0,Math.floor(random()*products.length)))];}
  return {products,choose};
})();
if(typeof module==='object'&&module.exports)module.exports=MotionHeroStills;
if(typeof document!=='undefined')(()=>{
  const layer=document.querySelector('.hero-still');if(!layer)return;
  const params=new URLSearchParams(location.search);
  const requested=params.has('qa')&&MotionHeroStills.products.find(p=>p.id===params.get('hero'));
  const product=requested||MotionHeroStills.choose();
  layer.dataset.product=product.id;
  const picture=document.createElement('picture'),portrait=document.createElement('source'),image=document.createElement('img');
  portrait.media='(max-width:1100px) and (orientation:portrait)';
  portrait.srcset=`assets/hero-stills/${product.id}-mobile.webp`;
  image.alt='';image.decoding='async';image.fetchPriority='high';
  image.addEventListener('load',()=>layer.classList.add('is-ready'),{once:true});
  image.addEventListener('error',()=>layer.remove(),{once:true});
  picture.append(portrait,image);layer.append(picture);
  image.src=`assets/hero-stills/${product.id}-desktop.webp`;
})();
