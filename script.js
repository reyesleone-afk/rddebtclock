// Contador animado (simula aumento basado en tasa real ~0.5% mensual)
function animateCounter(id, target, duration = 2000) {
    const elem = document.getElementById(id);
    const start = parseFloat(elem.textContent.replace(/[^\d.-]/g, '')) || 0;
    const increment = (target - start) / (duration / 16);
    let current = start;
    const timer = setInterval(() => {
        current += increment;
        if (Math.abs(current - target) < Math.abs(increment)) current = target;
        if (id === 'debt-counter' || id === 'gdp-counter') {
            elem.textContent = new Intl.NumberFormat('es-DO', { style: 'currency', currency: 'USD' }).format(current);
        } else {
            elem.textContent = current.toFixed(1) + '%';
        }
        if (current >= target) clearInterval(timer);
    }, 16);
}

// Actualiza datos (manual por ahora; después automatizamos)
async function updateData() {
    // Deuda (de DGCP)
    animateCounter('debt-counter', 60182900000);
    
    // PIB (est. BCRD)
    animateCounter('gdp-counter', 128424400000);
    
    // Inflación (BCRD Ago)
    document.getElementById('inflation-counter').textContent = '3.7%';

    // Chart PIB trimestres 2025 (datos preliminares BCRD)
    const ctx = document.getElementById('pib-chart').getContext('2d');
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['Ene-Mar', 'Abr-Jun', 'Jul-Sep', 'Oct-Dic (est.)'],
            datasets: [{ label: 'PIB (miles millones US$)', data: [30.5, 32.1, 32.8, 33.0], borderColor: '#004080' }]
        },
        options: { responsive: true, scales: { y: { beginAtZero: false } } }
    });
}

// Inicia
document.addEventListener('DOMContentLoaded', updateData);

// PWA básico
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').catch(() => {}); // Ignora si no hay sw.js aún
}
