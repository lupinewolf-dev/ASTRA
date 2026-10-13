# Boceto visual de ASTRA

Esta imagen es una referencia conceptual para la nueva dirección visual. No es una captura del juego actual ni una promesa de igual detalle en la primera escena 3D.

![Granja acogedora isométrica: casa, cultivos, dos personajes y zombis al fondo](granja-concepto.png)

## Primera escena 3D ejecutada

Estas capturas son del render Three.js de la muestra `/visual.html`. Es una escena estática de revisión: todavía no sustituye el juego multijugador ni sus controles.

### Escritorio

![Escena real en escritorio](visual-desktop.png)

### Celular horizontal emulado

![Escena real en viewport móvil](visual-mobile.png)

La muestra usa modelos originales por geometría, cámara ortográfica, iluminación y sombras. La captura emulada no confirma rendimiento ni compatibilidad de teléfonos reales.

## Prueba de movimiento

La página `/visual.html` permite mover al personaje naranja por el patio frente a la casa con WASD o flechas en PC y joystick en pantallas táctiles. El segundo personaje permanece quieto. La cámara es fija; esta prueba local todavía no está conectada a las partidas ni al multijugador. El área caminable está limitada al patio para probar los controles antes de ampliar el mapa y sus colisiones. No hay animación de pasos todavía.

Al soltar el control, cambiar de ventana o ocultar la página, el movimiento se detiene. El renderizado se actualiza mientras se camina; la escena permanece en reposo cuando no hay movimiento. Las pruebas con viewport móvil no sustituyen probar en teléfonos reales.
