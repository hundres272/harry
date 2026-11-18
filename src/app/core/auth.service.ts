import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { API_URL, RespuestaIngreso, RespuestaRegistro, STORAGE } from './models';
import { SessionReplayService } from './session-replay.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly replay = inject(SessionReplayService);

  private readonly _email = signal(localStorage.getItem(STORAGE.email));
  private readonly _ttp = signal(localStorage.getItem(STORAGE.ttp));

  readonly email = this._email.asReadonly();
  readonly autenticado = computed(() => this._email() !== null);
  /** Solo los usuarios con ttp === 'ffp' pueden registrar usuarios nuevos. */
  readonly esAdmin = computed(() => this._ttp() === 'ffp');
  /** Los admins pueden registrar usuarios nuevos. */
  readonly puedeRegistrar = this.esAdmin;
  /** Los admins pueden descargar películas y audiolibros. */
  readonly puedeDescargar = this.esAdmin;

  get token(): string | null {
    return localStorage.getItem(STORAGE.token);
  }

  /**
   * @param usuario correo o nombre de usuario. Se envía en el campo `email`, que es el que
   *                espera el backend en POST /ingreso.
   */
  ingresar(usuario: string, password: string): Observable<RespuestaIngreso> {
    return this.http.post<RespuestaIngreso>(`${API_URL}/ingreso`, { email: usuario, password }).pipe(
      tap((res) => {
        if (res.status === 'Usuario encontrado' && res.email) {
          localStorage.setItem(STORAGE.email, res.email);
          if (res.token) localStorage.setItem(STORAGE.token, res.token);
          if (res.ttp) localStorage.setItem(STORAGE.ttp, res.ttp);
          this._email.set(res.email);
          this._ttp.set(res.ttp ?? null);
        }
      }),
    );
  }

  registrar(name: string, email: string, password: string): Observable<RespuestaRegistro> {
    return this.http.post<RespuestaRegistro>(`${API_URL}/registro`, { name, email, password });
  }

  /**
   * Asocia la grabación de SetiReplay al usuario. Se llama después de salir de /ingreso:
   * identify() reanuda la grabación y el login está excluido solo para usuarios anónimos.
   */
  identificarEnReplay(): void {
    const email = this._email();
    if (email) this.replay.identificar(email, this.metaReplay());
  }

  /** Metadatos que acompañan a la sesión grabada en SetiReplay. */
  metaReplay(): Record<string, string> {
    return { rol: this.esAdmin() ? 'admin' : 'usuario' };
  }

  cerrarSesion(): void {
    const habiaSesion = this._email() !== null;
    for (const key of Object.values(STORAGE)) localStorage.removeItem(key);
    if (habiaSesion) this.replay.reiniciar();
    this._email.set(null);
    this._ttp.set(null);
    this.router.navigate(['/ingreso']);
  }
}
