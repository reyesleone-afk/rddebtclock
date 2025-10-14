// Función para animar contadores (tic-tac estilo DebtClock)
function animateCounter(id, target, duration = 3000, isCurrency = true, decimals = 0) {
    const elem = document.getElementById(id);
    if (!elem) return;
    const start = 0; // Empieza de 0 para efecto dramático
    const increment = (target - start) / (duration / 16); // ~60fps
    let current = start;
    const timer = setInterval(() => {
        current += increment;
        if (current >= target) current = target;
        
        let display;
        if (isCurrency) {
            display = new Intl.NumberFormat('es-DO', { style: 'currency', currency: 'USD' }).format(current);
        } else if (id.includes('growth') || id.includes('inflation') || id.includes('rate')) {
            display = current.toFixed(decimals) + '%';
        } else {
            display = Intl.NumberFormat('es-DO').format(current);
        }
        elem.textContent = display;
        
        if (current >= target) {
            clearInterval(timer);
            // Pequeña pausa y reinicio sutil para "real-time"
            setTimeout(() => animateCounter(id, target + (target * 0.001), duration / 2, isCurrency, decimals), 5000);
        }
    }, 16);
}

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
    animateCounter('interest-rate', 5.5, 1500, false, 2);
});
