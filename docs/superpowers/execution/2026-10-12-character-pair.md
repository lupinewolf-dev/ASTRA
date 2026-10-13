# Pareja de personajes inventados

El usuario eligió personajes inventados y aprobó el diseño corto: personaje masculino de pelo oscuro despeinado, chaqueta terracota, botas y mochila de herramientas; personaje femenino de pelo castaño recogido, jardinero verde azulado, pañuelo crema y bolso de semillas. El alcance se limita a los modelos existentes y conserva cámara, controles y caminata.

Implementación: presets `masculine` y `feminine` en la fábrica de modelos compartida. Diferencias de peinado, ancho de hombros y prendas; bolsillos, botones, puños, cinturón, martillo y paquete de semillas. Los accesorios permanecen unidos al cuerpo y las extremidades conservan sus pivotes. No se agregaron dependencias, texturas externas, selección de personaje ni integración multijugador. Los modelos son assets procedurales, sin exportación GLB en este checkpoint.

Validación RED→GREEN: dos pruebas nuevas fallaron al faltar los modelos diferenciados; pasaron después. Comprobaciones finales: 31 pruebas unitarias/integración, 9 pruebas de navegador y build exitosos. Captura de escritorio inspeccionada y ambas capturas actualizadas. Rendimiento en teléfonos físicos aún pendiente. Entrega a main y pausa para revisión del usuario.
