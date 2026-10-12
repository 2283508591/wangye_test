'use strict';
(() => {
  const dialog=document.getElementById('contact-dialog');
  const copy=document.getElementById('copy-wechat');
  const status=document.getElementById('contact-status');
  let focusBefore;
  document.getElementById('contact-button').addEventListener('click',()=>{
    focusBefore=document.activeElement;
    pauseCards();
    status.textContent='扫码添加微信 · 微信与手机同号';
    const image=dialog.querySelector('img');
    if(!image.getAttribute('src'))image.src=image.dataset.src;
    dialog.showModal();
  });
  document.getElementById('close-contact').addEventListener('click',()=>dialog.close());
  dialog.addEventListener('click',e=>{
    if(e.target!==dialog)return;
    const r=dialog.getBoundingClientRect();
    if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();
  });
  dialog.addEventListener('close',()=>{focusBefore?.focus({preventScroll:true});playActive();});
  copy.addEventListener('click',async()=>{
    try{await navigator.clipboard.writeText('18334834262');status.textContent='微信号已复制';}
    catch{status.textContent='长按号码即可复制：18334834262';}
  });
})();
