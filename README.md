# Hundres Series (Angular)

Migración a Angular 21 de la app HTML/JS del repo `ScoobyDoo` (audiolibros y películas de Harry Potter).

## Desarrollo

```bash
npm install
npm start          # http://localhost:4200
npm run build      # genera dist/harry-angular/browser (+ 404.html para GitHub Pages)
```

## Estructura

- `src/environments/` — URL del backend: `environment.development.ts` (`http://localhost:8000`, usado por `npm start`) y `environment.ts` (`https://harry.alwaysdata.net`, usado por `npm run build`).
- `src/app/core/` — modelos, catálogo, `AuthService`, `SeriesService` (API + extracción de URLs de pCloud), interceptor (token + 401) y guards.
- `src/app/pages/ingreso` — login.
- `src/app/pages/registro` — alta de usuarios (solo usuarios con `ttp === 'ffp'`).
- `src/app/pages/inicio` — catálogo de audiolibros y películas.
- `src/app/pages/reproductor` — reproductor de video/audio con lista de capítulos, reanudación, "Saltar intro" y paso automático al siguiente capítulo.
- `src/app/shared/cielo-magico` — fondo animado (estrellas, destellos, chispas y estrellas fugaces; solo CSS).
- `public/` — imágenes, favicon, `CNAME` y `fonts/harryp.woff2` (tipografía Harry P, ver `fonts/LEEME.txt`).

## Rutas

| Nueva | Antigua (redirige) |
|---|---|
| `/ingreso` | `ingreso.html` |
| `/` | `indexSeriesAll.html` |
| `/serie/:nombreSerie` | `index.html?nombreSerie=...` |
| `/registro` | `registro.html` |

## Despliegue en GitHub Pages

Publicar el contenido de `dist/harry-angular/browser/` (incluye `CNAME` y `404.html`, necesario para que las rutas profundas funcionen al recargar).

## SetiReplay (grabación de sesiones)

El SDK está en `vendor/setireplay-0.3.0.tgz` (instalado como `file:vendor/...` para que funcione en cualquier máquina y en CI). Para actualizarlo: en el repo de SetiReplay `npm run pack:sdk`, copiar el nuevo `.tgz` a `vendor/` y `npm install ./vendor/setireplay-x.y.z.tgz`.

- Configuración: `setiReplay.serverUrl` y `setiReplay.projectKey` en `src/environments/`. Si alguno está vacío, no se graba.
- `src/app/core/session-replay.service.ts`: carga el SDK de forma diferida, hace `init()` al arrancar, `identify(email, { rol })` tras el login (o al arrancar si ya hay sesión) y `stop()` + `init()` al cerrar sesión.
- `excludeUrls: ['/ingreso']`: el login no se graba mientras el usuario es anónimo (requiere SDK ≥ 0.2.0).
- Se enmascara además el header `x-access-token` (token de esta app). Contraseñas y `token` ya se enmascaran por defecto.
- En el panel de SetiReplay, el proyecto debe permitir los orígenes `http://localhost:4200` (desarrollo) y `https://series.hundres.com` (producción).
