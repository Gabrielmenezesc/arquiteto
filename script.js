/* =============================================
   AUGUSTO AI — REALISTIC APARTMENT (FPS REWRITE)
   script.js — Robust PointerLockControls & Collisions
   ============================================= */

'use strict';

// ── State ──────────────────────────────────────
let scene, camera, renderer, controls;
let condoGroup, apartGroup;
let agentOrb, orbLight;
let walkMode = false;
let currentSection = 'home';
let stagesBuilt = [false, false, false];
let currentView = 'exterior';

// Movement state
let moveForward = false;
let moveBackward = false;
let moveLeft = false;
let moveRight = false;
let velocity = new THREE.Vector3();
let direction = new THREE.Vector3();
let prevTime = performance.now();

// ── Helpers ────────────────────────────────────
function updateClock() {
  const now = new Date();
  const pad = n => String(n).padStart(2, '0');
  const el = document.getElementById('sys-clock');
  if (el) el.textContent = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
}
updateClock();
setInterval(updateClock, 1000);

// UI Mouse tracking for homepage parallax
let mouseX = 0, mouseY = 0;
document.addEventListener('mousemove', e => {
  if (!walkMode || !controls.isLocked) {
    mouseX = e.clientX;
    mouseY = e.clientY;
  }
});

// ═══════════════════════════════════════════════
// PROCEDURAL TEXTURES
// ═══════════════════════════════════════════════
function makeWoodTex(w=512, h=512, base='#7B5533', grain='#5C3D1E') {
  const c = document.createElement('canvas'); c.width=w; c.height=h;
  const g = c.getContext('2d');
  g.fillStyle = base; g.fillRect(0,0,w,h);
  const plankH = 80;
  for (let y=0; y<h; y+=plankH) {
    g.fillStyle = `rgba(0,0,0,${Math.random()*.08})`;
    g.fillRect(0,y,w,1.5);
    for (let k=0;k<2;k++) {
      const kx=Math.random()*w, ky=y+Math.random()*plankH, r=8+Math.random()*12;
      const gr = g.createRadialGradient(kx,ky,0,kx,ky,r);
      gr.addColorStop(0,'rgba(40,20,5,.3)'); gr.addColorStop(1,'rgba(40,20,5,0)');
      g.fillStyle=gr; g.beginPath(); g.arc(kx,ky,r,0,Math.PI*2); g.fill();
    }
  }
  for (let i=0;i<200;i++) {
    const y=Math.random()*h, len=20+Math.random()*100;
    g.strokeStyle=`rgba(0,0,0,${Math.random()*.06})`; g.lineWidth=Math.random()*1.2;
    g.beginPath(); g.moveTo(Math.random()*w,y); g.lineTo(Math.random()*w+len,y+Math.random()*4-2); g.stroke();
  }
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(4,1);
  return t;
}

function makeTileTex(w=512, h=512) {
  const c = document.createElement('canvas'); c.width=w; c.height=h;
  const g = c.getContext('2d');
  g.fillStyle = '#D8D9DC'; g.fillRect(0,0,w,h);
  const sz = 64;
  for (let y=0;y<h;y+=sz) {
    for (let x=0;x<w;x+=sz) {
      g.fillStyle = `hsl(220,5%,${84+Math.random()*4}%)`; g.fillRect(x+1,y+1,sz-2,sz-2);
    }
  }
  g.strokeStyle='#999aaa'; g.lineWidth=2;
  for (let y=0;y<h;y+=sz) { g.beginPath();g.moveTo(0,y);g.lineTo(w,y);g.stroke(); }
  for (let x=0;x<w;x+=sz) { g.beginPath();g.moveTo(x,0);g.lineTo(x,h);g.stroke(); }
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(4,4);
  return t;
}

function makePlasterTex(w=512, h=512, color='#E8E0D4') {
  const c = document.createElement('canvas'); c.width=w; c.height=h;
  const g = c.getContext('2d');
  g.fillStyle = color; g.fillRect(0,0,w,h);
  for (let i=0;i<4000;i++) {
    const x=Math.random()*w, y=Math.random()*h, r=Math.random()*3;
    g.fillStyle=`rgba(0,0,0,${Math.random()*.025})`;
    g.beginPath(); g.arc(x,y,r,0,Math.PI*2); g.fill();
  }
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(2,2);
  return t;
}

function makeCarpetTex(w=512, h=512) {
  const c = document.createElement('canvas'); c.width=w; c.height=h;
  const g = c.getContext('2d');
  g.fillStyle = '#6B5B7A'; g.fillRect(0,0,w,h);
  for (let i=0;i<20000;i++) {
    const x=Math.random()*w, y=Math.random()*h;
    g.fillStyle=`rgba(${120+Math.random()*30},${100+Math.random()*20},${130+Math.random()*30},${Math.random()*.3})`;
    g.fillRect(x,y,1,1);
  }
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(3,3);
  return t;
}

function makeFabricTex(w=256, h=256, color='#4A5568') {
  const c = document.createElement('canvas'); c.width=w; c.height=h;
  const g = c.getContext('2d');
  g.fillStyle = color; g.fillRect(0,0,w,h);
  for (let i=0;i<3000;i++) {
    const x=Math.random()*w, y=Math.random()*h, a = Math.random()*.07;
    g.fillStyle=`rgba(255,255,255,${a})`; g.fillRect(x,y,1.5,1.5);
  }
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(2,2);
  return t;
}

function makeMarbleTex(w=512, h=512) {
  const c = document.createElement('canvas'); c.width=w; c.height=h;
  const g = c.getContext('2d');
  g.fillStyle='#F0EEEB'; g.fillRect(0,0,w,h);
  for (let i=0;i<30;i++) {
    g.strokeStyle=`rgba(180,160,140,${Math.random()*.4})`; g.lineWidth=Math.random()*3;
    g.beginPath(); const x=Math.random()*w; g.moveTo(x,0);
    for (let y=0;y<h;y+=10) g.lineTo(x+(Math.random()-0.5)*30,y);
    g.stroke();
  }
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(2,2);
  return t;
}

let TEX = {};
function buildTextures() {
  TEX.wood = makeWoodTex(); TEX.tile = makeTileTex();
  TEX.plaster = makePlasterTex(); TEX.plasterBlue = makePlasterTex(512,512,'#D8E4ED');
  TEX.carpet = makeCarpetTex(); TEX.fabric = makeFabricTex(); TEX.marble = makeMarbleTex();
}

function mat(color=0xffffff, options={}) {
  return new THREE.MeshStandardMaterial({ color, roughness:.8, metalness:0, ...options });
}

// ═══════════════════════════════════════════════
// INIT INITIALIZATION
// ═══════════════════════════════════════════════
function init() {
  buildTextures();

  scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x040810, 0.022);
  scene.background = new THREE.Color(0x040810);

  camera = new THREE.PerspectiveCamera(72, window.innerWidth/window.innerHeight, 0.05, 400);
  camera.position.set(0, 16, 62);

  renderer = new THREE.WebGLRenderer({ canvas: document.querySelector('#main-canvas'), antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.25;
  renderer.outputEncoding = THREE.sRGBEncoding;

  initLights();
  initGroups();
  initControls();

  window.addEventListener('resize', onResize);
}

function initLights() {
  scene.add(new THREE.AmbientLight(0x88aacc, 0.35));
  const sun = new THREE.DirectionalLight(0xfff5dd, 1.2);
  sun.position.set(40, 70, 30); sun.castShadow = true;
  sun.shadow.mapSize.set(2048,2048);
  sun.shadow.camera.near = 1; sun.shadow.camera.far = 200;
  [-70,70].forEach(v => { sun.shadow.camera.left=sun.shadow.camera.bottom=v; sun.shadow.camera.right=sun.shadow.camera.top=-v; });
  scene.add(sun);

  scene.add(new THREE.DirectionalLight(0x4488cc, 0.4));
  const skyFill = new THREE.DirectionalLight(0x4488cc, 0.4); skyFill.position.set(-30, 20, -10); scene.add(skyFill);

  // Interior warm ceiling lights
  [[0, 2.9, 3], [5, 2.9, -3], [-4, 2.9, -3]].forEach(([x,y,z]) => {
    const l = new THREE.PointLight(0xFFE4B0, 1.4, 12);
    l.position.set(x,y,z); l.castShadow = true; l.shadow.mapSize.set(512,512); scene.add(l);
  });

  orbLight = new THREE.PointLight(0x00f2ff, 2, 30); scene.add(orbLight);
}

function initGroups() {
  condoGroup = new THREE.Group(); apartGroup = new THREE.Group();
  scene.add(condoGroup); scene.add(apartGroup);
  apartGroup.visible = false;

  buildCondominium();
  buildRealisticApart();
  buildGround();
  buildStarField();
  buildOrb();
}

function initControls() {
  controls = new THREE.PointerLockControls(camera, document.body);

  const blocker = document.getElementById('blocker');
  
  blocker.addEventListener('click', function () {
    controls.lock();
  });

  controls.addEventListener('lock', function () {
    blocker.style.display = 'none';
    document.body.classList.add('walk-active');
  });

  controls.addEventListener('unlock', function () {
    if (walkMode) blocker.style.display = 'flex';
    document.body.classList.remove('walk-active');
    // Stop movement
    moveForward = false; moveBackward = false; moveLeft = false; moveRight = false;
  });

  const onKeyDown = function (event) {
    if(!walkMode) return;
    switch (event.code) {
      case 'ArrowUp': case 'KeyW': moveForward = true; break;
      case 'ArrowLeft': case 'KeyA': moveLeft = true; break;
      case 'ArrowDown': case 'KeyS': moveBackward = true; break;
      case 'ArrowRight': case 'KeyD': moveRight = true; break;
    }
  };

  const onKeyUp = function (event) {
    if(!walkMode) return;
    switch (event.code) {
      case 'ArrowUp': case 'KeyW': moveForward = false; break;
      case 'ArrowLeft': case 'KeyA': moveLeft = false; break;
      case 'ArrowDown': case 'KeyS': moveBackward = false; break;
      case 'ArrowRight': case 'KeyD': moveRight = false; break;
    }
  };

  document.addEventListener('keydown', onKeyDown);
  document.addEventListener('keyup', onKeyUp);
}

// ═══════════════════════════════════════════════
// SCENERY CONSTRUCTION
// ═══════════════════════════════════════════════
function buildCondominium() {
  const FLOORS=6, UNITS=3, UW=9, BW=27, BD=14, FH=3.2, BH=FLOORS*FH;
  const wMat = (c=0x00f2ff, o=0.35) => new THREE.MeshBasicMaterial({color:c, wireframe:true, transparent:true, opacity:o});
  const gMat = (c=0x00f2ff, o=0.08) => new THREE.MeshPhongMaterial({color:c, transparent:true, opacity:o, shininess:180, side:THREE.DoubleSide});
  const add = (geo,x,y,z,m) => { const me=new THREE.Mesh(geo,m); me.position.set(x,y,z); condoGroup.add(me); };

  add(new THREE.BoxGeometry(BW,BH,BD), 0,BH/2,0, new THREE.MeshBasicMaterial({color:0x060c14, transparent:true, opacity:.95}));
  add(new THREE.BoxGeometry(BW,BH,BD), 0,BH/2,0, wMat(0x00f2ff,.1));

  for (let f=0;f<=FLOORS;f++) add(new THREE.BoxGeometry(BW+.5,.18,BD+.5), 0,f*FH,0, wMat(0x00f2ff,.45));
  [-BW/2, -BW/2+UW, 0, BW/2-UW, BW/2].forEach(cx => {
    const cg=new THREE.BoxGeometry(.8,BH,.8);
    [BD/2, -BD/2].forEach(cz => add(cg, cx,BH/2,cz, wMat(0x00f2ff,.3)));
  });

  const WCOLS=UNITS*2;
  for (let r=0;r<FLOORS;r++) {
    for (let c=0;c<WCOLS;c++) {
      const gx=-BW/2+(c+.5)*(BW/WCOLS)+.5, gy=r*FH+FH/2+.3;
      const wg=new THREE.BoxGeometry(1.8,1.6,.1);
      add(wg, gx,gy, BD/2+.05, gMat(0x2af0ff,.35)); add(wg, gx,gy, BD/2+.05, wMat(0x00f2ff,.6));
      add(wg, gx,gy,-(BD/2+.05), gMat(0x2af0ff,.25));
    }
  }

  for (let f=1;f<FLOORS;f++) {
    for (let u=0;u<UNITS;u++) {
      const bx=-BW/2+u*UW+UW/2, by=f*FH-.1;
      add(new THREE.BoxGeometry(UW-1,.15,2.2), bx,by, BD/2+1.1, wMat(0x00ccff,.4));
      add(new THREE.BoxGeometry(UW-1,1,2.2), bx,by+.6,BD/2+1.1,wMat(0x00f2ff,.2));
    }
  }

  add(new THREE.BoxGeometry(10,.3,5), 0,FH*.6, BD/2+2.5, gMat(0x00f2ff,.2));
  add(new THREE.BoxGeometry(3,2.6,.1), 0,1.3, BD/2+.08, gMat(0x00aaff,.4));
  add(new THREE.BoxGeometry(3,2.6,.1), 0,1.3, BD/2+.08, wMat(0x00f2ff,.8));
  add(new THREE.BoxGeometry(BW,.5,BD), 0,BH+.25,0, wMat(0x00f2ff,.15));
  add(new THREE.TorusGeometry(2.8,.08,8,50), 0,BH+2.2,0, wMat(0x00f2ff,.9));
}

function buildRealisticApart() {
  const A = apartGroup, H = 3.0, WT = 0.14;
  const addM = (geo, m, x,y,z, ry=0) => {
    const me = new THREE.Mesh(geo, m); me.position.set(x,y,z); me.rotation.y=ry;
    me.castShadow=true; me.receiveShadow=true; A.add(me);
  };

  const mWall = mat(0xE8E0D4, { map: TEX.plaster, roughness:.9 });
  const mWallB = mat(0xCDD8E0, { map: TEX.plasterBlue, roughness:.9 });
  const mCeil = mat(0xF5F0E8, { roughness:1.0 });
  const mWood = mat(0x7B5533, { map: TEX.wood, roughness:.4, metalness:.02 });
  const mTile = mat(0xD8D9DC, { map: TEX.tile, roughness:.25, metalness:.05 });
  const mCarpet = mat(0x6B5B7A, { map: TEX.carpet, roughness:.95 });
  const mFabric = mat(0x4A5568, { map: TEX.fabric, roughness:.95 });
  const mCream = mat(0xF5F0E8, { roughness:.9 });
  const mDark = mat(0x1A2535, { roughness:.5 });
  const mWhite = mat(0xF8F8F6, { roughness:.7 });
  const mMetal = mat(0xA0A8B0, { roughness:.2, metalness:.9 });
  const mBlack = mat(0x0D0D0D, { roughness:.3, metalness:.1 });
  const mWood2 = mat(0x5C3D1E, { roughness:.5 });
  const mMarble = mat(0xF0EEEB, { map: TEX.marble, roughness:.15, metalness:.05 });
  const panel = (w,h,d) => new THREE.BoxGeometry(w,h,d);

  // LIVING ROOM
  addM(panel(9,.08,6), mWood, 0,.04,3); addM(panel(9,.08,6), mCeil, 0,H,3);
  addM(panel(9,H,WT), mWall, 0,H/2,6.07); addM(panel(WT,H,6), mWall, -4.5,H/2,3);
  addM(panel(WT,H,6), mWall, 4.5,H/2,3); addM(panel(3.5,H,WT), mWall, -2.7,H/2,0);
  addM(panel(3.5,H,WT), mWall, 2.7,H/2,0); addM(panel(2,1.0,WT), mWall, 0,H-.5,0);
  addM(panel(3,.08,WT+.1), mMetal, -1.8, H-.4, 6.08);
  addM(panel(3,2.1,.04), mat(0xADD8E6, {transparent:true, opacity:.25, roughness:.05}), -1.8,1.45,6.1);
  const winLight = new THREE.SpotLight(0xFFF5CC, 1.5, 10, Math.PI*.25, .5, 1.5);
  winLight.position.set(-1.8, 3.0, 5.5); winLight.target.position.set(-1.8,0,3); scene.add(winLight, winLight.target);
  
  addM(panel(3.0,.65,1.0), mFabric, -1.0,.32,4.6); addM(panel(3.0,.85,.22), mFabric, -1.0,.72,5.07);
  addM(panel(.22,.85,1.0), mFabric, -2.54,.72,4.6); addM(panel(.22,.85,1.0), mFabric, 0.54,.72,4.6);
  addM(panel(.9,.16,.5), mCream, -1.8,.66,4.68); addM(panel(.9,.16,.5), mCream, -1.0,.66,4.68); addM(panel(.9,.16,.5), mCream, -.2,.66,4.68);
  
  addM(panel(1.4,.06,.75), mWood2, -1.0,.47,3.6);
  [[-.6,.22,3.3],[-.6,.22,3.9],[-.4+.6,.22,3.3],[-.4+.6,.22,3.9]].forEach(([x,y,z]) => addM(panel(.06,.45,.06), mMetal, x,y,z));
  
  addM(panel(2.8,.5,.4), mDark, 1.2,.25,.75); addM(panel(2.8,.06,.4), mWood, 1.2,.51,.75);
  addM(panel(2.2,1.3,.06), mBlack, 1.2,1.2,.95); 
  addM(panel(2.0,1.1,.04), mat(0x0a1528,{emissive:0x0a2040,emissiveIntensity:.6,roughness:.2}), 1.2,1.2,.98);
  const tvL = new THREE.PointLight(0x1a3cff,.6,3); tvL.position.set(1.2,1.2,1.1); scene.add(tvL);
  
  addM(panel(.05,1.8,.05), mMetal, 3.5,.9,4.8); addM(new THREE.ConeGeometry(.3,.4,16), mat(0xF5E6C8,{roughness:.9}), 3.5,1.9,4.8);
  const lampL = new THREE.PointLight(0xFFE4A0,.8,5, 2); lampL.position.set(3.5,1.7,4.8); scene.add(lampL);
  
  addM(panel(.3,2.2,.8), mWood, 3.9,1.1, .6); addM(panel(.3,2.2,.8), mWood, 4.15,1.1,.6);
  [.3,.85,1.4,1.95].forEach(y => addM(panel(.22,.04,.8), mWood2, 4.0,y,.6));

  // KITCHEN
  addM(panel(4.5,.08,6), mTile, -2.25,.04,-3); addM(panel(4.5,.08,6), mCeil, -2.25,H,-3);
  addM(panel(WT,H,6), mWall, -4.5,H/2,-3); addM(panel(4.5,H,WT), mWall, -2.25,H/2,-6.07);
  addM(panel(WT,H,6), mWall, 0,H/2,-3);
  
  addM(panel(4.0,.06,.7), mWhite, -2.25,.9,-5.72); addM(panel(4.0,.9,.7), mWhite, -2.25,.45,-5.72);
  addM(panel(4.0,.06,.7), mMarble,-2.25,.93,-5.72);
  addM(panel(.7,.9,2.8), mWhite, -4.18,.45,-3.8); addM(panel(.7,.06,2.8), mMarble,-4.18,.93,-3.8);
  addM(panel(.65,.1,.5), mMetal, -2.0,.96,-5.72); addM(panel(.55,.08,.4), mat(0x222222), -2.0,.97,-5.72);
  addM(panel(.7,1.9,.7), mat(0xBFC8CC, {roughness:.2,metalness:.3}), -4.18,.95,-5.5); addM(panel(.66,.02,.66), mMetal, -4.18,1.9,-5.5);
  
  addM(panel(1.5,.06,1.0), mWood, -2.0,.78,-2.3);
  [-.55,.55].forEach(ox => [-.35,.35].forEach(oz => addM(panel(.06,.74,.06), mWood2, -2.0+ox,.37,-2.3+oz)));
  [[-1.7,.25,-2.3],[-2.3,.25,-2.3],[-2.0,.25,-1.9],[-2.0,.25,-2.7]].forEach(([x,y,z],i) => {
    const ry = [0,Math.PI,Math.PI/2,-Math.PI/2][i];
    addM(panel(.4,.06,.4), mDark, x,y+.36,z, ry);
    addM(panel(.4,.8,.04), mDark, x,y+.76,z+.22*Math.cos(ry), ry);
    [-.15,.15].forEach(dx => [-.15,.15].forEach(dz =>
      addM(panel(.04,.4,.04), mWood2, x+dx*Math.cos(ry)-dz*Math.sin(ry),y+.2,z+dz*Math.cos(ry)+dx*Math.sin(ry))));
  });

  // BEDROOM
  addM(panel(4.5,.08,6), mCarpet, 2.25,.04,-3); addM(panel(4.5,.08,6), mCeil, 2.25,H,-3);
  addM(panel(WT,H,6), mWallB, 4.5,H/2,-3); addM(panel(4.5,H,WT), mWallB, 2.25,H/2,-6.07);
  addM(panel(2.2,2.0,.04), mat(0xADD8E6,{transparent:true,opacity:.25}), 2.25,1.6,-6.08);
  const bWinL = new THREE.SpotLight(0xFFF5CC,1,8,Math.PI*.2,.4,2); bWinL.position.set(2.25,2.4,-5.8); bWinL.target.position.set(2.25,0,-4); scene.add(bWinL,bWinL.target);
  
  addM(panel(2.0,.28,2.8), mat(0x1A2535), 2.25,.14,-4.4); addM(panel(2.0,.18,.14), mat(0x1A2535), 2.25,.28,-5.73);
  addM(panel(2.0,.65,.14), mat(0x1A2535), 2.25,.6,-5.87); addM(panel(1.88,.3,2.58), mCream, 2.25,.44,-4.4);
  addM(panel(1.88,.06,1.7), mat(0xEEEEE5,{roughness:.95}), 2.25,.61,-3.6);
  addM(panel(.75,.14,.5), mCream, 1.75,.65,-5.5); addM(panel(.75,.14,.5), mCream, 2.75,.65,-5.5);
  addM(panel(1.88,.12,1.2), mat(0x7a96b0,{roughness:.95}), 2.25,.62,-4.0);
  
  addM(panel(2.0,2.4,.56), mWood, 2.25,1.2,-5.97); addM(panel(.96,1.9,.04), mWood2, 1.78,1.3,-5.69); addM(panel(.96,1.9,.04), mWood2, 2.74,1.3,-5.69);
  addM(panel(.06,.06,.06), mMetal, 2.18,1.3,-5.66); addM(panel(.06,.06,.06), mMetal, 2.34,1.3,-5.66);
  
  addM(panel(.5,.55,.5), mat(0x1E2D3A), 3.75,.27,-5.4); addM(panel(.06,.5,.06), mMetal, 3.75,.8,-5.4);
  addM(new THREE.ConeGeometry(.18,.3,12), mat(0xF5E0C0,{roughness:.9}), 3.75,1.08,-5.4);
  const btL = new THREE.PointLight(0xFFDD90,.5,3,2); btL.position.set(3.75,1.1,-5.4); scene.add(btL);
  
  addM(panel(3.0,.02,4.8), mat(0x8B7355,{roughness:.98}), 2.25,.05,-3.6);
  
  // HALLWAY
  addM(panel(2,.08,2), mTile, 0,.04,1); addM(panel(2,.08,2), mCeil, 0,H,1);
  addM(panel(.7,1.2,.04), mat(0xB0C4CC,{roughness:.05,metalness:.15}), -4.48,1.6,1.5);
}

function buildGround() {
  const gTex = makeTileTex(512,512); gTex.repeat.set(20,20);
  const gr = new THREE.Mesh(new THREE.PlaneGeometry(200,200), new THREE.MeshStandardMaterial({map:gTex,roughness:.8}));
  gr.position.set(0,-.01,0); gr.rotation.x=-Math.PI/2; gr.receiveShadow=true; scene.add(gr);
  
  function tree(x,z) {
    const t = new THREE.Mesh(new THREE.CylinderGeometry(.15,.22,1.6,8), mat(0x3D2B1F,{roughness:.9})); t.position.set(x,.8,z); scene.add(t);
    const crown = new THREE.Mesh(new THREE.SphereGeometry(1.6,10,8), mat(0x1E4D2B,{roughness:.9})); crown.position.set(x,2.5,z); scene.add(crown);
  }
  [[-20,25],[-20,35],[20,25],[20,35],[-28,20],[28,20],[-26,30],[26,30]].forEach(([x,z])=>tree(x,z));
  
  const roadM = new THREE.Mesh(new THREE.PlaneGeometry(8,40), mat(0x111318,{roughness:.9}));
  roadM.rotation.x = -Math.PI/2; roadM.position.set(0,.01,40); scene.add(roadM);
}

function buildStarField() {
  const geo = new THREE.BufferGeometry(), pos = new Float32Array(2500*3);
  for (let i=0;i<2500*3;i++) pos[i]=(Math.random()-.5)*400;
  geo.setAttribute('position', new THREE.BufferAttribute(pos,3));
  const stars = new THREE.Points(geo, new THREE.PointsMaterial({color:0x88aabb,size:.2,transparent:true,opacity:.6}));
  stars.name='stars'; scene.add(stars);
}

function buildOrb() {
  agentOrb = new THREE.Mesh(new THREE.SphereGeometry(.5,24,24), new THREE.MeshBasicMaterial({color:0x00f2ff}));
  scene.add(agentOrb);
}

// ═══════════════════════════════════════════════
// UI & NAVIGATION
// ═══════════════════════════════════════════════
function showSection(id) {
  if (id===currentSection) return;
  currentSection=id;
  document.querySelectorAll('.page-section').forEach(s=>s.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(b=>b.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  document.getElementById('nav-'+id)?.classList.add('active');
  const el = document.querySelector({'home':'#hero-content','sobre':'#sobre-content','servicos':'#servicos-content'}[id]);
  if (el) gsap.fromTo(el,{opacity:0,y:20},{opacity:1,y:0,duration:.7,ease:'power3.out'});
  const cams = {home:{x:0,y:16,z:62}, sobre:{x:-36,y:18,z:28}, servicos:{x:0,y:42,z:20}};
  gsap.to(camera.position,{...(cams[id]||cams.home),duration:2,ease:'power2.inOut'});
}

function startSimulation() {
  stagesBuilt=[false,false,false];
  [0,1,2].forEach(i=>{
    document.getElementById('bs'+i)?.classList.remove('done');
    const s=document.getElementById('bst'+i); if(s){s.textContent='';s.classList.remove('done');}
  });
  condoGroup.visible=true; apartGroup.visible=false;
  condoGroup.scale.set(.01,.01,.01);
  gsap.to(condoGroup.scale,{x:1,y:1,z:1,duration:2,ease:'expo.out'});
  gsap.to(camera.position,{x:8,y:16,z:65,duration:2,ease:'power2.inOut'});
  document.getElementById('build-controls').classList.add('visible');
  document.querySelectorAll('.view-btn').forEach(b=>b.classList.remove('active'));
  document.getElementById('vbtn-exterior')?.classList.add('active');
  currentView='exterior'; walkMode=false;
  setTimeout(()=>buildStage(0),600); playTone(440);
}

function buildStage(idx) {
  stagesBuilt[idx]=true;
  document.getElementById('bs'+idx)?.classList.add('done');
  const s=document.getElementById('bst'+idx); if(s){s.textContent='✓';s.classList.add('done');}

  if (idx===1) {
    apartGroup.visible=true; apartGroup.scale.set(1,.01,1);
    gsap.to(apartGroup.scale,{x:1,y:1,z:1,duration:2,ease:'expo.out'});
    setTimeout(()=>setView('interior'), 600);
  }
  if (idx===2) gsap.fromTo(apartGroup.scale,{x:.98,y:.98,z:.98},{x:1,y:1,z:1,duration:.5,ease:'elastic.out'});
  if (idx===0) gsap.to(camera.position,{x:-32,y:20,z:48,duration:3,ease:'power2.inOut', onComplete(){gsap.to(camera.position,{x:0,y:16,z:62,duration:2});}});
  playTone(550+idx*130);
}

function setView(v) {
  currentView=v;
  document.querySelectorAll('.view-btn').forEach(b=>b.classList.remove('active'));
  document.getElementById('vbtn-'+v)?.classList.add('active');
  if (v==='exterior') {
    if (walkMode) toggleWalkMode();
    gsap.to(camera.position,{x:0,y:16,z:62,duration:2,ease:'power2.inOut'});
  } else {
    // Move inside!
    camera.rotation.set(0,Math.PI,0); // face inward (-Z)
    gsap.to(camera.position,{x:0,y:1.72,z:3.8,duration:2,ease:'power2.inOut'});
  }
  playTone(v==='interior'?880:660);
}

function toggleWalkMode() {
  walkMode=!walkMode;
  const btn = document.getElementById('walk-btn');
  const lbl = document.getElementById('walk-label');
  if (walkMode) {
    if (stagesBuilt[1]) apartGroup.visible=true;
    document.getElementById('blocker').style.display = 'flex'; // show immediately
    gsap.to(camera.position,{x:0,y:1.72,z:3.8,duration:1.2,ease:'power2.inOut'});
    btn.classList.add('active'); lbl.textContent='Modo Caminhada: ON';
  } else {
    document.getElementById('blocker').style.display = 'none';
    if(controls.isLocked) controls.unlock();
    btn.classList.remove('active'); lbl.textContent='Modo Caminhada: OFF';
    gsap.to(camera.position,{x:0,y:1.72,z:4.5,duration:1.2,ease:'power2.inOut'});
  }
  playTone(walkMode?880:440);
}

function exitSimulation() {
  document.getElementById('build-controls').classList.remove('visible');
  if (walkMode) toggleWalkMode();
  showSection('home');
}

// ═══════════════════════════════════════════════
// COLLISION AABB SYSTEM
// ═══════════════════════════════════════════════
function checkCollisions(pos) {
  // Bounding box of apartment walls
  if (pos.x < -4.1) pos.x = -4.1;
  if (pos.x >  4.1) pos.x =  4.1;
  if (pos.z < -5.6) pos.z = -5.6;
  if (pos.z >  5.8) pos.z =  5.8;

  // Couch / Coffee table bounding block (approx x:[-2.6, 0.6], z:[3.2, 5.2])
  if (pos.x > -3.0 && pos.x < 1.0 && pos.z > 3.0 && pos.z < 5.4) {
    if (Math.abs(pos.x - -3.0) < Math.abs(pos.z - 3.0)) pos.x = -3.0;
    else pos.z = 3.0; // simplistic push out
  }

  // Kitchen counter block (x:[-4.1, -1.8], z:[-5.6, -3.8])
  if (pos.x < -1.6 && pos.z < -3.6) {
    if (pos.x > -1.8) pos.x = -1.6;
    else pos.z = -3.6;
  }

  // Bed block (x:[1.2, 4.1], z:[-5.6, -3.0])
  if (pos.x > 1.0 && pos.z < -2.8) {
    if (pos.x < 1.4) pos.x = 1.0;
    else pos.z = -2.8;
  }
  
  return pos;
}

// ═══════════════════════════════════════════════
// ANIMATION LOOP
// ═══════════════════════════════════════════════
function onResize() {
  camera.aspect = window.innerWidth/window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
  requestAnimationFrame(animate);
  const now = performance.now();
  const delta = Math.min((now-prevTime)/1000,.08);
  prevTime = now;
  const t = now*.001;

  if (walkMode && controls.isLocked) {
    velocity.x -= velocity.x * 12.0 * delta;
    velocity.z -= velocity.z * 12.0 * delta;
    direction.z = Number(moveForward) - Number(moveBackward);
    direction.x = Number(moveRight) - Number(moveLeft);
    direction.normalize();
    if (moveForward || moveBackward) velocity.z -= direction.z * 40.0 * delta;
    if (moveLeft || moveRight) velocity.x -= direction.x * 40.0 * delta;

    controls.moveRight(-velocity.x * delta);
    controls.moveForward(-velocity.z * delta);

    // Enforce AABB Hitboxes
    const pos = controls.getObject().position;
    pos.y = 1.72; // lock head height
    checkCollisions(pos);

  } else if (!controls.isLocked) {
    // Gentle hovering if not in walk mode
    const normX=(mouseX/window.innerWidth-.5)*2;
    const normY=(mouseY/window.innerHeight-.5)*2;
    const inSim=document.getElementById('build-controls').classList.contains('visible');
    if (!inSim) {
      const tgts={home:{x:0,y:16,z:62},sobre:{x:-36,y:18,z:28},servicos:{x:0,y:42,z:20}};
      const tg=tgts[currentSection]||tgts.home;
      camera.position.x += (tg.x+normX*2-camera.position.x)*.012;
      camera.position.y += (tg.y-normY*1.5-camera.position.y)*.012;
      camera.lookAt(0,6,0);
    } else if (currentView==='interior') {
      camera.lookAt(0, 1.72, -10); // look straight down hallway
    } else {
      camera.lookAt(0,6,0);
    }
  }

  if (agentOrb) {
    agentOrb.position.x = Math.cos(t*.45)*26;
    agentOrb.position.y = Math.sin(t*.3)*5+14;
    agentOrb.position.z = Math.sin(t*.45)*26;
    if(orbLight) { orbLight.position.copy(agentOrb.position); orbLight.intensity=2+Math.sin(t*2); }
  }

  const stars=scene.getObjectByName('stars');
  if(stars) stars.rotation.y = t*.003;

  renderer.render(scene,camera);
}

// ═══════════════════════════════════════════════
// AUDIO & BOOT
// ═══════════════════════════════════════════════
let audioCtx=null;
function playTone(f=660,type='sine',dur=.1,vol=.04){
  try{
    if(!audioCtx) audioCtx=new(window.AudioContext||window.webkitAudioContext)();
    const ctx=audioCtx, o=ctx.createOscillator(), g=ctx.createGain();
    o.connect(g); g.connect(ctx.destination);
    o.type=type; o.frequency.setValueAtTime(f,ctx.currentTime);
    o.frequency.exponentialRampToValueAtTime(f*1.4,ctx.currentTime+dur);
    g.gain.setValueAtTime(vol,ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(.001,ctx.currentTime+dur);
    o.start(); o.stop(ctx.currentTime+dur);
  }catch(_){}
}
document.querySelectorAll('button,a').forEach(el=>el.addEventListener('click',()=>playTone(880)));

window.addEventListener('load',()=>{ 
  init(); 
  animate(); 
  gsap.set('#hero-content',{y:40,opacity:0});
  gsap.to('#hero-content',{opacity:1,y:0,duration:1,delay:.3,ease:'power3.out'});
  document.querySelectorAll('.chip-val').forEach(el=>{
    gsap.to(el,{innerHTML:parseInt(el.dataset.target),duration:2.5,delay:1.2,ease:'power2.out',snap:{innerHTML:1}});
  });
});
