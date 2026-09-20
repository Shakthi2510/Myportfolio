(()=>{
'use strict';
const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
const lowPower=matchMedia('(prefers-reduced-motion: reduce)').matches||innerWidth<600||navigator.hardwareConcurrency&&navigator.hardwareConcurrency<=4;
const canvas=document.getElementById('network-canvas'),ctx=canvas.getContext('2d',{alpha:true});
let w=0,h=0,dpr=1,nodes=[],pointer={x:-9999,y:-9999,active:false},last=performance.now(),lastDraw=0;
const count=()=>innerWidth<500?116:innerWidth<800?158:lowPower?190:330;
function resize(){dpr=Math.min(devicePixelRatio||1,1.2);w=innerWidth;h=innerHeight;canvas.width=Math.floor(w*dpr);canvas.height=Math.floor(h*dpr);canvas.style.width=w+'px';canvas.style.height=h+'px';ctx.setTransform(dpr,0,0,dpr,0,0)}
/* The field is not random: it encodes a quiet "network spine" — an abstract S-shaped signal path with satellites.
   It indirectly represents Shakthi's systems/network identity. Pointer energy displaces particles; when released they
   smoothly return to the same formation. */
function shapeTarget(i,total){
  const phase=i/total, main=Math.floor(total*.64), isMain=i<main;
  if(isMain){
    const t=i/(main-1), y=0.18+0.64*t;
    const x=0.5 + 0.24*Math.sin(t*Math.PI*2.0);
    return {x:x*w,y:y*h};
  }
  const t=(i-main)/(total-main), arm=Math.floor(t*6), local=(t*6)%1;
  const anchors=[[.13,.24],[.87,.24],[.15,.73],[.86,.73],[.31,.50],[.69,.50]];
  const a=anchors[arm], b={x:.5+(.5-a[0])*.18,y:.5+(.5-a[1])*.18};
  return {x:(a[0]+(b.x-a[0])*local)*w,y:(a[1]+(b.y-a[1])*local)*h};
}
function seed(){nodes=Array.from({length:count()},(_,i)=>{const t=shapeTarget(i,count()),j=(Math.random()-.5)*34;return {x:t.x+j,y:t.y+j,targetX:t.x,targetY:t.y,vx:0,vy:0,r:Math.random()*1.35+.45,p:Math.random()*6.28,phase:Math.random()*6.28}})}
function draw(now){if(lowPower&&now-lastDraw<32){requestAnimationFrame(draw);return}lastDraw=now;const dt=Math.min((now-last)/16.67,1.5);last=now;ctx.clearRect(0,0,w,h);const influence=innerWidth<700?118:170;
for(const p of nodes){
  const dx=p.x-pointer.x,dy=p.y-pointer.y,d=Math.hypot(dx,dy)||1;
  if(pointer.active&&d<influence){const force=(1-d/influence)*.32;p.vx+=(dx/d)*force*dt;p.vy+=(dy/d)*force*dt}
  const rx=p.targetX-p.x,ry=p.targetY-p.y;
  p.vx+=rx*.0042*dt;p.vy+=ry*.0042*dt;p.vx*=.955;p.vy*=.955;
  p.x+=(p.vx)*dt;p.y+=(p.vy)*dt;p.p+=.018*dt;
}
const cell=145,buckets=new Map();for(let i=0;i<nodes.length;i++){const p=nodes[i],key=Math.floor(p.x/cell)+','+Math.floor(p.y/cell);let arr=buckets.get(key);if(!arr){arr=[];buckets.set(key,arr)}arr.push(i)}
ctx.lineWidth=.65;for(const [key,list] of buckets){const [kx,ky]=key.split(',').map(Number);for(let ox=-1;ox<=1;ox++)for(let oy=-1;oy<=1;oy++){const other=buckets.get((kx+ox)+','+(ky+oy));if(!other)continue;for(const i of list)for(const j of other){if(j<=i)continue;const a=nodes[i],b=nodes[j],dx=a.x-b.x,dy=a.y-b.y,d=Math.hypot(dx,dy);if(d<108){ctx.globalAlpha=(1-d/108)*.16;ctx.strokeStyle='#00d9ff';ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke()}}}}
for(const p of nodes){ctx.globalAlpha=.28+.18*Math.sin(p.p+p.phase);ctx.fillStyle='#00e7ff';ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,Math.PI*2);ctx.fill()}
ctx.globalAlpha=.16;ctx.strokeStyle='#7657ff';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(.5*w,.16*h);ctx.bezierCurveTo(.74*w,.34*h,.26*w,.66*h,.5*w,.84*h);ctx.stroke();ctx.globalAlpha=1;if(!reduce)requestAnimationFrame(draw)}
resize();seed();requestAnimationFrame(draw);addEventListener('resize',()=>{resize();seed()},{passive:true});
const root=document.documentElement,topology=document.getElementById('topology');
addEventListener('pointermove',e=>{pointer.x=e.clientX;pointer.y=e.clientY;pointer.active=true;root.style.setProperty('--mx',e.clientX+'px');root.style.setProperty('--my',e.clientY+'px');if(topology){const r=topology.getBoundingClientRect();topology.style.setProperty('--topo-x',((e.clientX-r.left)/r.width*100)+'%');topology.style.setProperty('--topo-y',((e.clientY-r.top)/r.height*100)+'%')}},{passive:true});
addEventListener('pointerleave',()=>pointer.active=false,{passive:true});
const progress=document.getElementById('progress-bar');let ticking=false;addEventListener('scroll',()=>{if(ticking)return;ticking=true;requestAnimationFrame(()=>{const max=document.documentElement.scrollHeight-innerHeight;progress.style.width=(max>0?scrollY/max*100:0)+'%';ticking=false})},{passive:true});
const readout=document.getElementById('node-readout');if(topology)topology.querySelectorAll('button.node').forEach(node=>{const show=()=>{topology.querySelectorAll('.node.active').forEach(x=>x.classList.remove('active'));node.classList.add('active');readout.innerHTML='<b>'+node.dataset.title+'</b><span>→</span>'+node.dataset.info};node.addEventListener('mouseenter',show);node.addEventListener('focus',show);node.addEventListener('click',show)});
const observer=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('visible');observer.unobserve(e.target)}}),{threshold:.12,rootMargin:'0px 0px -7%'});document.querySelectorAll('.reveal').forEach(el=>observer.observe(el));
if(innerWidth>=850&&!lowPower){document.querySelectorAll('.tilt').forEach(card=>{card.addEventListener('pointermove',e=>{const r=card.getBoundingClientRect(),x=(e.clientX-r.left)/r.width-.5,y=(e.clientY-r.top)/r.height-.5;card.style.setProperty('--card-x',((x+.5)*100)+'%');card.style.setProperty('--card-y',((y+.5)*100)+'%');card.style.transform=`perspective(900px) rotateX(${(-y*3).toFixed(2)}deg) rotateY(${(x*4).toFixed(2)}deg) translateY(-4px)`},{passive:true});card.addEventListener('pointerleave',()=>card.style.transform='')});document.querySelectorAll('.magnetic').forEach(el=>{el.addEventListener('pointermove',e=>{const r=el.getBoundingClientRect();el.style.transform=`translate(${((e.clientX-r.left-r.width/2)*.07).toFixed(1)}px,${((e.clientY-r.top-r.height/2)*.07).toFixed(1)}px)`},{passive:true});el.addEventListener('pointerleave',()=>el.style.transform='')})}

/* Lightweight pointer HUD: native cursor stays responsible for the actual hand/text cursor. */
const pointerUI=document.querySelector('.pointer-ui');
let pointerTX=-100,pointerTY=-100,pointerX=-100,pointerY=-100,pointerFrame=0;
if(pointerUI && matchMedia('(pointer:fine)').matches){
  addEventListener('pointermove',e=>{pointerTX=e.clientX;pointerTY=e.clientY;pointerX=e.clientX;pointerY=e.clientY;},{passive:true});
  const movePointer=()=>{pointerX+=(pointerTX-pointerX)*.22;pointerY+=(pointerTY-pointerY)*.22;pointerUI.style.transform=`translate3d(${pointerX-17}px,${pointerY-17}px,0)`;pointerFrame=requestAnimationFrame(movePointer)};movePointer();
  const interactive='a,button,.stack-chip,.career-card,.edu-card,.project-card,.service,.btn';
  document.querySelectorAll(interactive).forEach(el=>{
    el.addEventListener('pointerenter',()=>{pointerUI.classList.add('active','hand-mode');pointerUI.classList.remove('text-mode');pointerUI.querySelector('b').textContent=el.matches('a,button,.stack-chip')?'SELECT':'TRACE';},{passive:true});
    el.addEventListener('pointerleave',()=>pointerUI.classList.remove('active','hand-mode','text-mode'),{passive:true});
  });
  document.querySelectorAll('.desktop-nav a,.hero h1,.section-head h2,.stack-chip span,.career-main h3,.edu-card h3,.project-card h3').forEach(el=>{
    if(el.closest('a,button')) return;
    el.addEventListener('pointerenter',()=>{pointerUI.classList.add('active','text-mode');pointerUI.classList.remove('hand-mode');pointerUI.querySelector('b').textContent='TYPE';},{passive:true});
    el.addEventListener('pointerleave',()=>pointerUI.classList.remove('active','text-mode'),{passive:true});
  });
}
/* Give the skill cards a tiny local light that follows the pointer. */
document.querySelectorAll('.stack-chip').forEach(card=>card.addEventListener('pointermove',e=>{const r=card.getBoundingClientRect();card.style.setProperty('--chip-x',((e.clientX-r.left)/r.width*100)+'%');card.style.setProperty('--chip-y',((e.clientY-r.top)/r.height*100)+'%')},{passive:true}));
/* Touch/finger crossing also produces a lightweight local lift on glass modules. */
document.querySelectorAll('.service,.telemetry-row,.stack-chip,.project-card,.edu-card,.career-card').forEach(card=>{card.addEventListener('pointermove',e=>{if(e.pointerType==='touch'){const r=card.getBoundingClientRect();const x=(e.clientX-r.left)/r.width-.5,y=(e.clientY-r.top)/r.height-.5;card.style.setProperty('--touch-x',((x+.5)*100)+'%');card.style.setProperty('--touch-y',((y+.5)*100)+'%');card.classList.add('touch-active')}},{passive:true});card.addEventListener('pointerup',()=>card.classList.remove('touch-active'),{passive:true});card.addEventListener('pointerleave',()=>card.classList.remove('touch-active'),{passive:true})});
/* V19 route particles — small station dots live directly on the Education and Work rails. */
const routeParticleDots=[];
function buildRouteParticles(){
  document.querySelectorAll('.career-path .path-line,.education-section .edu-track').forEach((rail)=>{
    if(rail.querySelector('.route-particle-layer')) return;
    const layer=document.createElement('div');
    layer.className='route-particle-layer';
    const total=rail.closest('.career-path')?18:15;
    for(let i=1;i<=total;i++){
      const dot=document.createElement('span');
      dot.className='route-particle';
      dot.style.setProperty('--route-y',`${(i/(total+1))*100}%`);
      layer.appendChild(dot);
      routeParticleDots.push({el:dot,rail,baseY:(i/(total+1)),x:0,y:0,tx:0,ty:0});
    }
    rail.appendChild(layer);
  });
}
buildRouteParticles();
let routeFrame=0;
function moveRouteParticles(){
  for(const d of routeParticleDots){
    const r=d.rail.getBoundingClientRect();
    const isMobile=innerWidth<=760;
    const cx=r.left+r.width/2, cy=r.top+r.height*d.baseY;
    const dx=cx-pointer.x,dy=cy-pointer.y,dist=Math.hypot(dx,dy)||1;
    const radius=isMobile?95:125;
    let ox=0,oy=0;
    if(pointer.active&&dist<radius){
      const force=(1-dist/radius)*14;
      ox=(dx/dist)*force;
      oy=(dy/dist)*force;
    }
    d.tx=ox;d.ty=oy;
    d.x+=(d.tx-d.x)*.16;d.y+=(d.ty-d.y)*.16;
    d.el.style.transform=`translate3d(${d.x.toFixed(2)}px,${d.y.toFixed(2)}px,0)`;
    d.el.classList.toggle('route-active',pointer.active&&dist<radius*.55);
  }
  routeFrame=requestAnimationFrame(moveRouteParticles);
}
moveRouteParticles();
window.addEventListener('resize',()=>{routeParticleDots.forEach(d=>{d.x=0;d.y=0})},{passive:true});

/* Active mobile/desktop navigation follows the section currently in view. */
const navLinks=[...document.querySelectorAll('.mobile-nav a,.desktop-nav a')];
const sections=[...document.querySelectorAll('main > section[id]')];
const navObserver=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){navLinks.forEach(a=>a.classList.toggle('active',a.getAttribute('href')==='#'+entry.target.id));}}),{rootMargin:'-35% 0px -55% 0px',threshold:0});
sections.forEach(s=>navObserver.observe(s));

const timeEl=document.getElementById('visitor-time'),status=document.getElementById('live-status');const tick=()=>{const d=new Date();if(timeEl)timeEl.textContent=d.toLocaleTimeString([],{hour12:false});if(status)status.textContent=['SYSTEM ONLINE','NODE STABLE','LINK ACTIVE'][Math.floor(Date.now()/3200)%3]};tick();setInterval(tick,1000);const year=document.getElementById('year');if(year)year.textContent=new Date().getFullYear();
})();


// V21 dynamic header mark: the personal S stays fixed while the circuit nodes shift mode.
(() => {
  const mark = document.querySelector('.logo-mark');
  if (!mark || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const modes = ['SYS', 'NET', 'SEC', 'CODE'];
  let mode = 0;
  mark.dataset.mode = modes[mode];
  window.setInterval(() => {
    mode = (mode + 1) % modes.length;
    mark.dataset.mode = modes[mode];
  }, 2600);
})();


/* V25 — travelling signal impact: each station reacts exactly when the journey light reaches it. */
(function initSignalImpacts(){
  const spine=document.querySelector('.career-education-wrap > .journey-spine');
  const light=spine?.querySelector('i');
  if(!spine || !light) return;
  const stations=[...document.querySelectorAll('.education-section .edu-dot, .career-path .work-dot')].map(dot=>({
    dot,
    card:dot.closest('.edu-node')?.querySelector('.edu-card') || dot.closest('.career-card'),
    active:false
  }));
  const tick=()=>{
    const lr=light.getBoundingClientRect();
    const lx=lr.left+lr.width/2, ly=lr.top+lr.height/2;
    for(const station of stations){
      const r=station.dot.getBoundingClientRect();
      const dx=(r.left+r.width/2)-lx;
      const dy=(r.top+r.height/2)-ly;
      const hit=Math.hypot(dx,dy)<38;
      if(hit && !station.active){
        station.active=true;
        station.dot.classList.add('signal-hit');
        station.card?.classList.add('signal-card-hit');
      }else if(!hit && station.active){
        station.active=false;
        station.dot.classList.remove('signal-hit');
        station.card?.classList.remove('signal-card-hit');
      }
    }
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
})();
