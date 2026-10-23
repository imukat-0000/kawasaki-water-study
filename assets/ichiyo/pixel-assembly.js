(async () => {
  const preference = matchMedia('(prefers-reduced-motion: reduce)');
  try { await document.fonts.ready; } catch { return; }
  const clamp = n => Math.max(0, Math.min(1, n));
  const sections = [...document.querySelectorAll('main > .section')];
  const backgrounds = sections.map((section, index) => {
    const layer = document.createElement('div');
    layer.className = 'pixel-assembly'; layer.setAttribute('aria-hidden', 'true');
    let seed = index + 19;
    const random = () => { seed = seed * 16807 % 2147483647; return (seed - 1) / 2147483646; };
    const fringe=document.createElement('div');
    fringe.className='pixel-twinkle';fringe.setAttribute('aria-hidden','true');
    for(let i=0;i<180;i++) {
      const dot=document.createElement('i');
      const side=i%4, along=random()*100, reach=8+random()*22;
      const size=2+Math.floor(random()*4);
      let placement;
      if(side===0) placement=`left:${along}%;top:${-reach}px;`;
      else if(side===1) placement=`left:${along}%;bottom:${-reach}px;`;
      else if(side===2) placement=`top:${along}%;left:${-reach}px;`;
      else placement=`top:${along}%;right:${-reach}px;`;
      dot.style.cssText=placement+`width:${size}px;height:${size}px;--blink-time:${(1.2+random()*4).toFixed(2)}s;--blink-delay:${(-random()*8).toFixed(2)}s;`;
      fringe.append(dot);
    }
    section.prepend(fringe);
    section.prepend(layer);section.classList.add('has-pixel-assembly');
    return { el:section, layer, fringe, value:0 };
  });
  const selector = '.section-heading,.story-heading,.prose>p,.prose>details,.story-photo,.story-copy>h3,.story-copy>p,.story-copy>dl,.story-copy>a,.process-copy,.visit-title,.visit>div:not(.section-heading):not(.pixel-assembly)>dl>div,.visit-links>a,.access-map,.access-copy>p,.access-copy>h3,.station-list>div,.work-note';
  const content = [...document.querySelectorAll(selector)].filter(el => el.closest('main>.section')).map((el, index) => {
    el.classList.add('pixel-content');
    return {el,section:el.closest('main>.section'),value:0};
  });
  const items = [...backgrounds,...content];
  let running=false, previousTime=0, frame=0, enabled=!preference.matches;
  function target(r) {
    const h=innerHeight;
    return Math.min(clamp((h-r.top)/24),clamp(r.bottom/18));
  }
  function update(time) {
    if (document.hidden || !enabled) { running=false; return; }
    const elapsed=previousTime ? Math.min(100,time-previousTime) : 16;
    previousTime=time;
    let moving=false;
    const positions=items.map(item => (item.section || item.el).getBoundingClientRect());
    items.forEach((item,index) => {
      const desired=(item.section || item.el).contains(document.activeElement) ? 1 : target(positions[index]);
      const settling = 1-Math.exp(-elapsed/100);
      item.value += (desired-item.value)*settling;
      if (Math.abs(desired-item.value)<.002) item.value=desired;else moving=true;
      const p=item.value;
      if (item.lastPaint !== undefined && Math.abs(item.lastPaint-p)<.001) return;
      item.lastPaint=p;
      if(item.layer) {
        const blur=(p>.995 || p<.002)?'none':`blur(${((1-p)*10).toFixed(2)}px)`;
        item.layer.style.filter=blur;
        item.fringe.style.filter=blur;
        item.layer.style.setProperty('--assembly',p.toFixed(3));
        item.layer.style.setProperty('--drift-play',p>.995?'running':'paused');
        item.el.style.setProperty('--drift-play',p>.995?'running':'paused');
        item.el.style.setProperty('--edge-visibility',p.toFixed(3));
      } else {
        item.el.style.filter=(p>.995 || p<.002)?'none':`blur(${((1-p)*10).toFixed(2)}px)`;
        item.el.style.opacity=p.toFixed(3);
        item.el.style.setProperty('--content-assembly',p.toFixed(3));
        item.el.style.pointerEvents=p<.15?'none':'';
      }
    });
    if(moving) frame=requestAnimationFrame(update); else running=false;
  }
  function schedule(){if(enabled && !running && !document.hidden){running=true;previousTime=0;frame=requestAnimationFrame(update);}}
  function applyPreference() {
    enabled=!preference.matches;
    cancelAnimationFrame(frame);running=false;
    backgrounds.forEach(item=>{
      item.el.classList.toggle('has-pixel-assembly',enabled);
      item.layer.hidden=!enabled;item.fringe.hidden=!enabled;
      item.value=target(item.el.getBoundingClientRect());
      item.lastPaint=undefined;
      item.layer.style.setProperty('--assembly',item.value);
      item.el.style.setProperty('--edge-visibility',item.value);
    });
    content.forEach(item=>{
      item.el.style.filter='none';item.el.style.opacity='1';item.el.style.pointerEvents='';
      item.lastPaint=undefined;
      item.value=target(item.section.getBoundingClientRect());
    });
    if(enabled) schedule();
  }
  preference.addEventListener('change',applyPreference);
  document.addEventListener('visibilitychange',()=>{if(document.hidden){cancelAnimationFrame(frame);running=false;}else schedule();});
  document.addEventListener('focusin',schedule);
  addEventListener('scroll',schedule,{passive:true});
  addEventListener('resize',schedule,{passive:true});
  addEventListener('hashchange',schedule);
  addEventListener('pageshow',schedule);
  document.querySelectorAll('.story-photo img').forEach(image=>image.addEventListener('load',schedule));
  if ('ResizeObserver' in window) {
    const resizeObserver=new ResizeObserver(schedule);
    sections.forEach(section=>resizeObserver.observe(section));
  }
  applyPreference();
})();
