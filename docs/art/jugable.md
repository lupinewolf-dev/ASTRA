# Cómo jugar la granja 3D

Actualiza el código conservando `data`, ejecuta `npm.cmd ci` y `npm.cmd run dev`, y abre `http://localhost:5173/visual.html`. Desde el celular en la misma Wi-Fi, usa la IP de la PC con puerto 5173 y la misma ruta. Mantén la terminal abierta.

También puedes [descargar el demo compilado](https://github.com/lupinewolf-dev/ASTRA/raw/refs/heads/main/downloads/ASTRA-demo.zip), extraerlo y abrir **JUGAR.cmd**, sin npm. La pantalla inicial explica los controles y mantiene la partida pausada hasta pulsar Jugar.

## Primer objetivo

Cosecha **tres parcelas** y sobrevive **una oleada**. Empiezas con cultivos listos, una pistola, balas y recursos. La primera oleada llega en 90 segundos; puedes pulsar **Adelantar oleada** para probarla antes.

## Controles

| Acción | PC | Celular |
|---|---|---|
| Caminar | WASD o flechas | Joystick izquierdo |
| Apuntar | Mover el mouse sobre el escenario | Joystick derecho |
| Disparar | Automático al apuntar con enemigos a alcance | Automático mientras apuntas |
| Esquivar | Espacio | Botón Esquiva |
| Acción cercana | E | Botón contextual |
| Fabricar 12 balas | C, cerca de la mesa frente a la casa | Botón Balas |
| Comer y recuperar vida | H | Botón Comer |
| Ver el mapa completo / volver | M | Botón Ver mapa |
| Pausar | Escape o botón | Botón Pausar |

Al soltar un joystick se detiene esa acción; puedes mover y apuntar con dos dedos simultáneos.

## Cultivo y preparación

Acércate a un bancal listo y pulsa **Cosechar**. Luego la misma parcela permite **Sembrar** y **Regar**. Tras 45 segundos regada vuelve a estar lista; cosechar da comida y semillas. Explora el bosque y el sector de frutales para madera, los afloramientos para piedra y el campamento para provisiones. Los recursos se regeneran.

La mesa frente a la casa fabrica 12 balas gastando 2 de madera y 2 de piedra. Comer gasta una comida y recupera 25 de vida. Las cercas protegen el huerto, reciben daño de los zombis y puedes repararlas al acercarte, gastando madera. Si caes, vuelves al refugio y dejas parte de los recursos en una mochila que se puede recuperar.

El juego pausa al ocultar la página o cambiar de ventana. Este checkpoint es **local y sin guardado**: al recargar vuelve al comienzo. Las partidas cooperativas anteriores siguen disponibles en `/`. Los gráficos y enemigos siguen siendo provisionales, y falta comprobar rendimiento en iPhone/Android físicos.

El movimiento tiene un arranque y frenado breves, giro suave y cámara amortiguada. Al apuntar, puedes caminar de costado. Las oleadas empiezan con cinco enemigos: caminantes (70 de vida), corredores (45, más rápidos) y blindados (140, más lentos). Cada oleada superada añade dos enemigos hasta trece, y ocho puntos de vida por enemigo. Las barras sobre los zombis muestran la vida restante.

La esquiva sigue la dirección de movimiento (o de apuntado si estás quieto), protege brevemente y recarga en 1,8 segundos. No atraviesa obstáculos. Los impactos iluminan al enemigo y recibir daño marca los bordes de la pantalla. **Ayuda** vuelve a abrir las instrucciones y pausa la partida.
