# Granja cooperativa contra zombis — diseño de primera versión

## Objetivo y acuerdos
Juego web para el usuario y su novia, accesible desde Windows 10, Android e iOS. Cada jugador tiene una cuenta y un personaje y conserva su progreso entre dispositivos. La ambientación es una granja acogedora tras el apocalipsis, representada en vista isométrica con apariencia de volumen mediante gráficos 2D.

Mundo privado compartido para dos jugadores. Cualquiera puede jugar sin el otro. Cuando no hay jugadores conectados, toda la simulación se pausa: cultivos, enemigos y temporizadores. El servidor guarda la partida y debe estar disponible para entrar; cerrar el navegador del creador no cierra el mundo.

## Ciclo de juego aprobado
Cultivar y explorar, recolectar recursos, fabricar munición, construir defensas, recibir un aviso, defender la granja y reparar o mejorar el refugio. Las oleadas llegan por tiempo de juego activo, no por activación manual.

Dificultad configurable: tranquila, normal y difícil con 15, 10 y 5 minutos de preparación respectivamente. Cambian cantidad y resistencia de zombis. La primera oleada espera un período completo. El aviso comienza un minuto antes del ataque. La preparación siguiente comienza cuando termina la oleada. Los cambios de dificultad se aplican a la siguiente preparación y no reinician una oleada activa.

La cantidad de enemigos se calcula según los jugadores conectados al iniciar la oleada; incorporarse o salir durante ella no crea ni elimina enemigos. Toda la simulación se congela cuando sale el último jugador, incluso durante un ataque.

## Alcance aprobado
- Un mapa pequeño con casa/refugio, parcelas, árboles, piedras y suministros de exploración.
- Un cultivo: sembrar, regar y cosechar; la comida recupera salud.
- Recursos compartidos mediante un almacén del refugio e inventarios individuales.
- Cercas colocables, reparables y destructibles por zombis.
- Pistola con disparo automático mientras el jugador apunta y tiene munición, y arma cuerpo a cuerpo.
- Un tipo de munición, obtenible de suministros y fabricable en una mesa de trabajo.
- Mejoras de resistencia de cercas y daño de pistola mediante recursos.
- Muerte suave: reaparecer en la casa, conservar mejoras, dejar la mitad de los recursos y munición transportados, redondeada hacia abajo, en una mochila recuperable. Armas y herramientas se conservan. Ambas personas pueden recuperar la mochila.
- Un tipo de zombi que se dirige hacia jugadores y rompe cercas que bloquean su camino. La casa funciona como punto seguro de reaparición y no es destruible en esta versión.

Animales, decoración extensa, más armas, otros mapas, PvP y matchmaking quedan fuera de esta versión. Los valores de economía, daño y velocidad se centralizan para ajustarlos tras jugar.

## Controles e interfaz
PC: WASD/flechas para moverse, ratón para apuntar; apuntar activamente habilita el disparo automático, con un control explícito para dejar de disparar. Celular: controles táctiles separados de movimiento y puntería; soltar el control de puntería detiene el disparo. Los menús bloquean el disparo. La ausencia de munición detiene los tiros y muestra aviso sin cambiar automáticamente de arma.

Interacciones cercanas mediante botón/tecla contextual. Modo de construcción muestra una previsualización válida o inválida antes de colocar cercas; no permite bloquear el punto de reaparición. HUD con salud, munición, recursos y tiempo hasta la oleada. Pantalla de cuenta, creación/invitación al mundo y selección de dificultad. Interfaz en español, orientación horizontal recomendada, aviso para rotar en pantallas estrechas.

## Propuesta técnica para revisión
Cliente Phaser con TypeScript y Vite; render isométrico con sprites o figuras originales provisionales, sin recursos sujetos a licencias desconocidas. Simulación en coordenadas de mapa independientes de la proyección visual.

Servidor Node.js/TypeScript con Colyseus para sesiones y sincronización por WebSocket. El servidor es la autoridad sobre movimiento, colisiones, ataques, munición, inventarios, fabricación y oleadas; el cliente transmite intenciones y representa el estado. Validar alcance, cadencia y recursos en el servidor impide duplicación por solicitudes simultáneas.

SQLite en un volumen persistente para un único servidor y un mundo de dos jugadores; acceso mediante migraciones y transacciones. Componentes separados: reglas compartidas, cliente visual, simulación, cuentas/invitaciones y persistencia. No ejecutar múltiples instancias contra el mismo archivo. Copias de seguridad antes de migraciones.

Cuentas con nombre de usuario y contraseña almacenada como hash resistente, sesiones por cookie HttpOnly y comprobación de sesión al conectar al mundo. Invitaciones privadas de un solo uso, con caducidad; límite de dos miembros. Validación de origen, límites de intentos y TLS en despliegue. No se necesita correo ni recuperación automática en esta primera versión; una futura recuperación deberá diseñarse sin almacenar contraseñas en claro.

El despliegue requiere alojamiento del servidor y almacenamiento persistente. No se presupone un proveedor contratado ni un despliegue público realizado. Publicar o contratar servicios se decide por separado. Una aplicación web instalable puede añadirse después; el multijugador requiere conexión, incluso si la interfaz está instalada.

## Guardado, pausa y fallos
Guardar cambios duraderos de inventario, construcción, fabricación y cuentas en transacciones. Guardar el estado de simulación periódicamente y al desconectarse el último jugador o apagar ordenadamente el servidor. Tras una caída abrupta se puede perder hasta un intervalo de guardado del movimiento y los temporizadores; objetivo inicial de cinco segundos. No afirmar guardado exitoso ante un error de base de datos; detener las acciones mutables y mostrar un fallo recuperable.

Tras una desconexión, el personaje deja de participar en la simulación cuando el servidor detecta el cierre o el timeout. Reconectar recupera su estado del servidor y no repite compras ni fabricación. Reiniciar el servidor restaura el estado pausado; no avanza tiempo durante el apagado. Un mundo sin conexiones puede descargarse de memoria tras guardar.

## Validación y criterio de versión jugable
- Pruebas de reglas: cultivo, costes y fabricación, cadencia y consumo de munición, daños y reparaciones, muerte y mochila.
- Pruebas de simulación: aviso/oleada, dificultad, ajuste a uno/dos jugadores y pausa sin conexiones.
- Pruebas de integración: dos clientes en el mismo mundo, exclusión de terceros, invitación, desconexión/reconexión, persistencia tras reiniciar y transacciones simultáneas.
- Build y comprobación de tipos de cliente y servidor.
- Prueba funcional con dos sesiones: cultivar, recolectar, fabricar, construir, apuntar/disparar, superar una oleada y recuperar una mochila.
- Validar controles táctiles y ratón mediante navegador; verificar Safari en un iPhone y Chrome en Android reales antes de afirmar compatibilidad móvil completa. Emulación no sustituye esa validación.

La versión está lista para probar juntos cuando ambos pueden entrar por separado, progresar en el mismo mundo y completar este ciclo sin pérdida o duplicación de recursos. Rendimiento objetivo: 30 FPS en un celular de gama media, pendiente de validación real. Los gráficos iniciales son provisionales y la publicación no forma parte de la validación local.
