import { ChangeDetectionStrategy, Component } from '@angular/core';

interface Particula {
  x: number; // %
  y: number; // %
  tam: number; // px
  dur: number; // s
  delay: number; // s
  deriva?: number; // px (desplazamiento lateral de las chispas)
}

const azar = (min: number, max: number) => Math.random() * (max - min) + min;

/**
 * Fondo animado: estrellas que titilan, chispas doradas que suben y estrellas fugaces.
 * Solo anima transform/opacity (barato para la GPU) y se detiene con prefers-reduced-motion.
 */
@Component({
  selector: 'app-cielo-magico',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { 'aria-hidden': 'true' },
  template: `
    @for (e of estrellas; track $index) {
      <span class="estrella"
            [style.left.%]="e.x" [style.top.%]="e.y"
            [style.width.px]="e.tam" [style.height.px]="e.tam"
            [style.animation-duration.s]="e.dur" [style.animation-delay.s]="-e.delay"></span>
    }
    @for (b of brillos; track $index) {
      <span class="brillo"
            [style.left.%]="b.x" [style.top.%]="b.y"
            [style.--tam]="b.tam + 'px'"
            [style.animation-duration.s]="b.dur" [style.animation-delay.s]="-b.delay"></span>
    }
    @for (c of chispas; track $index) {
      <span class="chispa"
            [style.left.%]="c.x"
            [style.width.px]="c.tam" [style.height.px]="c.tam"
            [style.--deriva]="c.deriva + 'px'"
            [style.animation-duration.s]="c.dur" [style.animation-delay.s]="-c.delay"></span>
    }
    @for (f of fugaces; track $index) {
      <span class="fugaz"
            [style.left.%]="f.x" [style.top.%]="f.y"
            [style.animation-duration.s]="f.dur" [style.animation-delay.s]="f.delay"></span>
    }
  `,
  styleUrl: './cielo-magico.css',
})
export class CieloMagico {
  private readonly movil = typeof window !== 'undefined' && window.innerWidth < 600;

  protected readonly estrellas: Particula[] = Array.from({ length: this.movil ? 60 : 120 }, () => ({
    x: azar(0, 100),
    y: azar(0, 100),
    tam: azar(1, 2.6),
    dur: azar(2.5, 6),
    delay: azar(0, 6),
  }));

  /** Estrellas grandes de cuatro puntas, con destello. */
  protected readonly brillos: Particula[] = Array.from({ length: this.movil ? 6 : 12 }, () => ({
    x: azar(2, 98),
    y: azar(2, 95),
    tam: azar(10, 20),
    dur: azar(3, 7),
    delay: azar(0, 7),
  }));

  /** Chispas doradas que suben desde abajo, como polvo mágico. */
  protected readonly chispas: Particula[] = Array.from({ length: this.movil ? 18 : 36 }, () => ({
    x: azar(0, 100),
    y: 0,
    tam: azar(2, 5),
    dur: azar(9, 18),
    delay: azar(0, 18),
    deriva: azar(-80, 80),
  }));

  protected readonly fugaces: Particula[] = [
    { x: 70, y: 8, tam: 0, dur: 9, delay: 2 },
    { x: 35, y: 4, tam: 0, dur: 13, delay: 7 },
    { x: 90, y: 30, tam: 0, dur: 17, delay: 12 },
  ];
}
