// Desarrollo (ng serve / ng build --configuration development).
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8000',
  /** SetiReplay (grabación de sesiones). Si serverUrl o projectKey están vacíos, no se graba. */
  setiReplay: {
    serverUrl: 'http://localhost:3000', // npm run dev:server en el repo de SetiReplay
    projectKey: 'sr__ZjhR6ZOH74TxGsB2NksmGSAJwrJEYFk-1YWaq3skX0', // clave del proyecto, generada en el panel de SetiReplay
  },
};
