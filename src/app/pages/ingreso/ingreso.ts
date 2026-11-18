import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Router } from '@angular/router';
import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-ingreso',
  imports: [FormsModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule],
  template: `
    <main class="pantalla-form completa">
      <img class="logo" src="images/logo.png" alt="Hundres Series" />
      <form class="contenedor-form vidrio" (ngSubmit)="enviar()" #f="ngForm">
        <h2>Bienvenido</h2>
        <p class="subtitulo">Ingresa para continuar con tus películas y audiolibros</p>

        <mat-form-field appearance="outline" subscriptSizing="dynamic">
          <mat-label>Correo o usuario</mat-label>
          <mat-icon matPrefix>person</mat-icon>
          <input matInput name="usuario" type="text" autocomplete="username" autocapitalize="none"
                 spellcheck="false" [(ngModel)]="usuario" required />
          <mat-error>Ingresa tu correo o nombre de usuario</mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline" subscriptSizing="dynamic">
          <mat-label>Contraseña</mat-label>
          <mat-icon matPrefix>lock</mat-icon>
          <input matInput name="password" [type]="verPassword() ? 'text' : 'password'" autocomplete="current-password" [(ngModel)]="password" required />
          <button mat-icon-button matSuffix type="button" (click)="verPassword.set(!verPassword())"
                  [attr.aria-label]="verPassword() ? 'Ocultar contraseña' : 'Mostrar contraseña'">
            <mat-icon>{{ verPassword() ? 'visibility_off' : 'visibility' }}</mat-icon>
          </button>
          <mat-error>La contraseña es obligatoria</mat-error>
        </mat-form-field>

        @if (error()) {
          <p class="error" role="alert"><mat-icon>error</mat-icon>{{ error() }}</p>
        }

        <button mat-flat-button class="enviar" type="submit" [disabled]="enviando()">
          @if (enviando()) {
            <mat-progress-spinner matButtonIcon mode="indeterminate" diameter="20" />
          } @else {
            <mat-icon>login</mat-icon>
          }
          Ingresar
        </button>
      </form>
    </main>
  `,
  styles: `
    .logo {
      width: 200px;
      margin-bottom: 24px;
      filter: drop-shadow(0 0 24px rgb(232 198 106 / 35%));
    }
    @media (max-width: 600px) { .logo { width: 160px; } }
  `,
})
export class Ingreso {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected usuario = '';
  protected password = '';
  protected readonly error = signal('');
  protected readonly enviando = signal(false);
  protected readonly verPassword = signal(false);

  protected enviar(): void {
    const usuario = this.usuario.trim();
    if (!usuario || !this.password) return;
    this.enviando.set(true);
    this.error.set('');
    this.auth.ingresar(usuario, this.password).subscribe({
      next: (res) => {
        this.enviando.set(false);
        if (res.status === 'Usuario encontrado') {
          this.router.navigate(['/']).then(() => this.auth.identificarEnReplay());
        }
        else this.error.set(res.status);
      },
      error: (err) => {
        this.enviando.set(false);
        this.error.set(err?.error?.status ?? 'No se pudo conectar con el servidor');
      },
    });
  }
}
