// MyntraChoice shared client JS: product gallery, category sort, header search.

// ---------- product gallery ----------
(function gallery(){
  const g = document.querySelector(".gallery");
  if(!g) return;
  const slides = [...g.querySelectorAll(".slide")];
  const thumbs = [...g.querySelectorAll(".thumb")];
  let idx = 0;
  function show(i){
    idx = (i + slides.length) % slides.length;
    slides.forEach((s,k)=>s.classList.toggle("on", k===idx));
    thumbs.forEach((t,k)=>t.classList.toggle("on", k===idx));
    // pause any video when leaving its slide
    slides.forEach((s,k)=>{ const v=s.querySelector("video"); if(v && k!==idx) v.pause(); });
  }
  g.querySelectorAll(".cbtn").forEach(b=>b.onclick=()=>show(idx + Number(b.dataset.dir)));
  thumbs.forEach(t=>t.onclick=()=>show(Number(t.dataset.i)));
  document.addEventListener("keydown",e=>{
    if(e.key==="ArrowRight") show(idx+1);
    if(e.key==="ArrowLeft") show(idx-1);
  });
})();

// ---------- category sort ----------
(function sorter(){
  const sel = document.getElementById("sort");
  const grid = document.getElementById("catgrid");
  if(!sel || !grid) return;
  const cards = [...grid.children];
  const val = c => ({
    rating:  parseFloat(c.querySelector(".rating").textContent.replace(/[^0-9.].*/,"")) ,
    now:     parseInt(c.querySelector(".now").textContent.replace(/[^0-9]/g,"")),
    off:     (c.querySelector(".off") ? parseInt(c.querySelector(".off").textContent) : 0),
  });
  sel.onchange = () => {
    const s = sel.value;
    cards.sort((a,b)=>{
      const A=val(a), B=val(b);
      if(s==="rating")    return B.rating-A.rating;
      if(s==="discount")  return B.off-A.off;
      if(s==="priceLow")  return A.now-B.now;
      if(s==="priceHigh") return B.now-A.now;
      return 0;
    });
    cards.forEach(c=>grid.appendChild(c));
  };
})();

// ---------- search results page (/search.html?q=...) ----------
(function searchPage(){
  const grid = document.getElementById("searchResults");
  if(!grid) return; // only runs on /search.html
  const q = (new URLSearchParams(location.search).get("q") || "").trim();
  const input = document.getElementById("q");
  if(input) input.value = q;
  const title = document.getElementById("searchTitle");
  const count = document.getElementById("searchCount");
  const empty = document.getElementById("searchEmpty");
  const inr = n => "₹" + Number(n).toLocaleString("en-IN");
  if(!q){ empty.style.display = "block"; return; }
  title.textContent = `Search: “${q}”`;
  document.title = `“${q}” · MyntraChoice`;
  fetch("/data/search-index.json").then(r=>r.json()).then(data=>{
    const ql = q.toLowerCase();
    const hits = data.filter(p => (p.b + " " + p.n).toLowerCase().includes(ql));
    count.textContent = `${hits.length} result${hits.length !== 1 ? "s" : ""}`;
    if(!hits.length){
      empty.textContent = `No matches for “${q}”. Try a different brand or keyword.`;
      empty.style.display = "block";
      return;
    }
    grid.innerHTML = hits.slice(0, 240).map(p=>`<a class="card" href="/p/${p.i}.html">
        <div class="imgwrap"><img loading="lazy" src="${p.img}" onerror="this.style.opacity=.2"/></div>
        <div class="body"><div class="brand">${p.b}</div><div class="name">${p.n}</div>
        <div class="price"><span class="now">${inr(p.p)}</span></div></div></a>`).join("");
  }).catch(()=>{ empty.textContent = "Could not load results."; empty.style.display = "block"; });
})();

// ---------- mega-menu header ----------
(function megamenu(){
  const body = document.body;
  const isMobile = () => window.matchMedia("(max-width:820px)").matches;

  // desktop: dim backdrop while hovering a nav item (hover-intent)
  const nav = document.querySelector(".mainnav");
  let hideT;
  document.querySelectorAll(".navitem").forEach(item=>{
    item.addEventListener("mouseenter", ()=>{ if(isMobile()) return; clearTimeout(hideT); body.classList.add("menu-open"); });
    item.addEventListener("mouseleave", ()=>{ if(isMobile()) return; hideT = setTimeout(()=>body.classList.remove("menu-open"), 120); });
    // mobile: tap top link toggles accordion instead of navigating
    const top = item.querySelector(".navtop");
    top.addEventListener("click", e=>{
      if(!isMobile()) return;
      e.preventDefault();
      const open = item.classList.contains("open");
      document.querySelectorAll(".navitem").forEach(i=>i.classList.remove("open"));
      item.classList.toggle("open", !open);
    });
  });
  const backdrop = document.querySelector(".megabackdrop");
  if(backdrop) backdrop.addEventListener("click", ()=>{ body.classList.remove("menu-open","nav-open"); });

  // mobile drawer toggle
  const burger = document.querySelector(".burger");
  if(burger){
    burger.addEventListener("click", ()=>{
      const open = body.classList.toggle("nav-open");
      body.classList.toggle("menu-open", open);
    });
  }
  // close drawer when a real link is tapped
  document.querySelectorAll(".mega a, .navtop.on").forEach(a=>a.addEventListener("click", ()=>{
    if(isMobile()) body.classList.remove("nav-open","menu-open");
  }));
  addEventListener("keydown", e=>{ if(e.key==="Escape") body.classList.remove("menu-open","nav-open"); });
})();

// ---------- motion layer (React Bits vibe, vanilla) ----------
(function motion(){
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if(reduce) return;
  document.documentElement.classList.add("motion");

  // scroll reveal with per-container stagger
  const groups = [
    ...document.querySelectorAll(".grid"),
    ...document.querySelectorAll(".cattiles"),
  ];
  const singles = [
    document.querySelector(".showcase-copy"), document.querySelector(".collage"),
    document.querySelector(".gallery"), document.querySelector(".pinfo"),
    ...document.querySelectorAll(".rail-sec"), ...document.querySelectorAll(".secttl"),
    document.querySelector(".bento"), document.querySelector(".trust"),
  ].filter(Boolean);
  const io = new IntersectionObserver((entries)=>{
    entries.forEach(e=>{ if(e.isIntersecting){ e.target.classList.add("in"); io.unobserve(e.target); } });
  }, {threshold:0.08, rootMargin:"0px 0px -40px 0px"});
  singles.forEach(el=>{ el.classList.add("reveal"); io.observe(el); });
  groups.forEach(g=>{
    [...g.children].forEach((child,i)=>{
      child.classList.add("reveal");
      child.style.setProperty("--d", Math.min(i,8)*60 + "ms");
      io.observe(child);
    });
  });

  // pointer spotlight + subtle tilt on cards/tiles
  const tilters = document.querySelectorAll(".card, .cattile");
  tilters.forEach(el=>{
    el.addEventListener("pointermove", ev=>{
      const r = el.getBoundingClientRect();
      const px = (ev.clientX - r.left)/r.width, py = (ev.clientY - r.top)/r.height;
      el.style.setProperty("--mx", px*100+"%");
      el.style.setProperty("--my", py*100+"%");
      const rx = (0.5 - py)*6, ry = (px - 0.5)*6;
      el.style.transform = `perspective(700px) rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg) translateY(-3px)`;
    });
    el.addEventListener("pointerleave", ()=>{ el.style.transform = ""; });
  });

  // horizontal rail scroll buttons
  document.querySelectorAll(".rail-sec").forEach(sec=>{
    const rail = sec.querySelector(".rail");
    const l = sec.querySelector(".railbtn.l"), r = sec.querySelector(".railbtn.r");
    if(!rail || !l || !r) return;
    const step = () => Math.max(rail.clientWidth * 0.8, 260);
    l.addEventListener("click", ()=> rail.scrollBy({left:-step(), behavior:"smooth"}));
    r.addEventListener("click", ()=> rail.scrollBy({left: step(), behavior:"smooth"}));
  });

  // shrinking header
  const header = document.querySelector("header");
  if(header){
    const onScroll = ()=> header.classList.toggle("scrolled", window.scrollY > 8);
    onScroll(); window.addEventListener("scroll", onScroll, {passive:true});
  }

  // click spark
  addEventListener("pointerdown", ev=>{
    const n = 8;
    for(let i=0;i<n;i++){
      const s = document.createElement("span");
      s.className = "spark";
      s.style.left = ev.clientX+"px"; s.style.top = ev.clientY+"px";
      document.body.appendChild(s);
      const ang = (i/n)*Math.PI*2, dist = 22+Math.random()*14;
      s.animate([
        {transform:"translate(-50%,-50%) scale(1)", opacity:1},
        {transform:`translate(${Math.cos(ang)*dist-50}%, ${Math.sin(ang)*dist-50}%) scale(0)`, opacity:0}
      ], {duration:460, easing:"cubic-bezier(.2,.7,.2,1)"}).onfinish = ()=> s.remove();
    }
  }, {passive:true});
})();
