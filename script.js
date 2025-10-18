/* filename: script.js */
// ============================
// RD Debt Clock — Motor de counters (optimizado)
// ============================

/** ----- Configuración central -----
 * ratePerSecond: variación por segundo (puede ser negativa o 0).
 * formatter: función de formateo (moneda, %, número).
 * NOTA: usa los mismos IDs que tu HTML.
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

/* ============================
   Utilidades de formateo
   ============================ */
function safeNumber(value, fallback = 0) {
  const cleaned = String(value).replace(/[,\s]/g, '');
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : fallback;
}

function roundTo(n, decimals = 0) {
  const f = Math.pow(10, decimals);
  return Math.round((n + Number.EPSILON) * f) / f;
}

function formatCurrency(value, decimals = 0) {
  const n = roundTo(safeNumber(value), decimals);
  return new Intl.NumberFormat(LOCALE, {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(n);
}

function formatPercentage(value, decimals = 1, showSign = false) {
  const n = roundTo(safeNumber(value), decimals);
  const opts = {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
    signDisplay: showSign ? 'always' : 'auto'
  };
  return `${new Intl.NumberFormat(LOCALE, opts).format(n)}%`;
}

function formatInteger(value) {
  const n = Math.floor(safeNumber(value));
  return new Intl.NumberFormat(LOCALE).format(n);
}

/* ============================
   Ajuste de texto anti-desborde
   ============================ */
/**
 * Reduce el font-size solo si el contenido se sale del ancho del contenedor.
 * - Restablece el tamaño antes de medir (evita encogimiento permanente).
 * - Evita loops de reflow innecesarios.
 */
function fitText(el, { max = 56, min = 14, step = 1 } = {}) {
  if (!el) return;
  const s = el.style;

  // Guardar valores previos para restaurar
  const prevFontSize = s.fontSize;
  const prevWhiteSpace = s.whiteSpace;
  const prevDisplay = s.display;

  s.fontSize = ''; // deja que CSS decida (puedes tener clamp en CSS)
  s.whiteSpace = 'nowrap';
  s.display = 'block';

  // Si desborda, reduce gradualmente
  let size = parseFloat(getComputedStyle(el).fontSize) || max;
  if (el.scrollWidth > el.clientWidth) {
    size = Math.min(size, max);
    s.fontSize = size + 'px';
    while (el.scrollWidth > el.clientWidth && size > min) {
      size -= step;
      s.fontSize = size + 'px';
    }
  }

  // Restaurar comportamiento normal
  s.whiteSpace = prevWhiteSpace || '';
  s.display = prevDisplay || '';
  if (!s.fontSize) s.fontSize = prevFontSize || '';
}

/* ============================
   Observadores (Performance)
   ============================ */
let resizeObservers = [];
let inViewportCount = 0;
let io; // IntersectionObserver

function observeElementSize(el) {
  const ro = new ResizeObserver(() => fitText(el));
  ro.observe(el);
  resizeObservers.push(ro);
}

function disconnectObservers() {
  resizeObservers.forEach(ro => ro.disconnect());
  resizeObservers = [];
  if (io) io.disconnect();
}

/* ============================
   Motor rAF eficiente
   ============================ */
const STATE = {
  start: 0,
  lastFrame: 0,
  fpsInterval: 1000 / 30, // ~30 FPS
  running: false,
  prefersReduced: window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches ?? false,
  anyVisible: true, // se actualiza con IntersectionObserver
};

function initCounters() {
  COUNTERS.forEach(cfg => {
    const el = document.getElementById(cfg.id);
    if (!el) return;
    cfg.el = el;

    // Lee el valor base desde data-value/innerText
    const attrVal = el.getAttribute('data-value');
    const fallbackText = el.textContent.replace(/[^\d,.\-]/g, '');
    cfg.initialValue = safeNumber(attrVal ?? fallbackText, 0);

    // Render inicial
    const display = cfg.formatter(cfg.initialValue);
    if (el.textContent !== display) {
      el.textContent = display;
    }

    // Ajuste reactivo a tamaño del contenedor
    observeElementSize(el);
  });

  setupIntersectionObserver();
}

function renderFrame(now) {
  if (!STATE.running) return;

  // Pausa dinámica si ningún counter está visible (ahorra energía)
  if (!STATE.anyVisible) {
    requestAnimationFrame(renderFrame);
    return;
  }

  if (!STATE.start) STATE.start = now;
  // Throttle a 30fps
  if (now - STATE.lastFrame < STATE.fpsInterval) {
    requestAnimationFrame(renderFrame);
    return;
  }
  const elapsedSinceStart = now - STATE.start;
  STATE.lastFrame = now;

  const elapsedSec = elapsedSinceStart / 1000;

  COUNTERS.forEach(cfg => {
    if (!cfg.el) return;

    // Si reduce motion o el rate es 0, pin fija (ya pintado en init)
    if (STATE.prefersReduced || cfg.ratePerSecond === 0) return;

    const value = cfg.initialValue + elapsedSec * cfg.ratePerSecond;
    const display = cfg.formatter(value);

    // Evita reflujo si la cadena no cambia
    if (cfg.el.textContent !== display) {
      cfg.el.textContent = display;
      fitText(cfg.el);
    }
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

/* ============================
   Visibility / Intersección
   ============================ */
document.addEventListener('visibilitychange', () => {
  if (document.hidden) stopLoop();
  else startLoop();
});

function setupIntersectionObserver() {
  const targets = COUNTERS.map(c => c.el).filter(Boolean);
  if (!targets.length || !('IntersectionObserver' in window)) {
    STATE.anyVisible = true; // fallback: siempre activo
    return;
  }

  inViewportCount = 0;
  io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) inViewportCount++;
      else inViewportCount = Math.max(0, inViewportCount - 1);
    });
    STATE.anyVisible = inViewportCount > 0;
  }, { root: null, threshold: 0.01 });

  targets.forEach(el => io.observe(el));
}

/* ============================
   Eventos globales
   ============================ */
// Si el usuario rota o cambia viewport, los ResizeObserver ya recalculan fitText,
// pero añadimos un ajuste ligero para casos límite con layout externo.
let resizeRaf;
window.addEventListener('resize', () => {
  cancelAnimationFrame(resizeRaf);
  resizeRaf = requestAnimationFrame(() => {
    document.querySelectorAll('.counter').forEach(el => fitText(el));
  });
});

/* ============================
   Utilidad: Fecha visible <time#last-update>
   ============================ */
function updateLastUpdate() {
  const t = document.getElementById('last-update');
  if (!t) return;
  const iso = t.getAttribute('datetime'); // ej: 2025-10-08
  if (!iso) return;
  try {
    const d = new Date(iso);
    if (!isNaN(d.getTime())) {
      t.textContent = d.toLocaleDateString(LOCALE, { year: 'numeric', month: 'long', day: '2-digit' });
    }
  } catch { /* noop */ }
}

/* ============================
   Init
   ============================ */
window.addEventListener('load', () => {
  initCounters();
  updateLastUpdate();

  if (!STATE.prefersReduced) startLoop(); // respeta reduce motion
});

// Limpieza si alguna SPA/unmount en el futuro
window.addEventListener('beforeunload', () => {
  disconnectObservers();
  stopLoop();
});
