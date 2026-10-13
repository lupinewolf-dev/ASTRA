# Personaje masculino: revisión del modelo 3D

Este checkpoint rehace un personaje en un visor independiente, siguiendo la propuesta caricaturesca aprobada. Las capturas `personaje-modelado-frente.png` y `personaje-modelado-espalda.png` son renders reales de la geometría en Three.js, no imágenes generadas.

Abrir `/visual.html?personaje=1` para revisar las vistas de frente y espalda. La granja `/visual.html` conserva la pareja anterior hasta que el usuario evalúe el nuevo modelo.

El asset original está en `apps/client/src/visual/male-asset.ts`: cara con mejillas y mandíbula, ojos simples con brillo, sonrisa curva, mechones curvos y afilados, chaqueta abierta con paneles, mangas y puños, postura con una mano sujetando la correa, botas, mochila, manta y martillo. El visor utiliza iluminación de estudio y sombras; esa iluminación difiere de la granja.

Es un modelo de revisión estático. Todavía requiere articulación para la caminata, adaptación a la cámara isométrica y evaluación de rendimiento en celulares antes de reemplazar los personajes. La lámina generada sigue siendo una referencia, no una garantía de reproducción exacta.
