(()=>{document.querySelectorAll('[data-dl-sensing]').forEach(root=>{
 if(root.dataset.ready)return;root.dataset.ready='true';
 const reduce=matchMedia('(prefers-reduced-motion: reduce)');
 const nodes=[...root.querySelectorAll('.ds-live')].map(el=>({el,start:+el.dataset.start,duration:+el.dataset.duration,x:+el.dataset.x,w:+el.dataset.w,length:el.classList.contains('ds-signal')?el.getTotalLength():0}));
 const clamp=x=>Math.max(0,Math.min(1,x));
 let raf=0,last=null,clock=0,outside=false;
 function render(t){
  const reset=clamp((t-11.25)/.75);
  nodes.forEach(n=>{const p=(t-n.start)/n.duration,el=n.el;
   if(el.classList.contains('ds-wipe')){const progress=clamp(p)*(1-reset);el.setAttribute('x',n.x+n.w*progress);el.setAttribute('width',n.w*(1-progress));return;}
   if(el.classList.contains('ds-tile')){el.setAttribute('opacity',1-clamp(p)*(1-reset));return;}
   const active=p>0&&p<1;
   if(el.classList.contains('ds-signal')){el.setAttribute('stroke-dasharray',`16 ${n.length+20}`);el.setAttribute('stroke-dashoffset',String(-clamp(p)*n.length));el.setAttribute('opacity',active?Math.min(1,p*8,(1-p)*8):0);return;}
   el.setAttribute('opacity',active?Math.sin(p*Math.PI)*(el.classList.contains('ds-layer')?.65:.95):0);
  });
 }
 function frame(now){if(last!==null)clock+=(now-last)/1000;last=now;render(clock%12);raf=requestAnimationFrame(frame);}
 function update(){const active=!reduce.matches&&!document.hidden&&!outside;root.dataset.active=String(!reduce.matches);if(active&&!raf){last=null;render(clock%12);raf=requestAnimationFrame(frame);}else if(!active&&raf){cancelAnimationFrame(raf);raf=0;last=null;}}
 reduce.addEventListener('change',update);document.addEventListener('visibilitychange',update);
 if('IntersectionObserver'in window)new IntersectionObserver(entries=>{outside=!entries[0].isIntersecting;update()},{threshold:0}).observe(root);
 update();
})})();