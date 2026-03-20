// main.js - Landing Page Logic
let currentSection = 'home';

function showSection(id) {
  if (id === currentSection) return;
  currentSection = id;
  document.querySelectorAll('.page-section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  const navBtn = document.getElementById('nav-' + id);
  if(navBtn) navBtn.classList.add('active');
  
  const el = document.querySelector({'home':'#hero-content','sobre':'#sobre-content','servicos':'#servicos-content'}[id]);
  if (el) gsap.fromTo(el,{opacity:0,y:20},{opacity:1,y:0,duration:0.7,ease:'power3.out'});
}

window.addEventListener('load', () => { 
  gsap.set('#hero-content',{y:40,opacity:0});
  gsap.to('#hero-content',{opacity:1,y:0,duration:1,delay:0.3,ease:'power3.out'});
  
  document.querySelectorAll('.chip-val').forEach(el => {
    gsap.to(el, {innerHTML:parseInt(el.dataset.target), duration:2.5, delay:1.2, ease:'power2.out', snap:{innerHTML:1}});
  });
});
