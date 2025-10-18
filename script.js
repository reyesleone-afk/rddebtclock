// ==============================
// RDDebtClock — Animación total con data-value
// - Count-up inicial por tarjeta
// - Luego continua con rate/segundo
// - Anti-desborde de texto
// - Respeta prefers-reduced-motion
// ==============================

// Mapeo central: id -> tasa/seg y formateador
const LOCALE = 'es-DO';
const CONFIG = [
  { id: 'debt-total',      ratePerSecond: 2500,  fmt: v => fmtCurrency(v, 0) },
  { id: 'debt-per-capita', ratePerSecond: 0.05,  fmt: v => fmtCurrency(v, 2) },
  { id: 'debt-gdp',        ratePerSecond: 0,     fmt: v => fmtPercent(v, 1) },

  { id: 'gdp-total',       ratePerSecond: 4000,  fmt: v => fmtCurrency(v, 0) },
  { id: 'gdp-growth',      ratePerSecond: 0,     fmt: v => fmtPercent(v, 1, true) },
  { id: 'population',      ratePerSecond: 0.8,   fmt: v => fmtInteger(v) },

  { id: 'inflation',       ratePerSecond: 0,     fmt: v => fmtPercent(v, 1) },
  { id: 'remesas',         ratePerSecond: 350,   fmt: v => fmtCurrency(v, 0) },
  { id: 'interest-rate',   ratePerSecond: 0,     fmt: v => fmtPercent(v, 2) },
];

// ===== Utilidades de formateo =====
function nSafe(v, fb = 0) { const n = Number(v); return Number.isFinite(n) ? n : fb; }
function fmtCurrency(v, decimals = 0) {
  return new Intl.NumberFormat(LOCALE, {
    style: 'currency', currency: 'USD',
    minimumFractionDigits: decimals, maximumFractionDigits: decimals
  }).format(nSafe(v));
}
function fmtPercent(v, decimals = 1, showSign = false) {
  const opts = { minimumFractionDigits: decimals, maximumFractionDigits: decimals };
  if (showSign) opts.signDisplay = 'always';
  return `${new Intl.NumberFormat(LOCALE, opts).format(nSafe(v))}%`;
}
function fmtInteger(v) { return new Intl.NumberFormat(LOCALE).format(Math.floor(nSafe(v))); }

// ===== Anti-desborde: reduce font-size sólo si es necesario =====
function fitText(el, { max = 56, min = 14, step = 1 } = {}) {
  if (!el) return;
  const s = el.style;

  // Deja que el CSS (clamp/cqi) actúe primero
  s.fontSize = '';
  s.whiteSpace = 'nowrap';
  s.display = 'block';

  if (el.scrollWidth > el.clientWidth) {
    let size = max;
    s.fontSize = size + 'px';
    while (el.scrollWidth > el.clientWidth && size > min) {
      size -= step;
      s.fontSize = size + 'px';
    }
  }

  s.whiteSpace = '';
  s.display = '';
}

// ===== Count-up por elemento =====
function countUp(el, from, to, duration = 1000, fmt = String, onDone = () => {}) {
  const start = performance.now();
  const total = nSafe(to) - nSafe(from);

  function ease(t) { // easeInOutCubic
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  function frame(now) {
    const t = Math.min((now - start) / duration, 1);
    const val = from + total * ease(t);
    el.textContent = fmt(val);
    fitText(el);
    if (t < 1) requestAnimationFrame(frame);
    else onDone();
  }
  requestAnimationFrame(frame);
}

// ===== Motor continuo con tasa/segundo (único rAF) =====
const STATE = {
  start: 0,
  lastFrame: 0,
  fpsInterval: 1000 / 30, // ~30fps
  running: false,
  prefersReduced: window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches ?? false,
};

function init() {
  // Vincula elementos y valores iniciales
  CONFIG.forEach(c => {
    c.el = document.getElementById(c.id);
    if (!c.el) return;
    c.initial = nSafe(c.el.dataset.value, 0);
    c.baseAfterCountUp = c.initial; // será recalibrado tras el count-up
    // Render “placeholder” antes de animar
    c.el.textContent = c.fmt(0);
    fitText(c.el);
  });
}

function startCountUpsThenLoop() {
  // Si reduce motion, salta animación y muestra directo
  if (STATE.prefersReduced) {
    CONFIG.forEach(c => {
      if (!c.el) return;
      c.el.textContent = c.fmt(c.initial);
      fitText(c.el);
    });
    startLoop(); // si hay ratePerSecond, seguirá actualizando sin animación inicial
    return;
  }

  // Ejecuta count-up por cada métrica; cuando todas terminen, inicia el loop
  let pending = CONFIG.filter(c => c.el).length;
  if (pending === 0) return;

  CONFIG.forEach(c => {
    if (!c.el) return;
    const duration = c.ratePerSecond === 0 ? 800 : 1100; // un poco más largo si luego seguirá moviéndose
    countUp(c.el, 0, c.initial, duration, c.fmt, () => {
      // Al finalizar el count-up, fija como base el valor alcanzado (exacto)
      c.baseAfterCountUp = c.initial;
      if (--pending === 0) startLoop();
    });
  });
}

function renderFrame(now) {
  if (!STATE.running) return;
  if (!STATE.start) STATE.start = now;

  // Throttle a 30fps
  if (now - STATE.lastFrame < STATE.fpsInterval) {
    requestAnimationFrame(renderFrame);
    return;
  }
  const elapsed = now - STATE.start;
  STATE.lastFrame = now;
  const seconds = elapsed / 1000;

  CONFIG.forEach(c => {
    if (!c.el) return;
    if (c.ratePerSecond === 0) return; // estático tras count-up

    const value = c.baseAfterCountUp + seconds * c.ratePerSecond;
    c.el.textContent = c.fmt(value);
    fitText(c.el);
  });

  requestAnimationFrame(renderFrame);
}

function startLoop() {
  if (STATE.running) return;
  STATE.running = true;
  STATE.start = 0;
  STATE.lastFrame = 0;
  requestAnimationFrame(renderFrame);
}
function stopLoop() { STATE.running = false; }

// Pausa cuando la pestaña se oculta
document.addEventListener('visibilitychange', () => {
  if (document.hidden) stopLoop();
  else startLoop();
});

// Re-ajusta texto en resize
window.addEventListener('resize', () => {
  document.querySelectorAll('.counter').forEach(el => fitText(el));
});

// Init
window.addEventListener('load', () => {
  init();
  startCountUpsThenLoop();
});
