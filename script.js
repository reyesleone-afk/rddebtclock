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
        } else if (id.includes('price')) {
            display = current.toFixed(2) + ' USD';
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

// Fetch tipos de cambio
async function fetchExchangeRates() {
    try {
        const usdResponse = await fetch('https://currency-api.pages.dev/v1/currencies/usd.json');
        const usdData = await usdResponse.json();
        const usdRate = usdData.usd.dop;

        const eurResponse = await fetch('https://currency-api.pages.dev/v1/currencies/eur.json');
        const eurData = await eurResponse.json();
        const eurRate = eurData.eur.dop;

        animateCounter('usd-rate', usdRate, 2000, false, 2, ' DOP');
        animateCounter('eur-rate', eurRate, 2000, false, 2, ' DOP');

        const date = new Date().toLocaleDateString('es-DO');
        document.querySelector('#usd-rate + .explain').textContent = `Tipo de cambio promedio (Fuente: BCRD vía API, ${date})`;
        document.querySelector('#eur-rate + .explain').textContent = `Tipo de cambio promedio (Fuente: BCRD vía API, ${date})`;
    } catch (error) {
        console.error('Error fetching rates:', error);
        animateCounter('usd-rate', 60.50, 2000, false, 2, ' DOP');
        animateCounter('eur-rate', 65.00, 2000, false, 2, ' DOP');
    }
}

// Tema claro/oscuro
function setTheme() {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');
    const themeToggle = document.getElementById('theme-toggle');
    const isDark = localStorage.getItem('theme') === 'dark' || (!localStorage.getItem('theme') && prefersDark.matches);

    if (isDark) {
        document.body.classList.add('dark-mode');
        themeToggle.textContent = 'Modo Claro';
    } else {
        document.body.classList.remove('dark-mode');
        themeToggle.textContent = 'Modo Oscuro';
    }
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
}

themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
    const isDark = document.body.classList.contains('dark-mode');
    themeToggle.textContent = isDark ? 'Modo Claro' : 'Modo Oscuro';
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
});

window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', setTheme);

// Actualiza y anima al cargar
document.addEventListener('DOMContentLoaded', function() {
    setTheme(); // Aplica tema al cargar
    fetchExchangeRates();

    animateCounter('debt-total', 60500000000, 4000, true);
    animateCounter('debt-per-capita', 5350, 2000, true);
    animateCounter('debt-gdp', 46.9, 2000, false, 1);
    
    animateCounter('gdp-total', 128500000000, 4000, true);
    animateCounter('gdp-growth', 4.8, 2000, false, 1);
    animateCounter('population', 11300000, 3000, false);
    
    animateCounter('inflation', 3.7, 1500, false, 1);
    animateCounter('remesas', 10200000000, 3500, true);
    
    animateCounter('unemployment-rate', 7.4, 1500, false, 1, '%');
    animateCounter('reserves', 15300000000, 3000, true);
    animateCounter('ied', 4050000000, 3000, true);
    animateCounter('ipc-monthly', 0.31, 1500, false, 2, '%');
    
    animateCounter('gold-price', 4129.00, 2000, false, 2, ' USD');
    animateCounter('silver-price', 51.28, 2000, false, 2, ' USD');
    animateCounter('platinum-price', 1659.00, 2000, false, 2, ' USD');
    animateCounter('copper-price', 5.08, 2000, false, 2, ' USD');
});
