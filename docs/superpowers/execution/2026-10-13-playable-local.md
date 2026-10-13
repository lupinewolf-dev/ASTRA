# Mapa ampliado y primer ciclo jugable

El usuario pidió ampliar el mapa y dejarlo mínimamente jugable. Se reutilizan comandos y simulación de `packages/shared` en una sesión local independiente, sin modificar las partidas online ni sus reglas. La fuente se clona; la página `/visual.html` inicia el prototipo y `/` conserva el juego cooperativo original.

## Resultado

- Terreno de aproximadamente 30 × 28 unidades con bosque, frutales, huerta, zona de provisiones y campamento. Movimiento por el terreno, bloqueo de casa/árboles/recursos/cercas/arroyo y cruce por el puente. Cámara fija en ángulo isométrico que acompaña al personaje; M cambia a vista general.
- Cosechar, sembrar, regar y crecer en 45 segundos. Recursos renovables, provisiones, fabricación de munición en la mesa del refugio, comida para recuperar vida.
- Oleadas tranquilas cada 90 segundos, con opción de adelantarlas. Apuntado con mouse o joystick derecho, disparos automáticos con enemigos a alcance, ataques cercanos al agotarse la munición. Cercas reciben daño, desaparecen al romperse y se reparan con madera. Caer devuelve al refugio y deja una mochila recuperable.
- Objetivo inicial: tres cosechas y una oleada superada. Interacción contextual con E o botón; teclado y dos punteros táctiles independientes; ambas orientaciones móviles. Pausa al ocultar/cambiar de ventana y pausa manual.

## Implementación y decisiones

`LocalFarmGame` mantiene la sesión y reutiliza `applyCommand`/`tickWorld`; solo adapta límites, colocación y tiempos de la prueba. El renderer mantiene recursos por escena y entidades dinámicas. La cámara sigue al jugador para que el mapa mayor no reduzca los personajes a puntos. El HUD es compacto, sin panel lateral. Los objetos estáticos y plantas comparten instancias para reducir llamadas de dibujo; no se repinta una escena quieta sin cambios visuales. Instancias, materiales adicionales, observador, input, HUD y RAF se liberan al salir.

El modelo masculino revisado y su caminata se conservan. La protagonista es decorativa y mantiene el modelo anterior. El prototipo es solo local, sin guardado; recargar reinicia. No se afirma rendimiento en teléfonos físicos ni arte definitivo.

## Validación

RED→GREEN para el adaptador de juego, protección del arroyo, cercas reparables, ahorro de munición fuera de alcance y agrupación estática con límites transformados y propiedad de recursos preservados. La prueba de navegador de cultivo/oleada falló antes de conectar el HUD y pasó después.

Comprobaciones finales: **45 pruebas unitarias/integración**, **12 pruebas de navegador visuales**, **build exitoso**. Cobertura: movimiento/bordes/casa/puente, ciclo de cultivo, recursos/fabricación, pausa, combate y oleada, reparación, disposición e instancias; navegador prueba cultivo real, adelanto de oleada, pausa/foco, dos joysticks simultáneos, portrait/landscape, WebGL/fallback y navegación con caché. Capturas finales reales inspeccionadas y guardadas en docs/art.

Una revisión independiente conforme a superpowers:requesting-code-review no encontró problemas Critical/Important en comandos, input, pausa, recursos y bucle; excluyó el trabajo de cercas todavía en curso. Las cercas y el refinamiento posterior de dibujo/banco del río quedaron cubiertos por las pruebas finales. No se repitió una revisión adicional.

Entrega a main y pausa en este checkpoint para que el usuario juegue.

La inspección final del mapa completo detectó frutas separadas de la copa; se ajustó su altura. Se repitieron build y cuatro pruebas de render/cultivo/oleada/táctil y se guardaron capturas nuevas. Sin cambios posteriores de juego ni dependencias.
