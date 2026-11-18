// Producción (ng build). En desarrollo se reemplaza por environment.development.ts.
export const environment = {
  production: true,
  apiUrl: 'https://harry.alwaysdata.net',
  /** SetiReplay (grabación de sesiones). Si serverUrl o projectKey están vacíos, no se graba. */
  setiReplay: {
    serverUrl: '', // p. ej. 'http://<ip-de-la-pi>:3000'
    projectKey: '', // clave del proyecto, generada en el panel de SetiReplay
  },
};
