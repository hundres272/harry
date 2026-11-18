import { Component, inject } from '@angular/core';
import { MatIconRegistry } from '@angular/material/icon';
import { RouterOutlet } from '@angular/router';
import { CieloMagico } from './shared/cielo-magico/cielo-magico';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, CieloMagico],
  template: '<app-cielo-magico /><router-outlet />',
})
export class App {
  constructor() {
    // Usa Material Symbols (redondeados) como fuente de iconos por defecto.
    inject(MatIconRegistry).setDefaultFontSetClass('material-symbols-rounded');
  }
}
