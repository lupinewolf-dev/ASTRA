# Validación de la primera versión — 12 de octubre de 2026

Entorno verificado: Linux cloud, Node.js 24.19.0, npm 11.9.0, Chromium 151 instalado en la máquina. No se ejecutó Windows ni un teléfono real.

- `npm ci --cache /workspace/.npm-cache`: instalación reproducible completada con el lockfile.
- `npm test`: 25 pruebas de reglas, almacenamiento, HTTP, conexiones reales Colyseus y controles.
- `npm run build`: comprobación de tipos y compilaciones de cliente/servidor completadas.
- `PLAYWRIGHT_CHROMIUM_EXECUTABLE=/usr/bin/chromium npm run test:e2e`: tres pruebas completas. Dos sesiones comparten cultivo, construcción, mejoras, recursos y progreso tras reconectar; controles móviles emulados disparan y se detienen; una oleada anunciada permite morir, recuperar mochila y completar la defensa.
- `npm start`: cliente compilado servido, health correcto, registro y creación de granja. Reinicio real del proceso conserva cuenta/granja.

El render inicial WebGL automático funcionaba a 4–5 FPS con dos sesiones en el Chromium de esta máquina. Se reutilizan los textos, los controles se transmiten sin depender del frame y se usa Canvas 2D. El recorrido completo pasa con ese cambio; no se promete el objetivo de 30 FPS en teléfonos hasta medirlo allí.

## Decisiones de ejecución y costes

- Se reutilizó el checkout cloud aislado en la rama `work`, según las instrucciones de onboarding. No se creó worktree; no añade aislamiento fuera del que aporta la plataforma.
- Los scripts auxiliares de la habilidad no estaban expuestos como ejecutables locales: se mantuvo el registro de progreso y las evidencias manualmente. El coste es mayor riesgo de omitir contabilidad, mitigado por commits y esta validación.
- Vitest usa threads para evitar que la instrumentación PM2 de Colyseus interfiera con el IPC de forks; no cambia la aplicación, pero condiciona el entorno del runner.
- Playwright usa Chromium instalado porque su dominio de descarga estaba denegado. Se conserva TLS y verificación de paquetes; la versión difiere del Chromium que distribuye Playwright y no sustituye Safari real.
- Se eligió Canvas 2D para las figuras originales de esta versión, por el rendimiento observado. El rendimiento de este backend en teléfonos queda pendiente de medición.

Los campos cloud `install_script` y `start_skill` quedaron guardados en un borrador. Su publicación corresponde al usuario; no se ejecutan al guardar. No se contrató alojamiento ni se subió código a GitHub. El remoto estaba vacío al comprobarlo; la restauración en una tarea nueva no está validada. Los archivos y commits actuales son locales y se proporciona una copia descargable del código.

## Revisión independiente y correcciones

Una revisión independiente identificó dos problemas importantes: ubicación distinta del guardado según directorio de arranque y sesiones revocadas que permanecían conectadas si no enviaban comandos. Ambos se reprodujeron con pruebas fallidas y se corrigieron: rutas de datos relativas al proyecto, verificación periódica de sesiones y pausa al expulsar la última conexión.

También se corrigió la aceptación de una dificultad mal formada, que podía provocar un falso error de almacenamiento. Se elevó su prioridad porque congelaba una partida sana; la regresión exige rechazo sin modificar el mundo. No quedaron problemas menores diferidos de esa revisión.

La revisión no evaluó Windows/teléfonos reales, rendimiento móvil ni alojamiento público: se mantienen pendientes y no se presentan como comprobados. El riesgo restante es compatibilidad o rendimiento específicos de dispositivos que todavía no se probaron.
