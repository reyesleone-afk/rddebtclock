// Espera a que todo el contenido del HTML esté cargado
document.addEventListener('DOMContentLoaded', () => {

    // MEJORA 1: Datos Centralizados y Fáciles de Actualizar
    // Todo lo que necesitas cambiar en el futuro está aquí.
    // ratePerSecond: Cuánto cambia el valor cada segundo.
    //   - Positivo para aumentar (deuda, pib, población).
    //   - Negativo para disminuir.
    //   - 0 para valores estáticos (tasa de interés, inflación).
    const countersConfig = [
        { id: 'debt-total',      ratePerSecond: 2500,    formatter: formatCurrency },
        { id: 'debt-per-capita', ratePerSecond: 0.05,    formatter: (val) => formatCurrency(val, 2) },
        { id: 'debt-gdp',        ratePerSecond: 0,       formatter: (val) => formatPercentage(val, 1) },
        
        { id: 'gdp-total',       ratePerSecond: 4000,    formatter: formatCurrency },
        { id: 'gdp-growth',      ratePerSecond: 0,       formatter: (val) => formatPercentage(val, 1, true) },
        { id: 'population',      ratePerSecond: 0.8,     formatter: formatNumber },
        
        { id: 'inflation',       ratePerSecond: 0,       formatter: (val) => formatPercentage(val, 1) },
        { id: 'remesas',         ratePerSecond: 350,     formatter: formatCurrency },
        { id: 'interest-rate',   ratePerSecond: 0,       formatter: (val) => formatPercentage(val, 2) }
    ];

    // Carga los valores iniciales desde los atributos data-value del HTML
    countersConfig.forEach(config => {
        const element = document.getElementById(config.id);
        if (element && element.dataset.value) {
            config.initialValue = parseFloat(element.dataset.value);
            config.element = element; // Guardamos la referencia al elemento para no buscarlo cada vez
        }
    });

    const startTime = Date.now();

    // MEJORA 2: Bucle de Animación Optimizado con requestAnimationFrame
    // Usamos un único bucle para actualizar todos los contadores. Es mucho más
    // eficiente que múltiples setIntervals.
    function tick() {
        const elapsedTime = Date.now() - startTime;
        const elapsedSeconds = elapsedTime / 1000;

        countersConfig.forEach(config => {
            if (!config.element || typeof config.initialValue === 'undefined') return;

            // MEJORA 3: Motor de Actualización Realista (Basado en el Tiempo)
            // Calculamos el valor actual basado en el tiempo real transcurrido.
            // Esto es mucho más preciso y realista que un incremento fijo.
            const currentValue = config.initialValue + (elapsedSeconds * config.ratePerSecond);
            
            // Usamos el formateador específico para mostrar el valor
            config.element.textContent = config.formatter(currentValue);
        });

        // Solicita al navegador que ejecute 'tick' en el próximo frame de animación
        requestAnimationFrame(tick);
    }

    // Inicia el bucle de animación
    requestAnimationFrame(tick);
});


// MEJORA 4: Funciones de Formato Reutilizables y Claras
// Estas funciones se encargan solo de la presentación, separando la lógica.
const esDO_Locale = 'es-DO';

function formatCurrency(value, decimals = 0) {
    return new Intl.NumberFormat(esDO_Locale, { 
        style: 'currency', 
        currency: 'USD',
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
    }).format(value);
}

function formatPercentage(value, decimals = 1, showSign = false) {
    let options = {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
    };
    if (showSign) {
        options.signDisplay = 'always';
    }
    return new Intl.NumberFormat(esDO_Locale, options).format(value) + '%';
}

function formatNumber(value) {
    return new Intl.NumberFormat(esDO_Locale).format(Math.floor(value));
}
