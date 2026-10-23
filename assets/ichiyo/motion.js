(() => {
  const links = [...document.querySelectorAll('.section-nav a')];
  const sections = links.map(link => document.querySelector(link.hash)).filter(Boolean);
  let pending = false;
  function update() {
    pending = false;
    const current = sections.filter(el => el.getBoundingClientRect().top < innerHeight * .4).at(-1);
    links.forEach(link => {
      const active = current && link.hash === '#' + current.id;
      link.classList.toggle('is-active', !!active);
      if (active) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
  }
  function schedule() { if (!pending) { pending = true; requestAnimationFrame(update); } }
  addEventListener('scroll', schedule, { passive: true });
  addEventListener('resize', schedule, { passive: true });
  update();
})();
