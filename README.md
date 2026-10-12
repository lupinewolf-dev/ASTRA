# ASTRA · Nuestro refugio

Juego web cooperativo privado para dos personas: granja isométrica, cultivo, recolección, refugio, cercas y oleadas anunciadas de zombis. Pistola de disparo automático mientras apuntas, munición encontrada/fabricada y combate cuerpo a cuerpo. El mundo se pausa cuando no queda nadie conectado.

## Ejecutar en Windows 10

Instala **Node.js 24 LTS** y Git. Abre esta carpeta en VS Code y una terminal PowerShell:

```powershell
npm ci
npm run dev
```

Abre el navegador en el puerto **5173** de tu PC. Crea tu personaje (contraseña de al menos diez caracteres), crea la granja y pulsa **Invitar pareja**. Tu pareja crea su propio personaje y pega el código antes de entrar. Cada cuenta tiene un personaje y una granja; conserva la contraseña, todavía no existe recuperación por correo.

## Jugar desde un celular en la misma red

Mantén la PC y `npm run dev` encendidos. Busca la dirección IPv4 de tu PC con `ipconfig`; en el celular abre `http://DIRECCION-IP:5173`. Ambos dispositivos deben estar en la misma red. Si Windows lo solicita, permite Node en **redes privadas**. No abras puertos del router ni expongas el servidor de desarrollo a Internet.

En PC: WASD/flechas para moverse, mantén pulsado el ratón sobre el escenario para apuntar/disparar y suelta para detenerte; **E** interactúa con el objeto más cercano. En celular: controles separados de movimiento y puntería. **Cerca** activa construcción; toca una casilla libre cercana y vuelve a pulsar Cerca para cancelar. Acércate a la entrada de la casa para fabricar, mejorar la pistola o usar el almacén. Cultivo: interactuar para sembrar, otra vez para regar, y cuando esté listo para cosechar.

Las oleadas llegan tras 15/10/5 minutos de preparación activa según la dificultad. Hay aviso un minuto antes. En solitario se generan menos enemigos. La muerte devuelve al refugio y deja la mitad de los recursos transportados en una mochila recuperable por cualquiera de los dos.

## Guardado y ejecución compilada

La base SQLite está en `data/farm.sqlite`; no la borres si quieres conservar cuentas y partida. Para respaldarla, detén el servidor y copia toda la carpeta `data`, incluido cualquier archivo WAL/SHM. No ejecutes varias instancias sobre la misma base. `DATABASE_PATH` permite cambiar su ubicación.

```powershell
npm run build
npm start
```

El servidor compilado sirve el juego en el puerto **3001** y guarda los datos en el mismo lugar. `PORT` cambia ese puerto. Para desarrollo local no necesitas configurar secretos.

Para acceder desde redes distintas o dejar la PC apagada hará falta un alojamiento persistente. El despliegue público requiere HTTPS/WSS, `NODE_ENV=production`, `ALLOWED_ORIGINS` con los orígenes HTTPS exactos (separados por comas), volumen persistente y una sola instancia. Ejemplo no secreto: `ALLOWED_ORIGINS=https://juego.example.com`. `npm start` carga variables del proceso, no lee automáticamente `.env`. No se ha contratado ni desplegado un servidor público.

## Comprobaciones

```powershell
npm test
npm run typecheck
npm run build
npx playwright install chromium
npm run test:e2e
```

Las pruebas de navegador crean datos temporales independientes y un puente de observación solo en modo Vite `test`; no hay comandos de administración o de recursos gratuitos en la aplicación pública. Si ya tienes Chromium instalado puedes configurar `PLAYWRIGHT_CHROMIUM_EXECUTABLE` con su ruta para evitar descargarlo. Las pruebas usan los puertos 3001 y 5173, que deben estar libres.

Gráficos originales provisionales generados con figuras. El navegador emulado no demuestra rendimiento ni compatibilidad completa con Safari de iPhone/Chrome de Android reales; esa validación necesita ambos dispositivos. El juego necesita conexión; instalación como PWA, audio y arte definitivo quedan para iteraciones posteriores.

## Estructura

- `packages/shared`: reglas y tipos de simulación independientes de la vista.
- `apps/server`: autenticación, invitaciones, Colyseus y SQLite.
- `apps/client`: Phaser, pantalla de cuenta, interfaz y controles.
- `tests/e2e`: pruebas de navegador para dos jugadores y controles móviles.
- `docs/superpowers`: diseño y plan aprobados.
