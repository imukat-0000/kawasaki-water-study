(() => {
 const track=document.querySelector('.sheet');
 // Keep vertical gestures inside a dedicated scroller. Scrolling the document
 // makes mobile browser chrome resize the fixed artwork during every swipe.
 const scroller=document.createElement('div');
 scroller.className='horizontal-scroll-port';
 const stage=document.createElement('div');stage.className='horizontal-stage';
 const spacer=document.createElement('div');spacer.setAttribute('aria-hidden','true');
 track.before(scroller);stage.append(track);scroller.append(stage,spacer);
 document.documentElement.classList.add('horizontal-scroll-ready');
 const panels=[...track.querySelectorAll(':scope > .paper-panel')];
 const buttons=[...document.querySelectorAll('.section-rail button[data-panel]')];
 let maxTravel=0,scheduled=false,currentPanel=null;
 const destinations=new Map();
 function destination(panel){return destinations.get(panel)||0;}
 function paint(){
  const position=Math.min(maxTravel,Math.max(0,scroller.scrollTop));
  track.style.transform=`translate3d(${-maxTravel+position}px,0,0)`;
  const nearest=panels.reduce((a,b)=>Math.abs(destination(a)-position)<=Math.abs(destination(b)-position)?a:b);
  if(nearest!==currentPanel){buttons.forEach(b=>{if(b.dataset.panel===nearest.id)b.setAttribute('aria-current','true');else b.removeAttribute('aria-current')});currentPanel=nearest;}
  window.setBackgroundCovered?.(position<=1);
  scheduled=false;
 }
 function measure(){const oldMax=maxTravel;const oldPosition=scroller.scrollTop;const viewportHeight=window.visualViewport&&window.visualViewport.scale===1?window.visualViewport.height:innerHeight;document.documentElement.style.setProperty("--view-height",viewportHeight+"px");maxTravel=Math.max(0,track.getBoundingClientRect().width-innerWidth);spacer.style.height=`${maxTravel}px`;const inset=parseFloat(getComputedStyle(track).paddingLeft);panels.forEach(panel=>destinations.set(panel,panel.id==='entrance'?0:Math.min(maxTravel,Math.max(0,maxTravel-panel.offsetLeft+inset))));if(oldMax>0&&Math.abs(maxTravel-oldMax)>1)scroller.scrollTo({top:oldPosition/oldMax*maxTravel,behavior:"auto"});paint();}
 buttons.forEach(button=>button.addEventListener('click',()=>{const panel=document.getElementById(button.dataset.panel);scroller.scrollTo({top:destination(panel),behavior:'auto'});paint();}));
 scroller.addEventListener('scroll',()=>{if(!scheduled){scheduled=true;requestAnimationFrame(paint)}},{passive:true});
 let resizeFrame;function scheduleMeasure(){cancelAnimationFrame(resizeFrame);resizeFrame=requestAnimationFrame(measure)}
 window.addEventListener('resize',scheduleMeasure);window.visualViewport?.addEventListener('resize',scheduleMeasure);
 document.fonts.ready.then(measure);measure();
 const initialPanel=document.getElementById(location.hash.slice(1));
 if(panels.includes(initialPanel)){scroller.scrollTo({top:destination(initialPanel),behavior:'auto'});paint();}
 window.addEventListener('hashchange',()=>{const panel=document.getElementById(location.hash.slice(1));if(panels.includes(panel)){scroller.scrollTo({top:destination(panel),behavior:'auto'});paint();}});
 track.addEventListener('focusin',e=>{const panel=e.target.closest('.paper-panel');if(panel)scroller.scrollTo({top:destination(panel),behavior:'auto'})});
 // Mouse/trackpad scrolling over the biography must still advance the screens.
 const biography=document.querySelector('#profile .artist-introduction');
 biography?.addEventListener('wheel',event=>{
  if(event.ctrlKey || event.metaKey || !event.deltaY)return;
  event.preventDefault();
  const unit=event.deltaMode===1?16:event.deltaMode===2?innerHeight:1;
  scroller.scrollBy({top:event.deltaY*unit,behavior:'auto'});
 },{passive:false});
 document.querySelector('.water').style.touchAction='pan-y';
})();
