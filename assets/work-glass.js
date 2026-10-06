(() => {
 const cards=[...document.querySelectorAll('#works .work-card')];
 const touchMode=matchMedia('(hover: none), (pointer: coarse)');
 function clear(){cards.forEach(card=>card.classList.remove('is-revealed'));}
 cards.forEach(card=>{
  const caption=card.querySelector('.work-caption');
  if(card.dataset.material){const material=document.createElement('p');material.className='work-material';material.textContent=card.dataset.material;caption.append(material);}
  const hint=document.createElement('p');hint.className='touch-detail-hint';hint.textContent='もう一度タップで作品詳細';caption.append(hint);
  card.addEventListener('click',event=>{
   if(!touchMode.matches)return;
   if(!card.classList.contains('is-revealed')){event.preventDefault();clear();card.classList.add('is-revealed');}
  });
  card.addEventListener('keydown',event=>{if(event.key==='Escape'){clear();card.blur();}});
 });
 document.addEventListener('pointerdown',event=>{if(!event.target.closest('#works .work-card'))clear();});
})();
