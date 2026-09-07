# RD Debt Clock

Tablero independiente de deuda pública y economía de la República Dominicana.

## Estructura

- `index.html`: tablero principal.
- `fuentes.html`: fuentes, definiciones y fórmulas.
- `data/data.json`: única fuente local de indicadores y metadatos.
- `script.js`: renderizado, filtros y contador interpolado.
- `style.css`: sistema visual y diseño adaptable.

## Criterio de datos

Todo indicador se clasifica como `official`, `derived` o `estimate`. Cada registro incluye período, fuente y enlace. El contador móvil es una interpolación y no debe presentarse como una publicación oficial segundo a segundo.

## Publicación

Sitio estático compatible con GitHub Pages y el dominio configurado en `CNAME`.
