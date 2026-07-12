/* ════════════════════════════════════════════════════════
   1. THE MONSTER EYE — canvas render, iris tracks cursor,
      organic blinking, pulsing red glow
   ════════════════════════════════════════════════════════ */
(() => {
  const cv = document.getElementById("eyeCanvas");
  const ctx = cv.getContext("2d");
  let W, H, cx, cy, R;

  const fit = () => {
    W = cv.width = innerWidth; H = cv.height = innerHeight;
    cx = W / 2; cy = H * 0.42;
    R = Math.min(W, H) * 0.22;               // eye radius scales to viewport
  };
  fit(); addEventListener("resize", fit);

  const mouse = { x: 0, y: 0 }, iris = { x: 0, y: 0 };
  addEventListener("pointermove", (e) => {
    mouse.x = e.clientX; mouse.y = e.clientY;
  });

  let blink = 1;            // 1 = open, 0 = shut
  let nextBlink = 2000;

  function draw(t) {
    ctx.clearRect(0, 0, W, H);
    const pulse = 1 + Math.sin(t / 900) * 0.06;

    // --- outer glow
    let g = ctx.createRadialGradient(cx, cy, R * 0.2, cx, cy, R * 2.6);
    g.addColorStop(0, `rgba(255,31,61,${0.28 * pulse})`);
    g.addColorStop(0.5, "rgba(120,10,30,0.10)");
    g.addColorStop(1, "transparent");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    // --- sclera (eye shape = lens of two arcs), squashed by blink
    const open = R * 0.55 * blink;
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(cx - R, cy);
    ctx.quadraticCurveTo(cx, cy - open * 2, cx + R, cy);
    ctx.quadraticCurveTo(cx, cy + open * 2, cx - R, cy);
    ctx.closePath();
    g = ctx.createRadialGradient(cx, cy, 0, cx, cy, R);
    g.addColorStop(0, "#2a0208");
    g.addColorStop(0.75, "#12020a");
    g.addColorStop(1, "#000");
    ctx.fillStyle = g;
    ctx.fill();
    ctx.clip(); // iris stays inside the lids

    // --- iris tracking: angle + clamped distance toward cursor
    const dx = mouse.x - cx, dy = mouse.y - cy;
    const dist = Math.min(Math.hypot(dx, dy) / 8, R * 0.42);
    const ang = Math.atan2(dy, dx);
    iris.x += (cx + Math.cos(ang) * dist - iris.x) * 0.08; // lerp = alive feel
    iris.y += (cy + Math.sin(ang) * dist * 0.6 - iris.y) * 0.08;

    // iris
    const ir = R * 0.34;
    g = ctx.createRadialGradient(iris.x, iris.y, ir * 0.1, iris.x, iris.y, ir);
    g.addColorStop(0, "#ff5470");
    g.addColorStop(0.4, "#ff1f3d");
    g.addColorStop(0.8, "#7a0018");
    g.addColorStop(1, "#30000a");
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(iris.x, iris.y, ir, 0, 7); ctx.fill();

    // radial iris fibres
    ctx.strokeStyle = "rgba(255,80,100,.25)";
    for (let i = 0; i < 26; i++) {
      const a = (i / 26) * Math.PI * 2 + t / 4000;
      ctx.beginPath();
      ctx.moveTo(iris.x + Math.cos(a) * ir * 0.3, iris.y + Math.sin(a) * ir * 0.3);
      ctx.lineTo(iris.x + Math.cos(a) * ir * 0.95, iris.y + Math.sin(a) * ir * 0.95);
      ctx.stroke();
    }

    // slit pupil (monster) + specular highlight
    ctx.fillStyle = "#000";
    ctx.beginPath();
    ctx.ellipse(iris.x, iris.y, ir * 0.16 * pulse, ir * 0.72, 0, 0, 7);
    ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,.85)";
    ctx.beginPath(); ctx.arc(iris.x - ir * 0.3, iris.y - ir * 0.35, ir * 0.09, 0, 7); ctx.fill();
    ctx.restore();

    // --- blink state machine
    nextBlink -= 16;
    if (nextBlink <= 0) {
      blink = Math.max(0, blink - 0.18);
      if (blink === 0) nextBlink = 120;                       // hold shut briefly
    } else if (blink < 1) {
      blink = Math.min(1, blink + 0.12);
      if (blink === 1) nextBlink = 2200 + Math.random() * 3500; // random cadence
    }

    requestAnimationFrame(draw);
  }
  requestAnimationFrame(draw);
})();

/* ════════════════════════════════════════════════════════
   2. SPIDERMAN INTRO — GSAP master timeline
      drop → pause → wave → snap back up → reveal site
   ════════════════════════════════════════════════════════ */
gsap.registerPlugin(ScrollTrigger);

const intro = gsap.timeline({
  defaults: { ease: "power2.out" },
  onComplete: revealSite
});

intro
  // web string shoots down
  .to("#webString", { height: "42vh", duration: 0.7, ease: "power3.in" })
  // spidey drops with elastic settle (like real web tension)
  .to("#spidey", { y: "42vh", duration: 1.1, ease: "elastic.out(1, 0.45)" }, "-=0.55")
  // gentle sway while hanging
  .to("#spidey", { rotation: 6, duration: 0.5, yoyo: true, repeat: 3, transformOrigin: "top center", ease: "sine.inOut" }, "-=0.3")
  // the hello wave
  .to(".spidey__hand", { opacity: 1, duration: 0.2 })
  .to(".spidey__hand", { rotation: 24, duration: 0.18, yoyo: true, repeat: 5, ease: "sine.inOut" })
  .to(".spidey__hand", { opacity: 0, duration: 0.2 })
  // quick yank back out of viewport
  .to("#spidey",   { y: "-160px", duration: 0.45, ease: "back.in(1.6)" })
  .to("#webString",{ height: 0, duration: 0.35, ease: "power3.in" }, "-=0.4")
  .to("#intro",    { opacity: 0, duration: 0.3, onComplete: () => document.getElementById("intro").remove() });

function revealSite() {
  const site = document.getElementById("site");
  site.classList.remove("is-hidden");
  gsap.from("#site > *", { opacity: 0, y: 40, duration: 1, stagger: 0.08, ease: "power3.out" });

  // counters
  document.querySelectorAll("[data-count]").forEach((el) => {
    gsap.to(el, { innerText: el.dataset.count, duration: 2, snap: { innerText: 1 }, ease: "power1.out" });
  });

  // arsenal bars fill on scroll
  document.querySelectorAll(".skill").forEach((s) => {
    gsap.to(s.querySelector(".skill__bar span"), {
      width: s.dataset.lvl + "%", duration: 1.4, ease: "power3.out",
      scrollTrigger: { trigger: s, start: "top 85%" }
    });
  });
}

/* ════════════════════════════════════════════════════════
   3. THE VAULT — 54 generated projects, masonry, Load More,
      delegated 3D glassmorphism tilt
   ════════════════════════════════════════════════════════ */
const TYPES = [
  ["WordPress Build", "fa-brands fa-wordpress"], ["Shopify Store", "fa-brands fa-shopify"],
  ["React App", "fa-brands fa-react"], ["Node.js API", "fa-brands fa-node-js"], ["UI/UX System", "fa-solid fa-pen-ruler"]
];
const SECTORS = ["Fashion", "Fintech", "SaaS", "Beauty", "Automotive", "Real Estate", "Health", "Gaming", "Food", "Education", "Logistics", "Luxury"];

const PROJECTS = Array.from({ length: 54 }, (_, i) => {
  const [type] = TYPES[i % TYPES.length];
  const sector = SECTORS[i % SECTORS.length];
  return {
    title: `${sector} ${type.split(" ")[0]} #${String(i + 1).padStart(2, "0")}`,
    desc: `${type} for a ${sector.toLowerCase()} client — performance-tuned, conversion-focused, shipped to production.`,
    tag: type,
    hue: (i * 47) % 360,
    h: 140 + ((i * 37) % 3) * 60      // varied heights → true masonry rhythm
  };
});

const grid = document.getElementById("vaultGrid");
const BATCH = 9;
let shown = 0;

function loadBatch() {
  const frag = document.createDocumentFragment();
  PROJECTS.slice(shown, shown + BATCH).forEach((p) => {
    const card = document.createElement("article");
    card.className = "pcard";
    card.innerHTML = `
      <div class="pcard__thumb" style="--h:${p.hue}; height:${p.h}px">${p.title.toUpperCase()}</div>
      <div class="pcard__body"><h3>${p.title}</h3><p>${p.desc}</p><span class="tag">${p.tag}</span></div>`;
    frag.appendChild(card);
  });
  grid.appendChild(frag);
  gsap.to(grid.querySelectorAll(".pcard:not(.in)"), {
    opacity: 1, y: 0, duration: 0.7, stagger: 0.05, ease: "power3.out",
    onStart() { this.targets().forEach((c) => c.classList.add("in")); }
  });
  shown += BATCH;
  if (shown >= PROJECTS.length) document.getElementById("loadMore").remove();
}
loadBatch();
document.getElementById("loadMore").addEventListener("click", loadBatch);

/* Delegated 3D tilt — one listener serves all 54 cards */
grid.addEventListener("pointermove", (e) => {
  const card = e.target.closest(".pcard");
  if (!card) return;
  const r = card.getBoundingClientRect();
  const rx = ((e.clientY - r.top) / r.height - 0.5) * -14;
  const ry = ((e.clientX - r.left) / r.width - 0.5) * 14;
  gsap.to(card, { rotateX: rx, rotateY: ry, scale: 1.04, boxShadow: "0 30px 60px rgba(0,240,255,.12)", duration: 0.35, ease: "power2.out" });
});
grid.addEventListener("pointerout", (e) => {
  const card = e.target.closest(".pcard");
  if (card && !card.contains(e.relatedTarget))
    gsap.to(card, { rotateX: 0, rotateY: 0, scale: 1, boxShadow: "none", duration: 0.6, ease: "elastic.out(1,.5)" });
});

/* ════════════════════════════════════════════════════════
   4. TESTIMONIALS — auto-playing carousel
   ════════════════════════════════════════════════════════ */
const REVIEWS = [
  { q: "Mohamed rebuilt our WooCommerce platform and revenue jumped 42% in one quarter. Surgical precision.", by: "SARAH K.", role: "CEO — Luxe Fashion Group", stars: 5 },
  { q: "The fastest Shopify store we've ever launched. He thinks like an architect, not a coder.", by: "DANIEL R.", role: "Founder — Aura Tech", stars: 5 },
  { q: "Our React dashboard went from prototype to production in 6 weeks. Flawless communication, elite output.", by: "LINA M.", role: "CTO — FinPulse", stars: 5 },
  { q: "Worth every dollar of a five-figure budget. This is what senior actually means.", by: "OMAR T.", role: "Director — Skyline Realty", stars: 5 }
];

const track = document.getElementById("carouselTrack");
const dots = document.getElementById("carouselDots");
REVIEWS.forEach((r, i) => {
  track.insertAdjacentHTML("beforeend", `
    <div class="slide">
      <div class="stars">${"★".repeat(r.stars)}</div>
      <blockquote>“${r.q}”</blockquote>
      <cite>${r.by}<small>${r.role}</small></cite>
    </div>`);
  dots.insertAdjacentHTML("beforeend", `<button data-i="${i}" aria-label="Slide ${i + 1}"></button>`);
});

let cur = 0, timer;
function go(i) {
  cur = (i + REVIEWS.length) % REVIEWS.length;
  track.style.transform = `translateX(-${cur * 100}%)`;
  dots.querySelectorAll("button").forEach((d, j) => d.classList.toggle("on", j === cur));
}
function autoplay() { timer = setInterval(() => go(cur + 1), 4500); }
dots.addEventListener("click", (e) => {
  if (!e.target.dataset.i) return;
  clearInterval(timer); go(+e.target.dataset.i); autoplay();
});
go(0); autoplay();

/* ════════════════════════════════════════════════════════
   5. THE WHATSAPP CONTRACT — form → wa.me redirect
   ════════════════════════════════════════════════════════ */
const WA = "201128182537";

document.getElementById("contractForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const name = document.getElementById("cName").value.trim();
  const budget = document.getElementById("cBudget").value;
  const type = document.getElementById("cType").value.trim();
  const msg = document.getElementById("cMsg").value.trim();

  if (!name || !msg) {
    gsap.fromTo("#contractForm", { x: -10 }, { x: 0, duration: 0.5, ease: "elastic.out(1,.3)" });
    return;
  }

  const text =
    `⚡ *NEW CONTRACT REQUEST*\n\n` +
    `👤 *Name:* ${name}\n` +
    `🎯 *Mission:* ${type || "Not specified"}\n` +
    `💰 *Budget:* ${budget}\n\n` +
    `📜 *Briefing:*\n${msg}\n\n` +
    `— Sent from the portfolio of ing.Mohamed Ahmed`;

  window.open(`https://wa.me/${WA}?text=${encodeURIComponent(text)}`, "_blank", "noopener");
});
