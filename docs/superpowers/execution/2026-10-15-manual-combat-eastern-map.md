# Disparo manual y sector este de la granja local

Cristian pidió gastar menos balas, un arma de mano, más mapa y más objetos interactivos. La implementación modifica `/visual.html` y su simulación local.

- Apuntar con mouse o joystick orienta al personaje. Cada clic sobre el mapa, pulsación de J o botón Disparar solicita un tiro. Sin zombis en alcance, sin balas o durante la recarga no se gasta munición. F / Golpear usa el hacha de mano y funciona sin balas. La mira se conserva al soltar el joystick para poder pulsar el botón con el mismo dedo.
- Se extendió el terreno del este hasta unas 44 × 30 unidades, con sendero, árboles, afloramiento de piedra, pozo, caja de provisiones y cartel. La vista completa usa el nuevo centro del mapa. Los zombis también aparecen por el borde este.
- Interacción contextual: la caja da ocho balas y una comida cada 120 s de tiempo activo; el pozo cura 20 puntos con espera de 60 s; el cartel señala ambos lugares. Los recursos nuevos siguen las reglas de recolección existentes.
- La ayuda y los controles muestran el disparo manual. El juego original en `/` continúa como una página separada; este cambio es de la granja local.

Tres pruebas nuevas fallaron antes del cambio; las pruebas unitarias/integración completas pasaron (57). El ajuste del límite del mapa y el test de dos disparos corrigieron dos expectativas del mapa y cadencia anteriores. La compilación pasó. La prueba posterior de navegador verifica cultivo/oleada/mapa, apuntado sin consumo, botón/tecla de disparo, móvil y bienvenida. No se generó ZIP ni ejecutable.
