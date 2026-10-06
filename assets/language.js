(() => {
 const entries=[];
 function bind(selector,english){document.querySelectorAll(selector).forEach((element,i)=>{const en=Array.isArray(english)?english[i]:english;if(en!==undefined)entries.push({element,ja:element.innerHTML,en});});}
 bind('.section-rail [data-panel]',['Home','Works','Exhibitions','Artist','Contact']);
 bind('#works>.section-title','Works');bind('#exhibitions>.section-title','Exhibitions');bind('#contact>.section-title','Contact');
 const names=['Koi','Vermilion Wakin','Rain Frog: The Fox’s Wedding','Yellow-Dusted Medaka','Blue Sea Turtle','Autumn Leaves'];
 bind('#works .work-caption h3',names);
 bind('#works .work-caption > p:first-of-type',['2026 · Master’s Thesis Work','2024 · Shogakukan Award','2025','2026','2026','2025']);
 bind('#works .work-material',['Cast metal · Resin','Cast metal · Resin','Cast metal · Red copper finish']);
 bind('.touch-detail-hint','Tap again for artwork details');
 bind('#works>.text-link','View all works');
 bind('.featured-show h3','Utsuroi, Tomeru');
 bind('.featured-show p',['5 September – 20 October 2026','Garari Showcase<br>Obuse, Nagano · Next to the Hokusai-kan Museum<br>Free admission','Presenting Gakyo no Kiku, a new cast-metal work depicting the Tomoenishiki chrysanthemum from Hokusai’s Chrysanthemums.']);
 bind('.exhibition-list .date',['Permanent display','27–29 November 2026','11–22 December 2026','20 March – 18 April 2027']);
 bind('.exhibition-list h3',['The Arts Fusion by Lecrin','KOGEI Art Fair Kanazawa 2026','Solo exhibition','Two-person exhibition (planned)']);
 bind('.exhibition-list article>div>p',['Ueno, Tokyo · Vermilion Wakin on display','Hyatt Centric Kanazawa<br>GALLERY KOGURE booth','MEDEL GALLERY SHU HIBIYA<br>Imperial Hotel Plaza, 1F','Kure Municipal Museum of Art, Hiroshima']);
 bind('#exhibitions>.text-link','View all exhibitions');
 bind('.artist-name','Kaito Kawasaki');bind('.artist-role','Metal artist · Metal casting');
 bind('.artist-introduction>p:not(.artist-role)','Born in Kure, Hiroshima, in 2000.<br>Completed a master’s degree in metal casting in the Department of Crafts, Graduate School of Fine Arts, Tokyo University of the Arts, in 2026. Based in Tokyo.');
 bind('.philosophy-copy h3','Kogei Realism');
 bind('.philosophy-copy p',['Goldfish and other living creatures are cast in metal and placed within acrylic resin. The metal’s colors emerge through polishing, heating, and carefully controlled oxygen and temperature conditions.','The work takes in the relationships between water, light, vessels, materials, and the viewer. This approach is called “Kogei Realism.”']);
 bind('.artist-introduction>.text-link','Full artist profile');
 bind('.bio-list dt',['Awards','Galleries','Publication']);
 bind('.bio-list dd',['2026 · Salon de Printemps Award<br>2025 · Shogakukan Award, 19th Geidai Art Plaza Art Award','GALLERY KOGURE / Geidai Art Plaza / Toubikai','100 Metal Craftspeople: Contemporary Japan’s Elite (Abe Publishing)']);
 bind('#contact .contact-lead','Artwork, exhibition and press inquiries');
 bind('#contact .related-links a',['Artwork purchases','Studio notes','About the artist']);
 bind('.contact-detail','Press & exhibition inquiries');bind('.contact-privacy','Privacy policy');

 bind('.full-concept-link','Read the full concept');
 bind('.source-note','Information and photographs: <a href="https://kaitokawasaki.com/">Official website</a> (checked 5 October 2026)');
 const attrs=[];
 function attr(selector,name,value){document.querySelectorAll(selector).forEach((el,i)=>attrs.push({el,name,ja:el.getAttribute(name),en:Array.isArray(value)?value[i]:value}));}
 attr('.section-rail','aria-label','Jump to section');attr('#works','aria-label','Works');attr('.hero-slideshow','aria-label','Artwork slideshow');attr('h1','aria-label','Kaito Kawasaki');attr('.calligraphy-name','alt','Kaito Kawasaki');
 attr('#works .work-card img','alt',names.map(n=>'Kaito Kawasaki — '+n));
 attr('.hero-slide','alt',['Cast goldfish in a resin bag','Cast frog with leaves','Cast goldfish in a white vessel','Cast goldfish in a resin block','Cast goldfish on a plate','Cast goldfish in a round bowl','Cast goldfish with paper fragments','Cast goldfish in resin folds']);attr('.portrait','alt','Portrait illustration of Kaito Kawasaki');attr('.featured-show img','alt','Utsuroi, Tomeru — solo exhibition announcement');
 const toggle=document.querySelector('#language-toggle');
 const originalTitle=document.title;
 const latin=document.createElement('span');latin.className='english-artist-name';latin.textContent='Kaito Kawasaki';latin.setAttribute('aria-hidden','true');document.querySelector('.hero-type h1').append(latin);
 function setLanguage(lang){
  document.documentElement.lang=lang;
  entries.forEach(({element,ja,en})=>element.innerHTML=lang==='en'?en:ja);
  attrs.forEach(({el,name,ja,en})=>el.setAttribute(name,lang==='en'?en:ja));
  toggle.textContent=lang==='en'?'日本語':'EN';toggle.lang=lang==='en'?'ja':'en';toggle.setAttribute('aria-label',lang==='en'?'Switch to Japanese':'英語に切り替え');
  document.title=lang==='en'?'Kaito Kawasaki (Metal-Casting Artist) | KOGEI REALISM':originalTitle;
  try{localStorage.setItem('kawasaki-language',lang)}catch{}
  document.querySelectorAll('a[href^="/kawasaki-water-study/pages/"]').forEach(a=>{
   const path=a.getAttribute('href').replace('-en.html','.html');
   a.setAttribute('href',lang==='en'&&!/\/(journal|kogei-realism)\.html$/.test(path)?path.replace('.html','-en.html'):path);
  });
  if(typeof label==='function')label();
 }
 toggle.addEventListener('click',()=>setLanguage(document.documentElement.lang==='en'?'ja':'en'));
 let saved='ja';try{saved=localStorage.getItem('kawasaki-language')||'ja'}catch{}
 const requested=new URLSearchParams(location.search).get('lang');
 setLanguage((requested||saved)==='en'?'en':'ja');
})();
