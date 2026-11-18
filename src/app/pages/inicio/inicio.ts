import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { CATALOGO } from '../../core/catalogo';
import { Navbar } from '../../shared/navbar/navbar';

@Component({
  selector: 'app-inicio',
  imports: [RouterLink, Navbar, MatButtonModule, MatIconModule],
  template: `
    <app-navbar />

    <header class="portada">
      <div class="portada-fondo"></div>
      <img src="images/harrypotterbig.jpg" alt="Harry Potter" />
    </header>

    @for (seccion of catalogo; track seccion.titulo) {
      <section class="seccion">
        <div class="cabecera">
          <h2>
            <mat-icon>{{ seccion.titulo.includes('Audio') ? 'headphones' : 'movie' }}</mat-icon>
            {{ seccion.titulo }}
          </h2>
          <div class="flechas">
            <button mat-icon-button type="button" aria-label="Anterior" (click)="fila.scrollBy({ left: -340, behavior: 'smooth' })">
              <mat-icon>chevron_left</mat-icon>
            </button>
            <button mat-icon-button type="button" aria-label="Siguiente" (click)="fila.scrollBy({ left: 340, behavior: 'smooth' })">
              <mat-icon>chevron_right</mat-icon>
            </button>
          </div>
        </div>

        <div class="fila" #fila>
          @for (item of seccion.items; track item.id) {
            <a class="tarjeta" [routerLink]="['/serie', item.id]" [title]="item.nombre">
              <img [src]="item.imagen" [alt]="item.nombre" loading="lazy" />
              <span class="velo">
                <mat-icon class="play">play_circle</mat-icon>
                <span class="nombre">{{ item.nombre }}</span>
              </span>
            </a>
          }
        </div>
      </section>
    }
  `,
  styleUrl: './inicio.css',
})
export class Inicio {
  protected readonly catalogo = CATALOGO;
}
