# Movimiento y combate local

Cristian confirmó que en PC el juego corre fluido pero el movimiento se siente rígido. Esta tanda se concentra en controles y combate de `/visual.html`, sin cambiar el servidor cooperativo ni añadir dependencias.

- Aceleración breve, frenado más rápido, inversión gradual de dirección y velocidad anulada contra obstáculos, al pausar y al reaparecer.
- Un solo giro hacia el apuntado o movimiento; pasos con menor cadencia y desplazamiento lateral de piernas al apuntar caminando. Cámara amortiguada con salto inmediato al reaparecer o cambiar vista de mapa.
- Cinco enemigos iniciales: caminante (70 HP, velocidad 0.9), corredor (45 HP, velocidad 2), blindado (140 HP, velocidad 0.55). Dos enemigos adicionales por oleada hasta trece y ocho HP adicionales por oleada superada. Los ataques mantienen alcance, cadencia y munición compartidos.
- Ropa diferenciada, casco y protección del blindado; barras de vida. Geometría y materiales siguen perteneciendo al ModelKit compartido.

Se añadieron cinco pruebas: aceleración/frenado/pausa, inversión, composición y progresión de oleadas, velocidad del corredor y cadencia/desplazamiento lateral. Fallaron antes de implementar y pasaron después. 50 pruebas unitarias/integración y 12 de navegador pasaron, y la compilación terminó correctamente. Chromium se ejecutó mediante `/usr/bin/chromium`; el primer intento de navegador no pudo iniciar por faltar el binario predeterminado de Playwright.

La revisión independiente detectó que la escala de la barra reemplazaba su anchura inicial; se corrigió multiplicando por 0.66. Tras este ajuste y mantener el foco de cámara al redimensionar, se repitieron compilación y las comprobaciones de teclado, cultivo/oleada y controles móviles.

Sigue siendo una prueba local sin guardado; el balance y la comodidad necesitan valoración del jugador. Las pruebas móviles son emuladas, no una medición de rendimiento en un teléfono real.
