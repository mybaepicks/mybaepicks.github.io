// MyBae Picks shared client JS: product gallery, category sort, header search.

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

// ---------- category filter + sort (whole-category, via /data/cat/<slug>.json) ----------
(function sorter(){
  const sortSel  = document.getElementById("sort");
  const brandSel = document.getElementById("brandFilter");
  const grid = document.getElementById("catgrid");
  if(!sortSel || !grid) return;
  const slug = grid.dataset.slug;
  const serverHTML = grid.innerHTML;                       // original SEO grid
  const pageNav = document.querySelector(".pagination");
  const moreWrap = document.getElementById("showmore-wrap");
  const PAGE = 48;
  let data = null, view = [], shown = 0;

  const inr = n => "₹" + Number(n).toLocaleString("en-IN");
  const cardHTML = p => {
    const off = p.off ? `<div class="off">${p.off}% OFF</div>` : "";
    const vid = p.vid ? `<span class="vbadge">▶</span>` : "";
    const mrp = p.mrp > p.price ? `<span class="mrp">${inr(p.mrp)}</span><span class="pct">${p.off}% off</span>` : "";
    return `<a class="card" href="/p/${p.id}.html">
      <div class="imgwrap">
        <img loading="lazy" src="${p.img}" alt="${(p.b+" "+p.n).replace(/"/g,'&quot;')}" onerror="this.style.opacity=.2"/>
        <div class="rating"><span class="s">★</span>${p.r.toFixed(1)} <span class="n">| ${Number(p.rc).toLocaleString("en-IN")}</span></div>
        ${off}${vid}
      </div>
      <div class="body">
        <div class="brand">${p.b}</div>
        <div class="name">${p.n}</div>
        <div class="price"><span class="now">${inr(p.price)}</span>${mrp}</div>
      </div>
    </a>`;
  };

  const isDefault = () => (!brandSel || !brandSel.value) && sortSel.value === "rating";

  const restoreServer = () => {
    grid.innerHTML = serverHTML;
    if(pageNav) pageNav.style.display = "";
    if(moreWrap) moreWrap.innerHTML = "";
  };

  const renderMore = () => {
    const next = view.slice(shown, shown + PAGE);
    grid.insertAdjacentHTML("beforeend", next.map(cardHTML).join(""));
    shown += next.length;
    if(moreWrap){
      moreWrap.innerHTML = shown < view.length
        ? `<button class="hero-cta" id="showmore">Show more (${view.length - shown} left)</button>` : "";
      const b = document.getElementById("showmore");
      if(b) b.onclick = renderMore;
    }
  };

  const apply = () => {
    if(isDefault()){ restoreServer(); return; }
    const s = sortSel.value, brand = brandSel ? brandSel.value : "";
    view = data.filter(p => !brand || p.b === brand);
    view.sort((a,b)=>{
      if(s==="rating")    return b.r-a.r || b.rc-a.rc;
      if(s==="mostRated") return b.rc-a.rc;
      if(s==="discount")  return b.off-a.off;
      if(s==="priceLow")  return a.price-b.price;
      if(s==="priceHigh") return b.price-a.price;
      return 0;
    });
    if(pageNav) pageNav.style.display = "none";
    grid.innerHTML = ""; shown = 0;
    renderMore();
  };

  const onChange = () => {
    if(isDefault()){ restoreServer(); return; }
    if(data){ apply(); return; }
    grid.style.opacity = ".5";
    fetch(`/data/cat/${slug}.json`).then(r=>r.json()).then(d=>{ data=d; grid.style.opacity=""; apply(); })
      .catch(()=>{ grid.style.opacity=""; });
  };

  sortSel.addEventListener("change", onChange);
  if(brandSel) brandSel.addEventListener("change", onChange);
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
  document.title = `“${q}” · MyBae Picks`;
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

// ---------- auto-scrolling rail (Best Picks) ----------
(function autoRail(){
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  document.querySelectorAll(".rail.autorail").forEach(rail=>{
    let paused = false, resumeT = null;
    const SPEED = 1.2; // px per frame
    const pause = () => { paused = true; clearTimeout(resumeT); };
    const resumeSoon = (ms=1400) => { clearTimeout(resumeT); resumeT = setTimeout(()=>{ paused = false; }, ms); };

    // TOUCH: let the browser handle native horizontal scrolling; just pause the
    // auto-advance while the finger is down and for a moment after (momentum).
    rail.addEventListener("touchstart", pause, {passive:true});
    rail.addEventListener("touchend",  ()=>resumeSoon(), {passive:true});
    rail.addEventListener("touchcancel",()=>resumeSoon(), {passive:true});

    // MOUSE: hover pauses; click-drag scrolls (desktop only)
    let dragging = false, startX = 0, startScroll = 0, moved = false;
    rail.addEventListener("mouseenter", pause);
    rail.addEventListener("mouseleave", ()=>{ if(!dragging){ clearTimeout(resumeT); paused = false; } });
    rail.addEventListener("mousedown", e=>{
      dragging = true; moved = false; paused = true; clearTimeout(resumeT);
      startX = e.clientX; startScroll = rail.scrollLeft; e.preventDefault();
    });
    window.addEventListener("mousemove", e=>{
      if(!dragging) return;
      const dx = e.clientX - startX; if(Math.abs(dx) > 4) moved = true;
      rail.scrollLeft = startScroll - dx;
    });
    window.addEventListener("mouseup", ()=>{ if(dragging){ dragging = false; paused = false; } });
    rail.addEventListener("click", e=>{ if(moved){ e.preventDefault(); e.stopPropagation(); } }, true);

    if(reduce) return; // no auto-motion for reduced-motion users
    // items are duplicated (set A + set A). Loop distance = width of one set,
    // measured precisely from where the second copy begins so the wrap is seamless.
    const cards = rail.querySelectorAll(".card");
    const loopWidth = () => cards.length >= 2
      ? cards[cards.length / 2].offsetLeft - cards[0].offsetLeft
      : rail.scrollWidth / 2;
    function tick(){
      if(!paused){
        rail.scrollLeft += SPEED;
        const w = loopWidth();
        // wrap in both directions so drag + auto stay in the infinite range
        if(rail.scrollLeft >= w) rail.scrollLeft -= w;
        else if(rail.scrollLeft < 0) rail.scrollLeft += w;
      }
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  });
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
    // mobile: tap gender toggles its accordion (level 1)
    const top = item.querySelector(".navtop");
    top.addEventListener("click", e=>{
      if(!isMobile()) return;
      e.preventDefault();
      const open = item.classList.contains("open");
      document.querySelectorAll(".navitem").forEach(i=>{ i.classList.remove("open"); i.querySelectorAll(".col.open").forEach(c=>c.classList.remove("open")); });
      item.classList.toggle("open", !open);
    });
    // mobile: tap a group heading toggles its category list (level 2)
    item.querySelectorAll(".mega .col h4").forEach(h4=>{
      h4.addEventListener("click", e=>{
        if(!isMobile()) return;
        e.preventDefault(); e.stopPropagation();
        const col = h4.parentElement;
        const wasOpen = col.classList.contains("open");
        item.querySelectorAll(".col.open").forEach(c=>c.classList.remove("open"));
        col.classList.toggle("open", !wasOpen);
      });
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

  // mobile search icon toggles the search field
  const stoggle = document.querySelector(".search-toggle");
  if(stoggle){
    stoggle.addEventListener("click", ()=>{
      const open = body.classList.toggle("search-open");
      stoggle.setAttribute("aria-expanded", String(open));
      if(open){ const inp = document.getElementById("q"); if(inp) setTimeout(()=>inp.focus(), 60); }
    });
  }
  addEventListener("keydown", e=>{ if(e.key==="Escape") body.classList.remove("menu-open","nav-open","search-open"); });
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
