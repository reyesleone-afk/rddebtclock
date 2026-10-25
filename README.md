# RD Debt Clock

Tablero independiente de deuda pública y economía de la República Dominicana.

## Estructura

- `index.html`: tablero principal.
- `fuentes.html`: fuentes, definiciones y fórmulas.
- `data/data.json`: única fuente local de indicadores y metadatos.
- `script.js`: mejora progresiva, filtros y herramientas para compartir.
- `style.css`: sistema visual y diseño adaptable.
- `scripts/prerender.mjs`: sincroniza los 35 indicadores del JSON con el HTML indexable.
- `robots.txt` y `sitemap.xml`: instrucciones básicas para buscadores.
- `og-card.png`: imagen de vista previa para WhatsApp y redes sociales.

## Criterio de datos

Todo indicador se clasifica como `official`, `derived` o `estimate`. Cada registro incluye período, fuente y enlace. El saldo permanece fijo hasta una nueva publicación oficial; no se interpola por segundo.

## Actualización de datos

Después de modificar `data/data.json`, ejecutar `node scripts/prerender.mjs`. Así el HTML, los filtros JavaScript y los buscadores muestran las mismas cifras.

## Publicación

Sitio estático compatible con GitHub Pages y el dominio configurado en `CNAME`.
