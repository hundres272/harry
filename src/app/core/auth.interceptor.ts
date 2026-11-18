import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AuthService } from './auth.service';
import { API_URL } from './models';

/**
 * Añade el header x-access-token a las peticiones del backend (solo a ese host,
 * para no provocar preflights CORS en pCloud) y cierra sesión ante un 401.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  if (!req.url.startsWith(API_URL)) return next(req);

  const auth = inject(AuthService);
  const token = auth.token;
  const peticion = token ? req.clone({ setHeaders: { 'x-access-token': token } }) : req;

  return next(peticion).pipe(
    catchError((err: unknown) => {
      if (err instanceof HttpErrorResponse && err.status === 401) auth.cerrarSesion();
      return throwError(() => err);
    }),
  );
};
