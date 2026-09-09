# Validación de la entrega

Fecha: 9 de septiembre de 2026.

## Entorno

- Windows, Node.js 24.15.0 y npm 11.12.1.
- Vite 7.3.6, Three.js 0.180.0, Playwright 1.63.0.
- Chrome en modo headless con WebGL mediante SwiftShader.
- Escritorio: 1440 × 1000. Móvil táctil: 390 × 844, DPR 2. Tableta: 820 × 1180, con texto ampliado al 200%.

## Comprobaciones

- `npm ci`: correcto, 0 vulnerabilidades reportadas.
- `npm run dev -- --port 5173 --strictPort`: servidor operativo, respuesta HTTP 200.
- `npm run inspect:models`: los 20 archivos se analizan; resultado en `model-inspection.json`.
- `npm run test`: 6 pruebas correctas con el build presente (integridad de assets, rutas y modelos del build, ritmo, persistencia, almacenamiento defectuoso y porcentaje de escenarios). En un checkout limpio, la prueba de `dist/` se ejecuta después del build mediante `npm run test:dist`.
- Navegador: 8 casos comprobados, incluidos todos los recorridos, RCP mediante teclado, ambas variantes, botiquín, tacto, fuentes, errores recuperables, navegación rápida, almacenamiento bloqueado y ampliación de texto.
- Raycasting: clic real en la proyección del pecho, confirmación del paso y activación del clip de compresión.
- Botiquín: cambio verificado del cuaternión de la tapa tras reproducir su animación.
- Recursos: dos recorridos consecutivos por Introducción, Hemorragias, RCP y Botiquín terminaron con **141 geometrías, 46 texturas y 12 assets en caché** en ambos casos. Escena final del botiquín: 116 draw calls y 73 656 triángulos, con debug activado.
- Versión de producción: carga de la sala y de los siete módulos; ninguna excepción JavaScript ni mensaje de consola de nivel error en el recorrido normal. Debug ausente del objeto global en producción.
- SHA-256: todos los GLB mantienen el contenido registrado antes de la implementación.
- `npm run build`: correcto. Vite emite una advertencia de tamaño por el chunk de Three.js (~545 kB minificados; ~138 kB gzip), separado del código de la aplicación.

El entorno restringido bloqueó inicialmente la lectura de configuración de Vite dentro de la prueba de producción. La misma prueba terminó correctamente al ejecutarse con el permiso de proceso correspondiente; no fue un fallo de la aplicación.

Las capturas están en `test-results/`. La medición de recursos comprueba estabilidad en los recorridos probados, no descarta cualquier fuga posible. El render por software de las pruebas no permite prometer 60 FPS en dispositivos reales. No se ha medido capacidad clínica ni se ha utilizado un sensor físico.
