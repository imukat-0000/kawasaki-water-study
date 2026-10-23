(async () => {
  const preference = matchMedia('(prefers-reduced-motion: reduce)');
  const noiseUrl = new URL('../assets/ichiyo/fine-pixel-displacement.png', document.baseURI).href;
  const readyMap = new Image(); readyMap.src = noiseUrl;
  try { await Promise.all([readyMap.decode(), document.fonts.ready]); } catch { return; }
  const clamp = n => Math.max(0, Math.min(1, n));
  const ns = 'http://www.w3.org/2000/svg';
  const definitions = document.createElementNS(ns, 'svg');
  definitions.setAttribute('aria-hidden', 'true');
  definitions.style.cssText = 'position:absolute;width:0;height:0;pointer-events:none';
  const defs = document.createElementNS(ns, 'defs'); definitions.append(defs); document.body.append(definitions);
  const sections = [...document.querySelectorAll('main > .section')];
  const backgrounds = sections.map((section, index) => {
    const layer = document.createElement('div');
    layer.className = 'pixel-assembly'; layer.setAttribute('aria-hidden', 'true');
    let seed = index + 19;
    const random = () => { seed = seed * 16807 % 2147483647; return (seed - 1) / 2147483646; };
    const tiles = [];
    for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
      const tile = document.createElement('i');
      tile.style.cssText = `left:${x / 16 * 100}%;top:${y / 16 * 100}%;width:calc(${100 / 16}% + 1px);height:calc(${100 / 16}% + 1px);--dx:${(random() - .5) * 260}px;--dy:${(random() - .5) * 220}px;`;
      tiles.push(tile);layer.append(tile);
    }
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
    const isText = !el.matches('.story-photo,.access-map');
    if (isText) return {el,value:0,isText:true};
    const id = 'content-pixel-scatter-' + index;
    const filter = document.createElementNS(ns, 'filter');
    filter.id = id;
    filter.setAttribute('x','-12%');filter.setAttribute('y','-12%');filter.setAttribute('width','124%');filter.setAttribute('height','124%');
    filter.setAttribute('color-interpolation-filters','sRGB');
    const image = document.createElementNS(ns,'feImage');
    image.setAttribute('href',noiseUrl);image.setAttribute('x','0');image.setAttribute('y','0');image.setAttribute('width','100%');image.setAttribute('height','100%');image.setAttribute('preserveAspectRatio','none');image.setAttribute('result','pixelMap');
    const displacement = document.createElementNS(ns,'feDisplacementMap');
    displacement.setAttribute('in','SourceGraphic');displacement.setAttribute('in2','pixelMap');displacement.setAttribute('xChannelSelector','R');displacement.setAttribute('yChannelSelector','G');displacement.setAttribute('scale','140');
    filter.append(image,displacement);defs.append(filter);
    return {el,value:0,filterId:id,displacement,isVisit:!!el.closest('#visit,#access')};
  });
  const items = [...backgrounds,...content];
  let running=false, previousTime=0, frame=0, enabled=!preference.matches;
  function target(r, isContent) {
    const h=innerHeight;
    if (isContent) return Math.min(clamp((h-r.top)/24),clamp(r.bottom/18));
    return Math.min(clamp((h-r.top)/12),clamp(r.bottom/8));
  }
  function update(time) {
    if (document.hidden || !enabled) { running=false; return; }
    const elapsed=previousTime ? Math.min(100,time-previousTime) : 16;
    previousTime=time;
    const speed=1-Math.exp(-elapsed/45);
    let moving=false;
    const positions=items.map(item => item.el.getBoundingClientRect());
    items.forEach((item,index) => {
      const desired=item.el.contains(document.activeElement) ? 1 : target(positions[index], !item.layer);
      const settling = item.layer ? 1-Math.exp(-elapsed/24) : item.isText ? 1-Math.exp(-elapsed/100) : item.isVisit && desired > item.value ? 1-Math.exp(-elapsed/90) : speed;
      item.value += (desired-item.value)*settling;
      if (Math.abs(desired-item.value)<.002) item.value=desired;else moving=true;
      const p=item.value;
      if (item.lastPaint !== undefined && Math.abs(item.lastPaint-p)<.001) return;
      item.lastPaint=p;
      if(item.layer) {
        item.layer.style.setProperty('--assembly',p.toFixed(3));
        item.layer.style.setProperty('--drift-play',p>.995?'running':'paused');
        item.el.style.setProperty('--drift-play',p>.995?'running':'paused');
        item.el.style.setProperty('--edge-visibility',p.toFixed(3));
      } else {
        if (item.isText) {
          item.el.style.filter=(p>.995 || p<.002)?'none':`blur(${((1-p)*10).toFixed(2)}px)`;
          item.el.style.opacity=p.toFixed(3);
        } else {
          item.displacement.setAttribute('scale', ((1-p)*90).toFixed(2));
          item.el.style.filter=(p>.995 || p<.02)?'none':`url(#${item.filterId})`;
          item.el.style.opacity=p<.02?'0':'1';
        }
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
      item.value=target(item.el.getBoundingClientRect(),false);
      item.lastPaint=undefined;
      item.layer.style.setProperty('--assembly',item.value);
      item.el.style.setProperty('--edge-visibility',item.value);
    });
    content.forEach(item=>{
      item.el.style.filter='none';item.el.style.opacity='1';item.el.style.pointerEvents='';
      item.lastPaint=undefined;
      item.value=target(item.el.getBoundingClientRect(),true);
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
