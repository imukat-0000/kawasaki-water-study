(() => {
 const water=document.querySelector('.water');
 const layer=document.createElement('div');layer.className='floating-leaves';layer.setAttribute('aria-hidden','true');
 const SOURCE='assets/floating-momiji.png';
 // Rendering is chosen per engine from measurements:
 // - WebKit (Safari, and every browser on iPhone/iPad): one composited layer per leaf (300–450)
 //   dropped scrolling to ~18fps. All leaves are painted into one canvas instead, which holds
 //   ~28fps under the 30fps Low Power cap (Safari 26). Each leaf keeps its own pre-rendered
 //   sprite with the same filter as the CSS version.
 // - Chromium and Gecko keep one element per leaf; in Chromium that measured faster than canvas.
 const ua=navigator.userAgent;
 const isChromium=/(?:Chrome|Chromium)\/\d/.test(ua)||!!navigator.userAgentData?.brands?.some(x=>/Chromium/.test(x.brand));
 const isGecko=/\bGecko\/\d/.test(ua)&&!/like Gecko/.test(ua);
 const canvas=document.createElement('canvas');
 canvas.style.cssText='position:absolute;inset:0;width:100%;height:100%;display:block';
 const ctx=isChromium||isGecko?null:canvas.getContext('2d');
 let useCanvas=!!ctx;
 // Element rendering in Chromium: the per-image CSS "leaf-rock" animation runs on the main
 // thread there, so the identical motion is folded into the transform written each frame.
 const foldRock=isChromium;
 const PAD=6; // CSS px around each sprite for drop-shadow(1px 2px 2px)
 let dpr=devicePixelRatio||1, source=null;
 // Top-down render of the user's Momiji_Reference_Surface_v9.blend.
 const bodies=[];
 function populate(){
  layer.replaceChildren();bodies.length=0;
  dpr=devicePixelRatio||1;
  let seed=8317;
  const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
  const width=innerWidth,height=innerHeight;
  const scale=Math.max(88,Math.min(165,width*.105)),step=scale*.43;
  // Irregular pools of exposed water interrupt a dense, overlapping leaf bed.
  const pools=[[.065,.35,.072,.13],[.94,.68,.073,.14],[.46,.50,.13,.13],[.72,.12,.08,.09]];
  for(let row=-1;row<=Math.ceil(height/step);row++){
   for(let col=-1;col<=Math.ceil(width/step);col++){
    const px=(col+(row%2)*.45+(random()-.5)*.75)*step;
    const py=(row+(random()-.5)*.75)*step;
    const nearest=Math.min(...pools.map(([cx,cy,rx,ry])=>Math.hypot((px/width-cx)/rx,(py/height-cy)/ry)));
    if(nearest<.9||(nearest<1.4&&random()<.65)||random()<.045)continue;
    const x=px/width*100,y=py/height*100,size=scale*(.86+random()*.48);
    const angle=random()*360,duration=43+random()*35,delay=-random()*70;
    const tint=-7+random()*16,light=.91+random()*.22;
    const body={x,y,size,angle,duration,delay,tint,light,dx:0,dy:0,vx:0,vy:0,spin:0,omega:0};
    if(!useCanvas){
     const leaf=document.createElement('div');leaf.className='floating-leaf';
     leaf.style.cssText=`left:0;top:0;--leaf-size:${size}px;--angle:${angle}deg;--duration:${duration}s;--delay:${delay}s;--tint:${tint}deg;--light:${light}`;
     const image=document.createElement('img');image.src=SOURCE;image.alt='';image.draggable=false;if(foldRock)image.style.animation='none';
     leaf.append(image);layer.append(leaf);body.leaf=leaf;
    }
    bodies.push(body);
   }
  }
  if(useCanvas){
   layer.append(canvas);
   canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);
   if(source)buildSprites();
  }
 }
 // Same pixels as `filter:hue-rotate(tint) brightness(light) drop-shadow(1px 2px 2px #29495640)`
 // on the image: colour matrices from Filter Effects 1 in sRGB on unpremultiplied values, then a
 // Gaussian shadow (sigma = 1 CSS px). Rendered once per leaf at the screen's pixel density.
 function sprite(body){
  const side=Math.ceil((body.size+PAD*2)*dpr),inner=body.size*dpr,offset=PAD*dpr;
  const work=document.createElement('canvas');work.width=work.height=side;
  const w=work.getContext('2d',{willReadFrequently:true});
  w.imageSmoothingEnabled=true;w.imageSmoothingQuality='high';
  w.drawImage(source,offset,offset,inner,inner);
  const frame=w.getImageData(0,0,side,side),p=frame.data;
  const a=body.tint*Math.PI/180,c=Math.cos(a),s=Math.sin(a),l=body.light;
  const m0=.213+c*.787-s*.213,m1=.715-c*.715-s*.715,m2=.072-c*.072+s*.928;
  const m3=.213-c*.213+s*.143,m4=.715+c*.285+s*.140,m5=.072-c*.072-s*.283;
  const m6=.213-c*.213-s*.787,m7=.715-c*.715+s*.715,m8=.072+c*.928+s*.072;
  const clamp=v=>v<0?0:v>255?255:v;
  for(let i=0;i<p.length;i+=4){
   if(!p[i+3])continue;
   const r=p[i],g=p[i+1],b=p[i+2];
   p[i]=clamp(m0*r+m1*g+m2*b)*l;p[i+1]=clamp(m3*r+m4*g+m5*b)*l;p[i+2]=clamp(m6*r+m7*g+m8*b)*l;
  }
  w.putImageData(frame,0,0);
  const out=document.createElement('canvas');out.width=out.height=side;
  const o=out.getContext('2d');
  o.shadowColor='#29495640';o.shadowOffsetX=dpr;o.shadowOffsetY=2*dpr;o.shadowBlur=2*dpr;
  o.drawImage(work,0,0);
  body.sprite=out;body.spriteSize=side/dpr;
 }
 let generation=0;
 function buildSprites(){
  const current=++generation;
  try{for(const b of bodies)sprite(b);}
  catch(error){fallbackToElements();return;}
  window.FloatingLeaves.update(last.time,0,[],last.width,last.height);
  // Hand the finished sprites to the browser as immutable bitmaps: drawing hundreds of
  // <canvas> sources per frame forces Chromium to snapshot each one every time.
  if(typeof createImageBitmap==='function'){
   const list=bodies.slice();
   Promise.all(list.map(b=>createImageBitmap(b.sprite))).then(bitmaps=>{
    if(current!==generation){bitmaps.forEach(m=>m.close?.());return;}
    list.forEach((b,i)=>{b.sprite=bitmaps[i];});
   }).catch(()=>{});
  }
 }
 function fallbackToElements(){useCanvas=false;canvas.remove();populate();window.FloatingLeaves.update(last.time,0,[],innerWidth,innerHeight);}
 if(useCanvas){
  const image=new Image();image.decoding='async';
  image.onload=()=>{source=image;buildSprites();};
  image.onerror=fallbackToElements;
  image.src=SOURCE;
 }
 populate();
 let resizeFrame;
 window.addEventListener('resize',()=>{cancelAnimationFrame(resizeFrame);resizeFrame=requestAnimationFrame(populate);});
 // Moving the window to a screen with a different pixel density re-renders the sprites.
 (function watchDensity(){const q=matchMedia(`(resolution: ${devicePixelRatio||1}dppx)`);q.addEventListener?.('change',()=>{populate();watchDensity();},{once:true});})();
 water.append(layer);
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 // cubic-bezier(.42,0,.58,1) — the CSS "ease-in-out" curve.
 function easeInOut(x){
  let t=x;
  for(let i=0;i<8;i++){const d=3*(1-t)*(1-t)*.42+6*(1-t)*t*(.58-.42)+3*t*t*(1-.58);const e=3*(1-t)*(1-t)*t*.42+3*(1-t)*t*t*.58+t*t*t-x;if(Math.abs(e)<1e-7)break;if(Math.abs(d)<1e-6)break;t-=e/d;}
  t=Math.min(1,Math.max(0,t));
  return 3*(1-t)*t*t+t*t*t;
 }
 // @keyframes leaf-rock: 0%,100% rotate(-3deg) scaleY(.99) / 50% rotate(3deg) scaleY(.95), pivot 50% 55%.
 function rock(local){
  const p=((local%11)+11)%11/11;
  if(p<.5){const e=easeInOut(p/.5);return [-3+6*e,.99-.04*e];}
  const e=easeInOut((p-.5)/.5);return [3-6*e,.95+.04*e];
 }
 const last={time:0,width:innerWidth,height:innerHeight};
 const DEG=Math.PI/180;
 window.FloatingLeaves={update(time,dt,waves,width,height){
  last.time=time;last.width=width;last.height=height;
  if(reduced.matches)dt=0;
  const driftTime=reduced.matches?0:time;
  const painting=useCanvas&&source;
  if(painting){ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,canvas.width,canvas.height);}
  for(const b of bodies){
   const phase=(driftTime-b.delay)*Math.PI*2/b.duration;
   const baseX=b.x/100*width+Math.sin(phase)*18;
   const baseY=b.y/100*height+Math.cos(phase*.87)*12;
   let fx=0,fy=0,torque=0;
   for(const w of waves){
    const age=time-w.born;
    if(age<0||age>4.5)continue;
    const rx=baseX+b.dx-w.x,ry=baseY+b.dy-w.y,d=Math.hypot(rx,ry);
    const band=d-age*115;
    if(band>160||band<-160)continue;
    // Same expanding wavefront and decay as the water shader.
    const envelope=Math.exp(-band*band/1700)*Math.exp(-age*.72)*w.strength;
    const push=envelope*(24+11*Math.cos(band*.15));
    fx+=rx/Math.max(d,1)*push;fy+=ry/Math.max(d,1)*push;
    torque+=Math.sin(Math.atan2(ry,rx)-(b.angle+b.spin)*Math.PI/180)*envelope*10;
   }
   if(dt>0){
    b.vx+=(Math.max(-32,Math.min(32,fx))-b.dx*.65)*dt;
    b.vy+=(Math.max(-32,Math.min(32,fy))-b.dy*.65)*dt;
    b.vx*=Math.exp(-2.8*dt);b.vy*=Math.exp(-2.8*dt);
    b.dx+=b.vx*dt;b.dy+=b.vy*dt;
    b.omega+=(Math.max(-12,Math.min(12,torque))-b.spin*.8)*dt;
    b.omega*=Math.exp(-3.2*dt);b.spin+=b.omega*dt;
   }
   const x=baseX+b.dx;
   const y=baseY+b.dy;
   const turn=b.angle+Math.sin(phase)*8+b.spin;
   if(painting){
    if(!b.sprite)continue;
    // translate(x,y) translate(-50%,-50%) rotate(turn) on the leaf, then the image's
    // rotate(r) scaleY(s) about its transform-origin 50% 55% (0.05 × size below the centre).
    const [rockAngle,rockScale]=rock(driftTime-b.delay);
    const t=turn*DEG,c=Math.cos(t),s=Math.sin(t),k=b.size*.05;
    ctx.setTransform(c*dpr,s*dpr,-s*dpr,c*dpr,x*dpr,y*dpr);
    ctx.translate(0,k);ctx.rotate(rockAngle*DEG);ctx.scale(1,rockScale);ctx.translate(0,-k);
    const half=b.size/2+PAD;
    ctx.drawImage(b.sprite,-half,-half,b.spriteSize,b.spriteSize);
   }else if(b.leaf){
    const base=`translate(${x}px,${y}px) translate(-50%,-50%) rotate(${turn}deg)`;
    if(foldRock){
     // translate(0,5%) … translate(0,-5%) moves the pivot to the image's former transform-origin (50% 55%).
     const [rockAngle,rockScale]=rock(driftTime-b.delay);
     b.leaf.style.transform=`${base} translate(0,5%) rotate(${rockAngle}deg) scaleY(${rockScale}) translate(0,-5%)`;
    }else b.leaf.style.transform=base;
   }
  }
 }};
 window.FloatingLeaves.update(0,0,[],innerWidth,innerHeight);
 const button=document.querySelector('#motion');
 function sync(){layer.classList.toggle('is-paused',button.getAttribute('aria-pressed')==='true'||window.backgroundSuspended);}
 window.addEventListener('backgroundactivity',sync);
 new MutationObserver(sync).observe(button,{attributes:true,attributeFilter:['aria-pressed']});sync();
})();
