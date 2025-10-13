// Función para animar contadores con formato compacto
function animateCounter(id, target, duration = 3000, isCurrency = true, decimals = 0, suffix = '') {
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
            const absValue = Math.abs(current);
            if (absValue >= 1e12) display = (current / 1e12).toFixed(1) + 'T';
            else if (absValue >= 1e9) display = (current / 1e9).toFixed(1) + 'B';
            else if (absValue >= 1e6) display = (current / 1e6).toFixed(1) + 'M';
            else display = new Intl.NumberFormat('es-DO', { style: 'currency', currency: 'USD' }).format(current);
        } else if (id.includes('growth') || id.includes('inflation') || id.includes('unemployment') || id.includes('ipc')) {
            display = current.toFixed(decimals) + '%';
        } else if (id.includes('usd') || id.includes('eur')) {
            display = current.toFixed(2) + ' DOP';
        } else {
            display = Intl.NumberFormat('es-DO').format(current);
        }
        elem.textContent = display;
        
        if (current >= target) {
            clearInterval(timer);
            setTimeout(() => animateCounter(id, target + (target * 0.001), duration / 2, isCurrency, decimals, suffix), 5000);
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
    animateCounter('usd-rate', 60.50, 2000, false, 2, ' DOP');
    animateCounter('eur-rate', 65.00, 2000, false, 2, ' DOP');
    
    // Nuevas métricas
    animateCounter('unemployment-rate', 7.4, 1500, false, 1, '%');
    animateCounter('reserves', 15300000000, 3000, true);
    animateCounter('ied', 4050000000, 3000, true);
    animateCounter('ipc-monthly', 0.31, 1500, false, 2, '%');
});
