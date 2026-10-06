(() => {
 const videos=[...document.querySelectorAll('.water-video,.fish-video')];
 const control=document.querySelector('#motion');
 // Only the top page opens on a full-screen photo that hides the background; layout-horizontal.js
 // then reports the real state. Reading pages have no such cover and nothing else updates this,
 // so starting them as "covered" left their water, fish and leaves stopped for good.
 let covered=!!document.querySelector('.hero-slideshow');
 const pending=new WeakSet();
 function stopped(){return covered||document.hidden||control.getAttribute("aria-pressed")==="true";}
 function resume(video){
  if(stopped()||!video.paused||pending.has(video))return;
  video.muted=true;video.playsInline=true;pending.add(video);
  video.play().then(()=>{if(stopped())video.pause();}).catch(()=>{
   // Retry on media readiness or the next user gesture, without a busy loop.
  }).finally(()=>pending.delete(video));
 }
 function sync(){
  const suspended=covered||document.hidden;
  const changed=window.backgroundSuspended!==suspended;
  window.backgroundSuspended=suspended;
  document.documentElement.classList.toggle('background-suspended',suspended);
  const stop=suspended||control.getAttribute('aria-pressed')==='true';
  for(const video of videos){
   if(stop)video.pause();
   else resume(video);
  }
  if(changed)window.dispatchEvent(new Event('backgroundactivity'));
 }
 window.setBackgroundCovered=value=>{if(covered!==value){covered=value;sync();}};
 document.addEventListener('visibilitychange',sync);
 window.addEventListener('pageshow',sync);
 for(const video of videos)video.addEventListener('canplay',()=>resume(video));
 for(const type of ['pointerup','touchend','keydown'])document.addEventListener(type,()=>{videos.forEach(resume);},{passive:true});
 new MutationObserver(sync).observe(control,{attributes:true,attributeFilter:['aria-pressed']});
 sync();
})();
