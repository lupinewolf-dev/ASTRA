# Personaje articulado

Alcance pedido por Cristian: mejorar únicamente la apariencia y los movimientos del personaje, manteniendo el estilo caricaturesco. Se conservó la ropa y la identidad del personaje masculino controlable.

- Volumen de chaqueta con cintura más estrecha, hombros redondeados, antebrazos separados y manos con pulgares y pliegues discretos.
- Jerarquías cadera/rodilla/tobillo y hombro/codo/muñeca; torso y cabeza con pivotes propios. Cada ojo incluye su brillo para parpadear junto.
- Animación por distancia con transiciones amortiguadas, flexión de rodillas, compensación de tobillos, balanceo de torso/brazos, respiración, parpadeo y giro de cabeza. Poses de apuntado y esquiva; retroceso breve de muñeca al disparar. La pistola usa un anclaje en la mano.
- El visor de personaje incorpora Reposo, Caminar, Apuntar y Esquivar; reproduce el mismo modelo y controlador que la granja. Pausa el bucle si se oculta la página y libera RAF, recursos y eventos al cerrarse.

Verificación: las dos pruebas nuevas de jerarquía y movimiento fallaron antes de implementar. Después pasaron las 54 pruebas de lógica del proyecto; se repitieron las 12 de modelos/animación tras los ajustes. Cuatro pruebas de navegador finales pasaron: caminar/detenerse, visor con cambios de animación y disposición, cultivo/oleada y controles táctiles. La primera comprobación de parada detectó un residuo negativo redondeado a -0.000; se añadió convergencia exacta a cero. Una comprobación de cultivo agotó su tiempo durante recargas de desarrollo; pasó con el código estabilizado. Compilación final exitosa. Revisión independiente sin hallazgos importantes/críticos, seguida de inspección de capturas reales de frente, espalda, caminata y apuntado.

Es un modelo de piezas articuladas con animación procedural estilizada, no captura de movimiento ni deformación de ropa. La otra figura de la granja conserva su modelo anterior. La distribución continúa únicamente como código fuente; no se generó un lanzador ni un paquete compilado descargable.
