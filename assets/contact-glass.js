(() => {
  const panel = document.querySelector('#contact');
  const content = panel?.querySelector('.contact-content');
  const inquiry = panel?.querySelector('.contact-inquiry');
  if (!inquiry) return;
  let frame = 0;
  function update() {
    frame = 0;
    const top = inquiry.getBoundingClientRect().top - panel.getBoundingClientRect().top + panel.scrollTop;
    panel.style.setProperty('--contact-frost-start', `${Math.max(0, top - 150)}px`);
    panel.style.setProperty('--contact-frost-end', `${Math.max(32, top - 12)}px`);
  }
  function schedule() {
    if (!frame) frame = requestAnimationFrame(update);
  }
  const resize = new ResizeObserver(schedule);
  [panel, content, inquiry].forEach(el => resize.observe(el));
  new MutationObserver(schedule).observe(content, {childList:true, subtree:true, characterData:true});
  document.fonts.ready.then(schedule);
  schedule();
})();
