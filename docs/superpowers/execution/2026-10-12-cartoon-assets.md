# Implementación del estilo caricaturesco aprobado

El usuario aprobó `docs/art/personajes-propuesta-caricaturesca.png` y pidió crear e implementar lo necesario. Se adaptó la fábrica de assets existente a proporciones de cabeza grande, superficies redondeadas y materiales mates, conservando las identidades, accesorios, controles y caminata.

Geometría esférica y cajas redondeadas compartidas por escena, materiales suaves en caché y disposición explícita de todos los recursos. Cabeza articulada agrupa cara y peinado; sonrisa curva y ojos simples. Mochila, martillo, jardinero, bolso y pañuelos permanecen asociados al cuerpo. No se añadieron dependencias ni se modificaron las partidas; se mantiene la demo `/visual.html`.

Validación RED→GREEN: la nueva prueba de proporciones y agrupación facial falló antes de implementar. Resultado final: 32 pruebas unitarias/integración, 9 de navegador y build exitosos. Render de escritorio inspeccionado; capturas de escritorio y móvil actualizadas. Sigue pendiente probar rendimiento en teléfonos físicos. La implementación es una adaptación procedural simplificada, no una reproducción exacta de la lámina generada ni archivos GLB exportados.
