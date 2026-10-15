# Demo descargable y respuesta del combate

**Paquete retirado:** el usuario reportó que Microsoft Defender detectó `Trojan:Script/Ulthar.A!ml` en `ASTRA-demo.zip`. Se retiraron el archivo distribuido, los scripts del lanzador y las instrucciones para ejecutarlo. Las comprobaciones funcionales descritas a continuación no son un análisis antivirus; la causa de la detección no está determinada. El desarrollo vuelve al flujo de código fuente con npm. El ZIP retirado tenía SHA-256 `6347710227524e1d3fc0ffe75103c4db37a9dd56d67afbd3c78ab944d23d79c6`. El registro de trabajo original se conserva abajo.

Solicitud: mejorar la versión existente y entregar un demo jugable, manteniendo una tanda acotada por la preferencia previa de consumo del usuario.

Cambios:
- Esquiva con Espacio o botón, movimiento de 180 ms, protección breve y recarga de 1,8 s. Barrido en pasos cortos comprueba obstáculos; pausa y reaparición cancelan el impulso.
- El mouse vuelve a proyectarse cada cuadro al caminar; los eventos de salida/foco cancelan el apuntado. Animación de piernas de enemigos, destello al impactar, indicador de daño del jugador y barra de vida.
- Ayuda modal con objetivo y controles; pausa la simulación. `?demo=1` muestra la bienvenida inicial.
- `downloads/ASTRA-demo.zip` contiene juego compilado, servidor estático Node sin dependencias, `JUGAR.cmd` y LEEME. El servidor muestra dirección para celular en la misma red y abre el navegador en Windows. `scripts/package-demo.py` reconstruye el paquete.

Validación:
- Dos pruebas de esquiva fallaron antes de implementación; después pasaron las 52 pruebas unitarias/integración.
- Compilación y empaquetado exitosos. Revisión independiente sin hallazgos críticos/importantes.
- 14 escenarios de navegador comprobados. La primera pasada dio 13 éxitos y un timeout al esperar la recarga bajo Chromium con WebGL por software y otra instancia simultánea. El contador seguía avanzando; se amplió únicamente la espera de esa prueba a 15 s. Ambas pruebas nuevas pasaron al repetirlas secuencialmente.
- ZIP extraído en una ruta con espacios, servidor iniciado sin dependencias npm. Chromium cargó bienvenida, inició partida, cosechó/sembró/regó, esquivó y adelantó una oleada, sin errores de JavaScript. Comprobadas respuestas de rutas fuera del directorio web y métodos no admitidos.
- Capturas reales inspeccionadas: bienvenida, partida empaquetada y controles móviles. No se ejecutó el archivo CMD en Windows ni se midió rendimiento de un celular físico; la prueba del paquete fue en Linux con Chromium.

Demo local de una persona, sin persistencia. El cooperativo original continúa en su entrada separada del repositorio y no se incluye como partida funcional en este paquete.
