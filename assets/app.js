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

// ---------- header search ----------
(function search(){
  const input = document.getElementById("q");
  const results = document.getElementById("results");
  if(!input || !results) return;
  let index = null;
  const inr = n => "₹" + Number(n).toLocaleString("en-IN");
  async function load(){
    if(index) return index;
    index = await fetch("/data/search-index.json").then(r=>r.json()).catch(()=>[]);
    return index;
  }
  let t;
  input.addEventListener("input", ()=>{
    clearTimeout(t);
    t = setTimeout(async ()=>{
      const q = input.value.toLowerCase().trim();
      if(!q){ results.style.display="none"; results.innerHTML=""; return; }
      const data = await load();
      const hits = data.filter(p => (p.b+" "+p.n).toLowerCase().includes(q)).slice(0,24);
      results.innerHTML = hits.length
        ? hits.map(p=>`<a class="card" href="/p/${p.i}.html">
            <div class="imgwrap"><img loading="lazy" src="${p.img}" onerror="this.style.opacity=.2"/></div>
            <div class="body"><div class="brand">${p.b}</div><div class="name">${p.n}</div>
            <div class="price"><span class="now">${inr(p.p)}</span></div></div></a>`).join("")
        : `<p style="color:#6b6b6b;padding:10px">No matches for “${q.replace(/</g,"")}”.</p>`;
      results.style.display = "grid";
      window.scrollTo({top:0, behavior:"instant"});
    }, 160);
  });
})();
