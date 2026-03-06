/* ═══════════════════════════════════════════
   DORKGIRL — Scroll-Driven Product Landing Page
   Video: BlenderKling.mp4  |  241 frames @ 24fps
═══════════════════════════════════════════ */

const FRAME_COUNT  = 241;
const FRAME_SPEED  = 2.0;    // 1.8-2.2: higher = animation finishes earlier
const IMAGE_SCALE  = 0.88;   // padded cover (0.82-0.90)
const FRAMES_DIR   = 'frames/';

// ── DOM refs ──────────────────────────────
const loader        = document.getElementById('loader');
const loaderBar     = document.getElementById('loader-bar');
const loaderPercent = document.getElementById('loader-percent');
const header        = document.getElementById('site-header');
const heroSection   = document.getElementById('hero');
const canvasWrap    = document.getElementById('canvas-wrap');
const canvas        = document.getElementById('canvas');
const ctx           = canvas.getContext('2d');
const darkOverlay   = document.getElementById('dark-overlay');
const marqueeWrap   = document.getElementById('marquee');
const scrollContainer = document.getElementById('scroll-container');

// ── State ─────────────────────────────────
const frames = new Array(FRAME_COUNT).fill(null);
let currentFrame = 0;
let bgColor = '#000000';
let lenis;

// ═══════════════════════════════════════════
// CANVAS SETUP
// ═══════════════════════════════════════════
function resizeCanvas() {
  const dpr = window.devicePixelRatio || 1;
  canvas.width  = window.innerWidth  * dpr;
  canvas.height = window.innerHeight * dpr;
  canvas.style.width  = window.innerWidth  + 'px';
  canvas.style.height = window.innerHeight + 'px';
  ctx.scale(dpr, dpr);
  drawFrame(currentFrame);
}

window.addEventListener('resize', resizeCanvas);

// ═══════════════════════════════════════════
// BACKGROUND COLOR SAMPLER
// ═══════════════════════════════════════════
function sampleBgColor(img) {
  const tmp = document.createElement('canvas');
  tmp.width = tmp.height = 4;
  const tc = tmp.getContext('2d');
  tc.drawImage(img, 0, 0, 4, 4);
  const d = tc.getImageData(0, 0, 1, 1).data;
  bgColor = `rgb(${d[0]},${d[1]},${d[2]})`;
}

// ═══════════════════════════════════════════
// FRAME RENDERER
// ═══════════════════════════════════════════
function drawFrame(index) {
  const img = frames[index];
  if (!img) return;

  const cw = window.innerWidth;
  const ch = window.innerHeight;
  const iw = img.naturalWidth;
  const ih = img.naturalHeight;

  const scale = Math.max(cw / iw, ch / ih) * IMAGE_SCALE;
  const dw = iw * scale;
  const dh = ih * scale;
  const dx = (cw - dw) / 2;
  const dy = (ch - dh) / 2;

  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, cw, ch);
  ctx.drawImage(img, dx, dy, dw, dh);
}

// ═══════════════════════════════════════════
// FRAME PRELOADER (two-phase)
// ═══════════════════════════════════════════
function loadFrames() {
  return new Promise((resolve) => {
    let loaded = 0;

    function onLoad(img, index) {
      frames[index] = img;
      loaded++;

      if (index % 20 === 0) sampleBgColor(img);

      const pct = Math.round((loaded / FRAME_COUNT) * 100);
      loaderBar.style.width = pct + '%';
      loaderPercent.textContent = pct + '%';

      if (loaded === FRAME_COUNT) resolve();
    }

    // Phase 1: Load first 10 frames immediately
    for (let i = 0; i < Math.min(10, FRAME_COUNT); i++) {
      const img = new Image();
      const num = String(i + 1).padStart(4, '0');
      img.onload = () => { onLoad(img, i); if (i === 0) { drawFrame(0); } };
      img.onerror = () => { loaded++; if (loaded === FRAME_COUNT) resolve(); };
      img.src = `${FRAMES_DIR}frame_${num}.webp`;
    }

    // Phase 2: Load remaining frames
    for (let i = 10; i < FRAME_COUNT; i++) {
      const img = new Image();
      const num = String(i + 1).padStart(4, '0');
      img.onload = () => onLoad(img, i);
      img.onerror = () => { loaded++; if (loaded === FRAME_COUNT) resolve(); };
      img.src = `${FRAMES_DIR}frame_${num}.webp`;
    }
  });
}

// ═══════════════════════════════════════════
// HERO ANIMATION (word stagger)
// ═══════════════════════════════════════════
function animateHero() {
  const tl = gsap.timeline({ delay: 0.2 });
  tl.to('.hero-eyebrow', { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out' })
    .to('.hero-word', { opacity: 1, y: 0, stagger: 0.12, duration: 1.0, ease: 'power3.out' }, '-=0.4')
    .to('.hero-tagline', { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out' }, '-=0.5');
  header.classList.add('visible');
}

// ═══════════════════════════════════════════
// HERO → CANVAS CIRCLE-WIPE TRANSITION
// ═══════════════════════════════════════════
function initHeroTransition() {
  ScrollTrigger.create({
    trigger: scrollContainer,
    start: 'top top',
    end: 'bottom bottom',
    scrub: true,
    onUpdate: (self) => {
      const p = self.progress;

      // Hero fades out fast as scroll begins
      heroSection.style.opacity = Math.max(0, 1 - p * 20);
      heroSection.style.pointerEvents = p > 0.05 ? 'none' : 'auto';

      // Canvas circle-wipe reveal
      const wipeP = Math.min(1, Math.max(0, (p - 0.01) / 0.07));
      const radius = wipeP * 80;
      canvasWrap.style.clipPath = `circle(${radius}% at 50% 50%)`;
    }
  });
}

// ═══════════════════════════════════════════
// FRAME → SCROLL BINDING
// ═══════════════════════════════════════════
function initFrameScrub() {
  ScrollTrigger.create({
    trigger: scrollContainer,
    start: 'top top',
    end: 'bottom bottom',
    scrub: true,
    onUpdate: (self) => {
      const accelerated = Math.min(self.progress * FRAME_SPEED, 1);
      const index = Math.min(Math.floor(accelerated * FRAME_COUNT), FRAME_COUNT - 1);
      if (index !== currentFrame) {
        currentFrame = index;
        requestAnimationFrame(() => drawFrame(currentFrame));
      }
    }
  });
}

// ═══════════════════════════════════════════
// SECTION ANIMATION SYSTEM
// ═══════════════════════════════════════════
function setupSectionAnimation(section) {
  const type    = section.dataset.animation;
  const persist = section.dataset.persist === 'true';
  const enter   = parseFloat(section.dataset.enter) / 100;
  const leave   = parseFloat(section.dataset.leave) / 100;
  const totalH  = scrollContainer.offsetHeight;
  const vpH     = window.innerHeight;

  // Position so section is vertically centered in viewport at midpoint of its scroll window
  // At midPct scroll progress: scrollY = vpH_hero + midPct*(totalH-vpH)
  // Section center in viewport = scrollY + vpH/2
  // Section center in doc = that + 0 (since section is relative to scroll-container which starts after hero)
  // Within scroll-container: topPx = midPct*(totalH-vpH) + vpH/2
  const midPct = (enter + leave) / 2;
  const topPx  = midPct * (totalH - vpH) + vpH / 2;
  section.style.top            = topPx + 'px';
  section.style.transform      = 'translateY(-50%)';
  section.style.position       = 'absolute';
  section.style.width          = '100%';

  // Stats section: center vertically
  if (section.classList.contains('section-stats')) {
    section.style.transform = 'translateY(-50%)';
  }

  const children = section.querySelectorAll(
    '.section-label, .section-heading, .section-body, .section-note, .cta-button, .cta-note, .stat'
  );

  const ir = { immediateRender: false }; // prevent GSAP hiding children on creation
  const tl = gsap.timeline({ paused: true });

  switch (type) {
    case 'fade-up':
      tl.from(children, { y: 50, opacity: 0, stagger: 0.12, duration: 0.9, ease: 'power3.out', ...ir });
      break;
    case 'slide-left':
      tl.from(children, { x: -80, opacity: 0, stagger: 0.14, duration: 0.9, ease: 'power3.out', ...ir });
      break;
    case 'slide-right':
      tl.from(children, { x: 80, opacity: 0, stagger: 0.14, duration: 0.9, ease: 'power3.out', ...ir });
      break;
    case 'scale-up':
      tl.from(children, { scale: 0.85, opacity: 0, stagger: 0.12, duration: 1.0, ease: 'power2.out', ...ir });
      break;
    case 'rotate-in':
      tl.from(children, { y: 40, rotation: 3, opacity: 0, stagger: 0.1, duration: 0.9, ease: 'power3.out', ...ir });
      break;
    case 'stagger-up':
      tl.from(children, { y: 60, opacity: 0, stagger: 0.15, duration: 0.8, ease: 'power3.out', ...ir });
      break;
    case 'clip-reveal':
      tl.from(children, {
        clipPath: 'inset(100% 0 0 0)',
        opacity: 0,
        stagger: 0.15,
        duration: 1.2,
        ease: 'power4.inOut',
        ...ir
      });
      break;
    default:
      tl.from(children, { y: 40, opacity: 0, stagger: 0.1, duration: 0.8, ease: 'power3.out', ...ir });
  }

  let hasEntered = false;

  ScrollTrigger.create({
    trigger: scrollContainer,
    start: 'top top',
    end: 'bottom bottom',
    scrub: false,
    onUpdate: (self) => {
      const p = self.progress;
      const fadeRange = 0.025;

      if (p >= enter && p <= leave) {
        // Section is in its active window
        section.style.opacity = '1';
        if (!hasEntered) {
          hasEntered = true;
          tl.play(0);
        }
      } else if (p < enter) {
        // Before section — reset
        if (hasEntered) {
          hasEntered = false;
          tl.pause(0);
          tl.progress(0);
        }
        section.style.opacity = '0';
      } else if (p > leave) {
        // After section
        if (persist) {
          // CTA stays visible forever
          section.style.opacity = '1';
        } else {
          const outP = Math.min((p - leave) / fadeRange, 1);
          section.style.opacity = String(1 - outP);
          if (outP >= 1 && hasEntered) {
            hasEntered = false;
            tl.pause(0);
            tl.progress(0);
          }
        }
      }
    }
  });
}

// ═══════════════════════════════════════════
// COUNTER ANIMATIONS
// ═══════════════════════════════════════════
function initCounters() {
  document.querySelectorAll('.stat-number[data-value]').forEach(el => {
    const target   = parseFloat(el.dataset.value);
    const decimals = parseInt(el.dataset.decimals || '0');
    gsap.from(el, {
      textContent: 0,
      duration: 2,
      ease: 'power1.out',
      snap: { textContent: decimals === 0 ? 1 : 0.01 },
      scrollTrigger: {
        trigger: el.closest('.scroll-section'),
        start: 'top 80%',
        toggleActions: 'play none none reverse',
        containerAnimation: null,
      },
      onUpdate: function() {
        const val = parseFloat(this.targets()[0].textContent);
        el.textContent = decimals === 0
          ? Math.round(val).toLocaleString()
          : val.toFixed(decimals);
      }
    });
  });
}

// ═══════════════════════════════════════════
// DARK OVERLAY (stats section)
// ═══════════════════════════════════════════
function initDarkOverlay() {
  const statsSection = document.querySelector('[data-stats-overlay="true"]');
  if (!statsSection) return;
  const enter = parseFloat(statsSection.dataset.enter) / 100;
  const leave  = parseFloat(statsSection.dataset.leave)  / 100;
  const fadeRange = 0.04;

  ScrollTrigger.create({
    trigger: scrollContainer,
    start: 'top top',
    end: 'bottom bottom',
    scrub: true,
    onUpdate: (self) => {
      const p = self.progress;
      let opacity = 0;
      if (p >= enter - fadeRange && p <= enter) {
        opacity = (p - (enter - fadeRange)) / fadeRange;
      } else if (p > enter && p < leave) {
        opacity = 0.9;
      } else if (p >= leave && p <= leave + fadeRange) {
        opacity = 0.9 * (1 - (p - leave) / fadeRange);
      }
      darkOverlay.style.opacity = String(opacity);
    }
  });
}

// ═══════════════════════════════════════════
// MARQUEE
// ═══════════════════════════════════════════
function initMarquee() {
  const speed = parseFloat(marqueeWrap.dataset.scrollSpeed) || -28;
  const text  = marqueeWrap.querySelector('.marquee-text');

  gsap.to(text, {
    xPercent: speed,
    ease: 'none',
    scrollTrigger: {
      trigger: scrollContainer,
      start: 'top top',
      end: 'bottom bottom',
      scrub: true
    }
  });

  // Show marquee between 15% and 85% scroll
  ScrollTrigger.create({
    trigger: scrollContainer,
    start: 'top top',
    end: 'bottom bottom',
    scrub: true,
    onUpdate: (self) => {
      const p = self.progress;
      let opacity = 0;
      if (p > 0.15 && p < 0.80) {
        if (p < 0.20) opacity = (p - 0.15) / 0.05;
        else if (p > 0.75) opacity = (0.80 - p) / 0.05;
        else opacity = 1;
      }
      marqueeWrap.style.opacity = String(opacity * 0.4); // ghostly, never dominant
    }
  });
}

// ═══════════════════════════════════════════
// LENIS SMOOTH SCROLL
// ═══════════════════════════════════════════
function initLenis() {
  lenis = new Lenis({
    duration: 1.2,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smoothWheel: true
  });

  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
}

// ═══════════════════════════════════════════
// BOOT
// ═══════════════════════════════════════════
async function init() {
  gsap.registerPlugin(ScrollTrigger);
  resizeCanvas();

  // Load frames and show progress
  await loadFrames();

  // Hide loader
  loader.classList.add('hidden');

  // Animate hero text
  animateHero();

  // Init smooth scroll
  initLenis();

  // Init all scroll-based systems
  initHeroTransition();
  initFrameScrub();
  initDarkOverlay();
  initMarquee();

  // Setup content sections
  document.querySelectorAll('.scroll-section').forEach(setupSectionAnimation);

  // Counter animations (uses ScrollTrigger but based on screen position)
  initCounters();

  ScrollTrigger.refresh();
}

init();
