var paused=false;
(() => {
 const button=document.querySelector('#motion');
 window.backgroundSuspended=false;
 document.querySelectorAll('video').forEach(v=>{v.muted=true;v.playsInline=true;});
 button.addEventListener('click',()=>{paused=button.getAttribute('aria-pressed')!=='true';button.setAttribute('aria-pressed',String(paused));button.textContent=document.documentElement.lang==='en'?(paused?'Resume motion':'Pause motion'):(paused?'揺らぎを動かす':'揺らぎを止める');});
 document.querySelectorAll('.reading-nav a').forEach(a=>{if(a.pathname===location.pathname)a.setAttribute('aria-current','page')});
})();
