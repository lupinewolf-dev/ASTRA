# Cómo jugar la granja 3D

Actualiza el código conservando `data`, ejecuta `npm.cmd ci` y `npm.cmd run dev`, y abre `http://localhost:5173/visual.html`. Desde el celular en la misma Wi-Fi, usa la IP de la PC con puerto 5173 y la misma ruta. Mantén la terminal abierta.

Para ver la ayuda inicial abre `http://localhost:5173/visual.html?demo=1`. La partida permanece pausada hasta pulsar Jugar.

El paquete compilado y el lanzador de doble clic se retiraron tras una alerta de Defender. Usa la distribución de código fuente indicada arriba; si también genera una alerta, no la omitas. La causa de la detección sigue sin determinarse.

## Primer objetivo

Cosecha **tres parcelas** y sobrevive **una oleada**. Empiezas con cultivos listos, una pistola, balas y recursos. La primera oleada llega en 90 segundos; puedes pulsar **Adelantar oleada** para probarla antes.

## Controles

| Acción | PC | Celular |
|---|---|---|
| Caminar | WASD o flechas | Joystick izquierdo |
| Apuntar | Mover el mouse | Joystick derecho |
| Disparar una bala | Clic izquierdo sobre el mapa o J | Botón Disparar o tocar el mapa |
| Golpear de cerca | F | Botón Golpear |
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

Apuntar no gasta balas. Cada clic, pulsación de J o toque de **Disparar** intenta un solo tiro. La pistola espera si está recargando o si ningún zombi está a su alcance; un tiro mal orientado puede fallar y consumir una bala. El golpe con F funciona incluso sin munición.

El mapa local se amplió hacia el este (unos 44 × 30). En el camino hay un cartel con pistas, un pozo que restaura vida con espera y una caja que entrega balas y comida cada cierto tiempo. También hay árboles y piedra para recolectar. **M / Ver mapa** muestra toda la zona.

El movimiento tiene un arranque y frenado breves, giro suave y cámara amortiguada. Al apuntar, puedes caminar de costado. Las oleadas empiezan con cinco enemigos: caminantes (70 de vida), corredores (45, más rápidos) y blindados (140, más lentos). Cada oleada superada añade dos enemigos hasta trece, y ocho puntos de vida por enemigo. Las barras sobre los zombis muestran la vida restante.

La esquiva sigue la dirección de movimiento (o de apuntado si estás quieto), protege brevemente y recarga en 1,8 segundos. No atraviesa obstáculos. Los impactos iluminan al enemigo y recibir daño marca los bordes de la pantalla. **Ayuda** vuelve a abrir las instrucciones y pausa la partida.

## Ver las animaciones del personaje

Abre `/visual.html?personaje=1` para ver el personaje masculino de cerca. Los botones **Reposo, Caminar, Apuntar, Esquivar y Golpear** permiten revisar sus movimientos y el hacha de mano; **Ver frente / Ver espalda** cambia el ángulo. El mismo modelo articulado se usa al jugar: hombros, codos, muñecas, cadera, rodillas, tobillos y cabeza, con respiración y parpadeo. La animación sigue siendo estilizada, con piezas articuladas, sin simulación de ropa.
