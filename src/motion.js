/** Progressive enhancement: native scrolling, no pinned or hijacked sections. */
export function initMotion() {
  const root = document.documentElement;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const compact = matchMedia('(max-width: 760px)');
  const toggle = document.querySelector('#motion-toggle');
  const hero = document.querySelector('.hero');
  const visual = document.querySelector('#hero-visual');
  const photo = visual.querySelector('img');
  const table = document.querySelector('.table-photo-wrap');
  const strip = document.querySelector('.flavour-strip');
  let preference;
  try { preference = localStorage.getItem('nricart-motion'); } catch {}
  let paused = reduced.matches || preference === 'off';
  let frame = 0;
  let pointerX = 0, pointerY = 0;
  const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
  const elements = [hero, table, strip];

  function draw() {
    frame = 0;
    if (paused) return;
    const viewport = innerHeight;
    const heroBox = hero.getBoundingClientRect();
    const tableBox = table.getBoundingClientRect();
    const stripBox = strip.getBoundingClientRect();
    const range = root.scrollHeight - root.clientHeight;
    root.style.setProperty('--page-progress', range > 0 ? clamp(scrollY / range, 0, 1) : 0);
    if (heroBox.bottom > 0 && heroBox.top < viewport) {
      const progress = clamp(-heroBox.top / heroBox.height, 0, 1);
      const amount = compact.matches ? 0.45 : 1;
      hero.style.setProperty('--hero-copy-y', `${progress * -80 * amount}px`);
      hero.style.setProperty('--hero-image-y', `${progress * 72 * amount}px`);
      hero.style.setProperty('--hero-scale', 1.1 + progress * 0.055);
      photo.style.setProperty('--tilt-x', `${pointerY * -4}deg`);
      photo.style.setProperty('--tilt-y', `${pointerX * 5}deg`);
    }
    if (tableBox.bottom > 0 && tableBox.top < viewport) {
      const progress = clamp((viewport - tableBox.top) / (viewport + tableBox.height), 0, 1);
      table.style.setProperty('--table-y', `${(progress - 0.5) * (compact.matches ? 40 : 100)}px`);
    }
    if (stripBox.bottom > 0 && stripBox.top < viewport) {
      strip.style.setProperty('--strip-x', `${clamp((viewport - stripBox.top) * -0.2, -220, 0)}px`);
    }
  }
  function schedule() {
    if (!paused && !frame) frame = requestAnimationFrame(draw);
  }
  function applyPreference() {
    root.classList.toggle('motion-off', paused);
    toggle.textContent = paused ? 'Enable motion' : 'Pause motion';
    toggle.setAttribute('aria-pressed', String(paused));
    if (paused) {
      cancelAnimationFrame(frame);
      frame = 0;
      root.style.removeProperty('--page-progress');
      for (const element of elements) {
        for (const property of ['--hero-copy-y', '--hero-image-y', '--hero-scale', '--table-y', '--strip-x']) element.style.removeProperty(property);
      }
      photo.style.removeProperty('--tilt-x');
      photo.style.removeProperty('--tilt-y');
    } else schedule();
  }
  toggle.addEventListener('click', () => {
    paused = !paused;
    preference = paused ? 'off' : 'on';
    try { localStorage.setItem('nricart-motion', preference); } catch {}
    applyPreference();
  });
  reduced.addEventListener('change', () => {
    paused = reduced.matches || preference === 'off';
    applyPreference();
  });
  compact.addEventListener('change', schedule);
  addEventListener('scroll', schedule, { passive: true });
  addEventListener('resize', schedule, { passive: true });
  addEventListener('pageshow', schedule);
  visual.addEventListener('pointermove', event => {
    if (paused || event.pointerType === 'touch') return;
    const box = visual.getBoundingClientRect();
    pointerX = (event.clientX - box.left) / box.width - 0.5;
    pointerY = (event.clientY - box.top) / box.height - 0.5;
    schedule();
  });
  visual.addEventListener('pointerleave', () => {
    pointerX = pointerY = 0;
    schedule();
  });

  // Products can be replaced by filtering or a successful Supabase response.
  let entranceObserver, productObserver;
  if ('IntersectionObserver' in window) {
    entranceObserver = new IntersectionObserver(entries => {
      for (const entry of entries) if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        entranceObserver.unobserve(entry.target);
      }
    }, { threshold: 0.08 });
    const observeProducts = () => {
      document.querySelectorAll('.product-card').forEach((card, index) => {
        card.classList.add('reveal');
        card.style.setProperty('--reveal-delay', `${(index % (compact.matches ? 2 : 4)) * 110}ms`);
        entranceObserver.observe(card);
      });
    };
    document.querySelectorAll('.reveal').forEach(el => entranceObserver.observe(el));
    observeProducts();
    productObserver = new MutationObserver(observeProducts);
    productObserver.observe(document.querySelector('#product-grid'), { childList: true });
    root.classList.add('js-motion');
  }
  root.classList.add('scroll-effects');
  applyPreference();
  return () => {
    cancelAnimationFrame(frame);
    entranceObserver?.disconnect();
    productObserver?.disconnect();
    removeEventListener('scroll', schedule);
    removeEventListener('resize', schedule);
    removeEventListener('pageshow', schedule);
  };
}
