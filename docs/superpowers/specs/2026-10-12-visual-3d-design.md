# ASTRA: primera etapa visual en 3D

## Intención y límites
El usuario quiere una granja acogedora con una apariencia próxima a la referencia visual de Tunic: volumen, formas geométricas suaves, iluminación cálida y perspectiva isométrica. La versión actual se siente provisional y el panel lateral vuelve especialmente incómodo jugar en celular. Pide avanzar primero con lo visual y parar al final de etapas pequeñas para limitar el consumo de uso.

Esta etapa produce una escena visual revisable. La comodidad de controles y la sustitución completa del cliente se implementan en etapas posteriores. No se modifican cuentas, servidor, inventarios ni partidas existentes.

## Enfoque elegido
Three.js con cámara ortográfica isométrica. Permite iluminación y sombras reales con modelos originales de geometría sencilla, manteniendo el juego web para PC/celular. Mejorar los dibujos de Phaser sería una alternativa de menor coste, pero ofrece menos control sobre el volumen y la iluminación deseados.

El primer resultado vive en una entrada independiente `apps/client/visual.html`, con un mapa de demostración local creado a partir de los tipos existentes. La entrada habitual del juego sigue funcionando durante la revisión. No se añade un servidor ni autenticación a la muestra visual.

## Aspecto de la primera escena
- Una casa de campo de techo rojizo, puerta, ventanas, porche y chimenea.
- Suelo continuo verde, sendero de tierra, parcelas con plantas, árboles con copas volumétricas, piedras y cercas de madera.
- Dos personajes originales estilizados, con cuerpos y cabezas de volumen y vestimentas diferentes; sus siluetas deben distinguirse del escenario.
- Cámara elevada fija que muestre casa, cultivos y personajes juntos. La imagen se adapta al tamaño de pantalla sin estirarse.
- Luz de tarde cálida, sombras suaves y paleta verde/crema/terracota. Sin contornos de cuadrícula permanentes, etiquetas flotantes abundantes ni panel lateral.
- Relieve decorativo fuera del área central y vegetación dispersa para dar profundidad, sin cambiar las coordenadas de simulación.

Los modelos se generan con geometría original en código. Esta etapa no depende de paquetes de arte externos, imágenes generadas o modelos descargados. Animaciones de trabajo/combate y arte adicional quedan para la siguiente revisión visual.

## Componentes y comportamiento
`visual.ts` monta la muestra, configura resize y libera recursos al salir. `visual/scene.ts` administra cámara, iluminación y render. `visual/models.ts` crea casa, plantas, árboles, cercas y personajes. Se reutilizan coordenadas y datos de `World`; sus valores x/y se proyectan sobre el plano x/z de la escena.

El render no altera World. El prototipo no envía comandos ni guarda datos. Restringir la densidad de píxeles a 1.5, compartir geometrías/materiales y usar una sola luz con sombras limita el coste en celular. Si WebGL no está disponible, mostrar una explicación legible en español; no dejar una pantalla en blanco.

## Validación y cierre de etapa
Compilar y comprobar tipos. Abrir la muestra en navegador de escritorio y viewport móvil, verificar que renderiza sin errores, adapta el encuadre y se ve sin panel lateral. Conservar capturas de ambas vistas para revisión. El juego existente debe seguir compilando.

Parar al entregar las capturas y la muestra; no integrar todavía el nuevo render ni rehacer los controles. El usuario decide si esta dirección visual se acerca a lo que imaginaba antes de invertir en animaciones e integración. Rendimiento y compatibilidad en teléfonos reales siguen pendientes de prueba; una captura emulada no los confirma.

## Continuación prevista
Si el aspecto se aprueba, siguiente etapa: personajes animados y render conectado al estado multijugador. Después: interfaz mínima, acciones contextuales y controles móviles cómodos. No se acumulan estas etapas en una ejecución larga sin la intervención del usuario.
