import {
  ApplicationConfig,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideRouter, withComponentInputBinding } from '@angular/router';

import { routes } from './app.routes';
import { authInterceptor } from './core/auth.interceptor';
import { AuthService } from './core/auth.service';
import { SessionReplayService } from './core/session-replay.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes, withComponentInputBinding()),
    provideHttpClient(withInterceptors([authInterceptor])),
    // SetiReplay: arranca la grabación sin bloquear el inicio de la app.
    provideAppInitializer(() => {
      const auth = inject(AuthService);
      inject(SessionReplayService).iniciar(auth.email(), auth.metaReplay());
    }),
  ],
};
