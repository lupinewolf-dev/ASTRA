# Prueba local de movimiento 3D

El usuario aprobó hacer caminable la escena existente con teclado en PC y control táctil en celular, manteniendo checkpoints cortos. Implementación acotada sobre `/visual.html`: cámara fija, controles alineados con la pantalla, personaje naranja móvil y segundo personaje estático. World permanece sin modificaciones; no hay conexión al multijugador.

El personaje recorre el patio despejado (x 9–12.8, z 13–18). Este límite evita atravesar los modelos hasta implementar colisiones del mapa completo. Movimiento a 3.2 unidades por segundo, diagonales normalizadas y tiempo de frame limitado. No hay animación de pasos aún. Joystick con Pointer Events, captura táctil y cancelación; liberación, pérdida de foco, ocultamiento y pagehide limpian la entrada. Renderizado durante el movimiento, sin loop al estar quieto.

Validación RED→GREEN: dos pruebas nuevas fallaron antes de implementar controles, luego pasaron movimiento con teclado y joystick y detención al liberar/cancelar. Resultado final: 25 pruebas unitarias/integración, 9 pruebas de navegador visuales y build exitosos. Las capturas son renders reales; celulares físicos pendientes de probar. La suite conserva comprobaciones de WebGL, fallos gráficos, BFCache, disposición y entrada del juego original.

Entrega en main; detener el trabajo en este checkpoint para que el usuario pruebe los controles.
