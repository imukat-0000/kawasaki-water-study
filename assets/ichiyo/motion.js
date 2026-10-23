(() => {
  const links=[...document.querySelectorAll('.section-nav a')];
  const sections=links.map(link=>document.querySelector(link.hash)).filter(Boolean);
  let pending=false, interacted=false;
  function update(){
    pending=false;
    const current=sections.filter(el=>el.getBoundingClientRect().top<innerHeight*.4).at(-1);
    links.forEach(link=>{
      const active=!!current&&link.hash==='#'+current.id;
      link.classList.toggle('is-active',active);
      if(active)link.setAttribute('aria-current','location');else link.removeAttribute('aria-current');
    });
  }
  function schedule(){if(!pending){pending=true;requestAnimationFrame(update);}}
  [...links,document.querySelector('.to-top'),document.querySelector('.skip')].filter(Boolean).forEach(link=>{
    link.addEventListener('click',event=>{
      if(event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
      const target=document.getElementById(link.hash.slice(1));if(!target)return;
      event.preventDefault();interacted=true;
      if(location.hash!==link.hash)history.pushState(null,'',link.hash);
      target.scrollIntoView({behavior:'instant',block:'start'});
      dispatchEvent(new Event('scroll'));
      if(link.classList.contains('skip')){target.tabIndex=-1;target.focus({preventScroll:true});}
      schedule();
    });
  });
  ['wheel','touchstart','keydown'].forEach(name=>addEventListener(name,()=>{interacted=true;},{passive:true,once:true}));
  const loaded=document.readyState==='complete'?Promise.resolve():new Promise(resolve=>addEventListener('load',resolve,{once:true}));
  Promise.all([loaded,document.fonts.ready]).then(()=>{
    const navigation=performance.getEntriesByType('navigation')[0];
    if(!interacted&&location.hash&&navigation?.type!=='back_forward'){
      document.getElementById(location.hash.slice(1))?.scrollIntoView({behavior:'instant',block:'start'});
      dispatchEvent(new Event('scroll'));
    }
    update();
  });
  const titleImage=document.querySelector('.title-art');
  if(titleImage){
    const ready=()=>{if(titleImage.naturalWidth)titleImage.closest('h1').classList.add('title-art-ready');};
    titleImage.addEventListener('load',ready);
    titleImage.addEventListener('error',()=>titleImage.closest('h1').classList.remove('title-art-ready'));
    if(titleImage.complete)ready();
  }
  addEventListener('scroll',schedule,{passive:true});
  addEventListener('resize',schedule,{passive:true});
  addEventListener('hashchange',schedule);
  addEventListener('pageshow',schedule);
  schedule();
})();
