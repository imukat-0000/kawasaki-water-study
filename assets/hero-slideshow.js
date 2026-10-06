(() => {
 const slides=[...document.querySelectorAll('.hero-slide')];
 const motion=document.querySelector('#motion');
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 let index=0,timer,visible=true;
 async function advance(){
  const next=(index+1)%slides.length;
  try{await slides[next].decode()}catch{return}
  if(!visible||document.hidden||motion.getAttribute('aria-pressed')==='true'||reduced.matches)return;
  slides[index].classList.remove('is-active');slides[index].setAttribute('aria-hidden','true');
  slides[next].classList.add('is-active');slides[next].setAttribute('aria-hidden','false');index=next;
 }
 function sync(){clearInterval(timer);if(visible&&!document.hidden&&!reduced.matches&&motion.getAttribute('aria-pressed')!=='true')timer=setInterval(advance,6000)}
 new MutationObserver(sync).observe(motion,{attributes:true,attributeFilter:['aria-pressed']});
 new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;sync();}).observe(document.querySelector('#entrance'));
 document.addEventListener('visibilitychange',sync);reduced.addEventListener('change',sync);sync();
})();
