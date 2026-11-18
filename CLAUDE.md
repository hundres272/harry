# Hundres Series (Angular)

App de audiolibros y películas de Harry Potter. Migración a Angular 21 + Angular Material de la
versión HTML/JS del repo `hundres272/ScoobyDoo` (carpeta hermana `../ScoobyDoo`, sin tocar).
Repo: `git@github.com:hundres272/harry.git` (rama `main`). Idioma del código y la UI: español.

## Comandos

```bash
npm start        # ng serve -> http://localhost:4200, backend http://localhost:8000
npm run build    # producción + copia index.html a 404.html (fallback de rutas en GitHub Pages)
```

## Arquitectura

- `src/environments/`: `apiUrl` (dev `http://localhost:8000`, prod `https://harry.alwaysdata.net`)
  y `setiReplay` (`serverUrl`, `projectKey`; vacíos = no se graba). `models.ts` reexporta `API_URL`.
- `src/app/core/`
  - `auth.service.ts`: login/registro/logout, signals `email`, `esAdmin` (`ttp === 'ffp'`),
    `puedeRegistrar` y `puedeDescargar` (ambos = `esAdmin`).
  - `auth.interceptor.ts`: añade `x-access-token` **solo** a peticiones a `API_URL` (no a pCloud,
    evita preflight CORS) y cierra sesión ante 401.
  - `series.service.ts`: API (`GET /capitulos/:serie` devuelve JSON como string; `POST /:serie`
    lee progreso; `PUT /:serie` lo guarda) y `resolverMedio()`, que extrae `publinkData` del HTML
    público de pCloud.
  - `session-replay.service.ts`: SDK SetiReplay cargado con `import()` diferido.
- `src/app/pages/`: `ingreso`, `registro` (guard admin), `inicio` (catálogo en `core/catalogo.ts`),
  `reproductor` (componente principal).
- `src/app/shared/`: `navbar` y `cielo-magico` (fondo animado de estrellas/chispas, solo CSS).

## Contratos del backend (no cambiar sin confirmar con el usuario)

- `POST /ingreso` recibe `{ email, password }`; `email` puede ser correo **o nombre de usuario**.
  Respuesta OK: `status === 'Usuario encontrado'`, con `email`, `token` y `ttp` opcional.
- `POST /registro`: OK si `status === 'Usuario guardado'`.
- Progreso: `{ email, serie, datosSerieVideos: { videoActSerie, videos: [{ video, horas, minuto, segundos }] } }`.
  `POST /:serie` responde `{ status: 'no encontrado' }` si no hay progreso.
- Claves de localStorage heredadas: `email`, `x-access-token`, `ttp`, `datosvideos`.

## pCloud

`resolverMedio()` recorre llaves para extraer `var publinkData = {...}`. Video: variante con
`isoriginal`/`transcodetype: 'original'` (MP4) usando **su** `hosts[0]` + `path`; si no,
`downloadlink`; HLS solo como último recurso. Audio: `downloadlink`. No volver a fijar el host
(antes estaba fijo a `t62.pcloud.com` y tomaba la primera variante, que es HLS) ni a cortar por
`;` o por la primera `}`.

## Reproductor (comportamientos acordados con el usuario)

- Un solo capítulo (películas): sin lista lateral ni anterior/siguiente; video a todo el ancho y
  alto bajo el header (16:9 en móvil); título y descarga debajo.
- Audio: controles propios (sin barra nativa) para precisión: ±10/±30 s, `mat-slider`, velocidad
  (persistida en `localStorage.velocidadAudio`), atajos ←/→ (Mayús = 30 s) y Espacio. Sin tarjeta
  "vidrio" en modo audio (recortaba los controles). Velocidad y descarga van en la fila de botones.
- Admins: botón de descarga (`downloadlink`) y controles nativos sin `nodownload`.
- Cuenta atrás al terminar: 10 s video, 5 s audio. Progreso se guarda al pausar, cambiar de
  capítulo, saltar intro, destruir el componente y en `beforeunload` (fetch `keepalive`).
- Rutas antiguas (`index.html?nombreSerie=`, `ingreso.html`, ...) redirigen a las nuevas.

## Estilo

Tema M3 oscuro (violeta + dorado `--oro`) en `src/styles.scss`. Títulos con `--fuente-magica`
(`public/fonts/harryp.woff2`: fuente "Harry P" de GemFonts con á é í ó ú ñ añadidas a mano; no
reemplazar por la original, que no trae tildes). Iconos: Material Symbols Rounded.

## SetiReplay

SDK en `vendor/setireplay-X.Y.Z.tgz` (`"setireplay": "file:vendor/..."`). Repo del SDK:
`/Users/hundres/Documents/spec/replay` (`npm run pack:sdk` -> `dist-sdk/`). Para actualizar:
verificar que ningún archivo de `packages/sdk/src` o `packages/shared/src` sea más nuevo que el
`.tgz`, comparar `dist/*.d.ts` entre versiones, sustituir el `.tgz` en `vendor/` y
`npm install ./vendor/setireplay-X.Y.Z.tgz`. Nunca reempaquetar con la misma versión (rompe la
integridad de `package-lock.json` en `npm ci`).
Config: `extraSensitiveHeaders: ['x-access-token']`, `excludeUrls: ['/ingreso', '/ingreso.html']`.
`identify()` se llama **después** de navegar fuera de `/ingreso`; al cerrar sesión, `stop()` + `init()`.

## Despliegue

`.github/workflows/deploy.yml` publica `dist/harry-angular/browser` en GitHub Pages (Source =
GitHub Actions) en cada push a `main`. Base href `/` (dominio `series.hundres.com`, `public/CNAME`).
