// Función para animar contadores (tic-tac estilo DebtClock)
function animateCounter(id, target, duration = 3000, isCurrency = true, decimals = 0) {
    const elem = document.getElementById(id);
    if (!elem) return;
    const start = 0;
    const increment = (target - start) / (duration / 16);
    let current = start;
    const timer = setInterval(() => {
        current += increment;
        if (current >= target) current = target;
        
        let display;
        if (isCurrency) {
            display = new Intl.NumberFormat('es-DO', { style: 'currency', currency: 'USD' }).format(current);
        } else if (id.includes('growth') || id.includes('inflation')) {
            display = current.toFixed(decimals) + '%';
        } else {
            display = Intl.NumberFormat('es-DO').format(current);
        }
        elem.textContent = display;
        
        if (current >= target) {
            clearInterval(timer);
            setTimeout(() => animateCounter(id, target + (target * 0.001), duration / 2, isCurrency, decimals), 5000);
        }
    }, 16);
}

// Reloj en vivo
function updateLiveClock() {
    const clock = document.getElementById('live-clock');
    const now = new Date();
    const options = { hour: '2-digit', minute: '2-digit', hour12: true, timeZoneName: 'short' };
    clock.textContent = now.toLocaleTimeString('en-US', options).replace('GMT', 'EDT');
}
setInterval(updateLiveClock, 1000);
updateLiveClock();

// Actualiza y anima al cargar
document.addEventListener('DOMContentLoaded', function() {
    // Deuda
    animateCounter('debt-total', 60500000000, 4000, true);
    animateCounter('debt-per-capita', 5350, 2000, true);
    animateCounter('debt-gdp', 46.9, 2000, false, 1);
    
    // PIB
    animateCounter('gdp-total', 128500000000, 4000, true);
    animateCounter('gdp-growth', 4.8, 2000, false, 1);
    animateCounter('population', 11300000, 3000, false);
    
    // Otros
    animateCounter('inflation', 3.7, 1500, false, 1);
    animateCounter('remesas', 10200000000, 3500, true);
    animateCounter('turismo', 21100000000, 3500, true); // Nuevo: Turismo
});
