// ============================
// RD Debt Clock — Motor de counters (mejorado)
// ============================

/** ----- Configuración central ----- 
 * ratePerSecond: variación por segundo (puede ser negativa o 0).
 * formatter: función de formateo (moneda, %, número).
 */
const COUNTERS = [
  { id: 'debt-total',      ratePerSecond: 2500,  formatter: v => formatCurrency(v, 0) },
  { id: 'debt-per-capita', ratePerSecond: 0.05,  formatter: v => formatCurrency(v, 2) },
  { id: 'debt-gdp',        ratePerSecond: 0,     formatter: v => formatPercentage(v, 1) },

  { id: 'gdp-total',       ratePerSecond: 4000,  formatter: v => formatCurrency(v, 0) },
  { id: 'gdp-growth',      ratePerSecond: 0,     formatter: v => formatPercentage(v, 1, true) },
  { id: 'population',      ratePerSecond: 0.8,   formatter: v => formatInteger(v) },

  { id: 'inflation',       ratePerSecond: 0,     formatter: v => formatPercentage(v, 1) },
  { id: 'remesas',         ratePerSecond: 350,   formatter: v => formatCurrency(v, 0) },
  { id: 'interest-rate',   ratePerSecond: 0,     formatter: v => formatPercentage(v, 2) },
];

// Locale para formateo
const LOCALE = 'es-DO';

/** -------- Utilidades de formateo -------- */
function safeNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}
function formatCurrency(value, decimals = 0) {
  const n = safeNumber(value);
  return new Intl.NumberFormat(LOCALE, {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(n);
}
function formatPercentage(value, decimals = 1, showSign = false) {
  const n = safeNumber(value);
  const opts = { minimumFractionDigits: decimals, maximumFractionDigits: decimals, signDisplay: showSign ? 'always' : 'auto' };
  return `${new Intl.NumberFormat(LOCALE, opts).format(n)}%`;
}
function formatInteger(value) {
  const n = Math.floor(safeNumber(value));
  return new Intl.NumberFormat(LOCALE).format(n);
}

/** -------- Ajuste de texto anti-desborde --------
 * Reduce el font-size solo si el contenido se sale del ancho del contenedor.
 */
function fitText(el, { max = 56, min = 14, step = 1 } = {}) {
  if (!el) return;
  const s = el.style;

  // Deja que CSS calcule primero (usando clamp/cqi del CSS)
  s.fontSize = '';
  s.whiteSpace = 'nowrap';
  s.display = 'block';

  // Si desborda, reduce gradualmente
  if (el.scrollWidth > el.clientWidth) {
    let size = max;
    s.fontSize = size + 'px';
    while (el.scrollWidth > el.clientWidth && size > min) {
      size -= step;
      s.fontSize = size + 'px';
    }
  }

  // Restaurar para permitir cortes controlados por CSS
  s.whiteSpace = '';
  s.display = '';
}

/** -------- Motor rAF eficiente --------
 * - Un solo loop para todos los counters
 * - Limita a ~30fps para eficiencia
 * - Pausa cuando la pestaña está oculta
 */
const STATE = {
  start: 0,
  lastFrame: 0,
  fpsInterval: 1000 / 30, // ~30 FPS
  running: false,
  prefersReduced: window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches ?? false,
};

function initCounters() {
  COUNTERS.forEach(cfg => {
    const el = document.getElementById(cfg.id);
    if (!el) return;
    cfg.el = el;
    cfg.initialValue = safeNumber(el.dataset.value, 0);
    // Render inicial
    el.textContent = cfg.formatter(cfg.initialValue);
    fitText(el);
  });
}

function renderFrame(now) {
  if (!STATE.running) return;

  if (!STATE.start) STATE.start = now;
  const elapsed = now - STATE.start;

  // Throttle a 30fps
  if (now - STATE.lastFrame < STATE.fpsInterval) {
    requestAnimationFrame(renderFrame);
    return;
  }
  STATE.lastFrame = now;

  const elapsedSec = elapsed / 1000;

  COUNTERS.forEach(cfg => {
    if (!cfg.el) return;

    // Si reduce motion, no animamos: solo mostramos el valor base
    if (STATE.prefersReduced || cfg.ratePerSecond === 0) {
      // Evita re-render continuo en los que tienen 0
      if (!cfg._staticRendered) {
        cfg.el.textContent = cfg.formatter(cfg.initialValue);
        fitText(cfg.el);
        cfg._staticRendered = true;
      }
      return;
    }

    const value = cfg.initialValue + elapsedSec * cfg.ratePerSecond;
    cfg.el.textContent = cfg.formatter(value);
    fitText(cfg.el);
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

/** Pausa cuando la pestaña se oculta para ahorrar batería/CPU */
document.addEventListener('visibilitychange', () => {
  if (document.hidden) stopLoop();
  else startLoop();
});

/** Re-ajusta tamaños si cambia el viewport */
window.addEventListener('resize', () => {
  document.querySelectorAll('.counter').forEach(el => fitText(el));
});

/** Init */
window.addEventListener('load', () => {
  initCounters();
  if (!STATE.prefersReduced) startLoop(); // respeta reduce motion
});
