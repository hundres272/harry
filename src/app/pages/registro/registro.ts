import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { Navbar } from '../../shared/navbar/navbar';

@Component({
  selector: 'app-registro',
  imports: [FormsModule, Navbar, MatFormFieldModule, MatInputModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule],
  template: `
    <app-navbar />
    <main class="pantalla-form">
      <form class="contenedor-form vidrio" (ngSubmit)="enviar()">
        <h2>Registro</h2>
        <p class="subtitulo">Crea una cuenta para un nuevo usuario</p>

        <mat-form-field appearance="outline" subscriptSizing="dynamic">
          <mat-label>Nombre</mat-label>
          <mat-icon matPrefix>person</mat-icon>
          <input matInput name="name" autocomplete="off" [(ngModel)]="name" required />
          <mat-error>El nombre es obligatorio</mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline" subscriptSizing="dynamic">
          <mat-label>Correo</mat-label>
          <mat-icon matPrefix>mail</mat-icon>
          <input matInput name="email" type="email" autocomplete="off" [(ngModel)]="email" required email />
          <mat-error>Ingresa un correo válido</mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline" subscriptSizing="dynamic">
          <mat-label>Contraseña</mat-label>
          <mat-icon matPrefix>lock</mat-icon>
          <input matInput name="password" [type]="verPassword() ? 'text' : 'password'" autocomplete="new-password" [(ngModel)]="password" required />
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
            <mat-icon>person_add</mat-icon>
          }
          Crear usuario
        </button>
      </form>
    </main>
  `,
})
export class Registro {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);

  protected name = '';
  protected email = '';
  protected password = '';
  protected readonly error = signal('');
  protected readonly enviando = signal(false);
  protected readonly verPassword = signal(false);

  protected enviar(): void {
    if (!this.name || !this.email || !this.password) return;
    this.enviando.set(true);
    this.error.set('');
    this.auth.registrar(this.name, this.email, this.password).subscribe({
      next: (res) => {
        this.enviando.set(false);
        if (res.status === 'Usuario guardado') {
          this.snackBar.open(`Usuario ${this.email} creado`, 'OK', { duration: 4000 });
          this.router.navigate(['/']);
        } else {
          this.error.set(res.status);
        }
      },
      error: (err) => {
        this.enviando.set(false);
        this.error.set(err?.error?.status ?? 'No se pudo conectar con el servidor');
      },
    });
  }
}
