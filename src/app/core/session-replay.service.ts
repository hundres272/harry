import { Injectable } from '@angular/core';
import type { SetiReplayOptions } from 'setireplay';
import { environment } from '../../environments/environment';

type SetiReplay = typeof import('setireplay');

/**
 * Integración con SetiReplay (grabación de sesiones: DOM, consola y red).
 *
 * El SDK (con rrweb) se carga de forma diferida para no engordar el bundle inicial ni
 * retrasar el arranque. Si no hay serverUrl/projectKey en el environment, no hace nada.
 */
@Injectable({ providedIn: 'root' })
export class SessionReplayService {
  private sdk: Promise<SetiReplay | null> | null = null;

  private readonly opciones: SetiReplayOptions = {
    serverUrl: environment.setiReplay.serverUrl,
    projectKey: environment.setiReplay.projectKey,
    // El token de esta app viaja en x-access-token, que no está entre los headers por defecto.
    extraSensitiveHeaders: ['x-access-token'],
    // password y token ya se enmascaran por defecto en bodies y query params.
    extraSensitiveKeys: [],
    extraSensitiveSelectors: [],
    // No se graba el login mientras el usuario es anónimo (antes de identify()).
    // '/ingreso.html' es la URL antigua, que redirige a '/ingreso'.
    excludeUrls: ['/ingreso', '/ingreso.html'],
  };

  get habilitado(): boolean {
    return Boolean(this.opciones.serverUrl && this.opciones.projectKey);
  }

  /** Inicia la grabación al arrancar la app; si ya hay sesión iniciada, la identifica. */
  iniciar(email: string | null, meta?: Record<string, string>): void {
    if (!this.habilitado || this.sdk) return;
    this.sdk = import('setireplay')
      .then((sdk) => {
        sdk.init(this.opciones);
        if (email) sdk.identify(email, meta);
        return sdk;
      })
      .catch((err) => {
        console.warn('[SetiReplay] No se pudo cargar el SDK', err);
        return null;
      });
  }

  /** Asocia la sesión grabada al usuario (tras el login). */
  identificar(email: string, meta?: Record<string, string>): void {
    this.sdk?.then((sdk) => sdk?.identify(email, meta));
  }

  /** Al cerrar sesión: cierra la grabación actual y empieza una nueva, anónima. */
  reiniciar(): void {
    this.sdk?.then((sdk) => {
      if (!sdk) return;
      sdk.stop();
      sdk.init(this.opciones);
    });
  }
}
