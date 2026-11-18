import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-navbar',
  imports: [RouterLink, RouterLinkActive, MatToolbarModule, MatButtonModule, MatIconModule, MatTooltipModule],
  template: `
    <mat-toolbar class="menu">
      <a routerLink="/" class="marca" aria-label="Inicio">
        <img src="images/logo1.png" alt="" />
        <span>Hundres</span>
      </a>
      <span class="espacio"></span>

      <a mat-button routerLink="/" routerLinkActive="activo" [routerLinkActiveOptions]="{ exact: true }" class="texto">
        <mat-icon>home</mat-icon> Inicio
      </a>
      @if (auth.puedeRegistrar()) {
        <a mat-button routerLink="/registro" routerLinkActive="activo" class="texto">
          <mat-icon>person_add</mat-icon> Registro
        </a>
      }
      <button mat-stroked-button type="button" class="texto salir" (click)="auth.cerrarSesion()">
        <mat-icon>logout</mat-icon> Cerrar sesión
      </button>

      <!-- móvil: solo iconos -->
      <a mat-icon-button routerLink="/" class="icono" matTooltip="Inicio" aria-label="Inicio">
        <mat-icon>home</mat-icon>
      </a>
      @if (auth.puedeRegistrar()) {
        <a mat-icon-button routerLink="/registro" class="icono" matTooltip="Registro" aria-label="Registro">
          <mat-icon>person_add</mat-icon>
        </a>
      }
      <button mat-icon-button type="button" class="icono" matTooltip="Cerrar sesión" aria-label="Cerrar sesión" (click)="auth.cerrarSesion()">
        <mat-icon>logout</mat-icon>
      </button>
    </mat-toolbar>
  `,
  styles: `
    :host {
      position: sticky;
      top: 0;
      z-index: 10;
      display: block;
    }
    .menu {
      gap: 6px;
      height: 64px;
      padding: 0 20px;
      background: rgb(12 10 32 / 72%);
      backdrop-filter: blur(14px);
      -webkit-backdrop-filter: blur(14px);
      border-bottom: 1px solid var(--borde-vidrio);
      color: var(--texto);
    }
    .marca {
      display: flex;
      align-items: center;
      gap: 10px;
      text-decoration: none;
      color: var(--oro);
      font-family: var(--fuente-magica);
      font-size: 1.9em;
      letter-spacing: 0.06em;
      text-shadow: 0 0 14px rgb(232 198 106 / 45%);
    }
    .marca img { height: 40px; filter: drop-shadow(0 0 8px rgb(232 198 106 / 40%)); }
    .espacio { flex: 1; }
    .activo { color: var(--oro); }
    .salir { margin-left: 6px; }
    .icono { display: none; }
    @media (max-width: 600px) {
      .menu { height: 56px; padding: 0 8px 0 12px; }
      .marca span { display: none; }
      .texto { display: none; }
      .icono { display: inline-flex; }
    }
  `,
})
export class Navbar {
  protected readonly auth = inject(AuthService);
}
