import { NgTemplateOutlet } from '@angular/common';
import { Component, DestroyRef, ElementRef, computed, inject, signal, viewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSliderModule } from '@angular/material/slider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { Capitulo, DatosSerie, ProgresoCapitulo, RespuestaProgreso, STORAGE } from '../../core/models';
import { SeriesService } from '../../core/series.service';
import { Navbar } from '../../shared/navbar/navbar';

@Component({
  selector: 'app-reproductor',
  imports: [Navbar, RouterLink, NgTemplateOutlet, MatButtonModule, MatIconModule, MatProgressSpinnerModule, MatTooltipModule, MatSliderModule],
  templateUrl: './reproductor.html',
  styleUrl: './reproductor.css',
  host: {
    '(window:beforeunload)': 'guardar(true)',
    '(document:keydown)': 'atajoTeclado($event)',
  },
})
export class Reproductor {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly series = inject(SeriesService);
  private readonly auth = inject(AuthService);
  protected readonly puedeDescargar = this.auth.puedeDescargar;

  private readonly videoRef = viewChild.required<ElementRef<HTMLVideoElement>>('video');
  private readonly audioRef = viewChild.required<ElementRef<HTMLAudioElement>>('audio');

  protected readonly capitulos = signal<Capitulo[]>([]);
  protected readonly posicion = signal(0);
  protected readonly actual = computed<Capitulo | undefined>(() => this.capitulos()[this.posicion()]);
  protected readonly hayAnterior = computed(() => this.posicion() > 0);
  protected readonly haySiguiente = computed(() => this.posicion() < this.capitulos().length - 1);
  /** Películas: un solo capítulo => sin lista lateral ni anterior/siguiente, video a pantalla completa. */
  protected readonly unico = computed(() => this.capitulos().length === 1);

  protected readonly esVideo = signal(true);
  protected readonly cargando = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly listaAbierta = signal(false);
  protected readonly mostrarSkip = signal(false);
  /** Segundos restantes para pasar al siguiente capítulo (null = sin cuenta atrás). */
  protected readonly cuentaAtras = signal<number | null>(null);
  protected readonly cuentaTotal = signal(10);
  /** Descarga del capítulo actual (solo se muestra a admins). */
  protected readonly descarga = signal<{ url: string; nombre: string } | null>(null);

  // Controles propios del modo audio (más precisos que la barra nativa).
  protected readonly tiempo = signal(0);
  protected readonly duracion = signal(0);
  protected readonly reproduciendo = signal(false);
  protected readonly velocidad = signal(leerVelocidad());
  /** Mientras se arrastra la barra no se pisa el valor con timeupdate. */
  private arrastrando = false;
  protected readonly formatoTiempo = formatoTiempo;

  private serie = '';
  private progreso: ProgresoCapitulo[] = [];
  /** Segundo en el que debe reanudarse el capítulo que se está cargando. */
  private tiempoInicial = 0;
  /** true cuando el medio ya tiene metadatos y currentTime es fiable. */
  private medioListo = false;
  private reproducirAlCargar = false;
  /** Evita condiciones de carrera si se cambia de capítulo antes de resolver el anterior. */
  private cargaId = 0;
  private temporizador?: ReturnType<typeof setInterval>;

  constructor() {
    this.route.paramMap
      .pipe(takeUntilDestroyed())
      .subscribe((params) => this.iniciar(params.get('nombreSerie') ?? ''));

    inject(DestroyRef).onDestroy(() => {
      this.guardar();
      this.detenerCuentaAtras();
      this.medio.pause();
    });
  }

  private get medio(): HTMLMediaElement {
    return this.esVideo() ? this.videoRef().nativeElement : this.audioRef().nativeElement;
  }

  // ---------------------------------------------------------------- carga

  private async iniciar(serie: string): Promise<void> {
    if (this.medioListo) this.guardar();
    this.serie = serie;
    this.capitulos.set([]);
    this.progreso = [];
    this.medioListo = false;
    this.error.set(null);
    this.cargando.set(true);

    if (!serie) {
      this.router.navigate(['/']);
      return;
    }

    try {
      const capitulos = await this.series.capitulos(serie);
      if (capitulos.length === 0) throw new Error('sin capítulos');
      this.capitulos.set(capitulos);

      const datos = await this.series
        .obtenerProgreso(serie, this.auth.email())
        .catch(() => this.progresoLocal(serie));

      let posicion = 0;
      if (datos && datos.status !== 'no encontrado' && datos.datosSerieVideos) {
        this.progreso = datos.datosSerieVideos.videos ?? [];
        posicion = Number(datos.datosSerieVideos.videoActSerie) || 0;
      }
      posicion = Math.min(Math.max(posicion, 0), capitulos.length - 1);
      await this.cargarCapitulo(posicion);
    } catch (e) {
      console.error(e);
      if (this.auth.autenticado()) this.error.set('No se pudo cargar la serie.');
    }
  }

  private async cargarCapitulo(indice: number): Promise<void> {
    const capitulos = this.capitulos();
    if (indice < 0 || indice >= capitulos.length) return;

    if (this.medioListo) this.guardar(); // guarda dónde se quedó el capítulo actual
    const id = ++this.cargaId;
    this.detenerCuentaAtras();
    this.medio.pause();
    this.medioListo = false;
    this.reproducirAlCargar = true;
    this.posicion.set(indice);
    this.tiempoInicial = this.segundosGuardados(indice);
    this.mostrarSkip.set(false);
    this.descarga.set(null);
    this.tiempo.set(0);
    this.duracion.set(0);
    this.error.set(null);
    this.cargando.set(true);

    try {
      const { url, esAudio, descarga, nombreArchivo } = await this.series.resolverMedio(capitulos[indice]);
      if (id !== this.cargaId) return;

      const anterior = this.medio;
      this.esVideo.set(!esAudio);
      const medio = this.medio;
      if (anterior !== medio) {
        anterior.removeAttribute('src');
        anterior.load();
      }
      this.descarga.set({ url: descarga, nombre: nombreArchivo ?? `${capitulos[indice].nombre}` });
      medio.src = url;
      medio.load();
      this.guardar(); // persiste el nuevo capítulo actual
    } catch (e) {
      console.error(e);
      if (id === this.cargaId) this.error.set('No se pudo obtener el capítulo. Intenta de nuevo más tarde.');
    }
  }

  protected reintentar(): void {
    if (this.capitulos().length) this.cargarCapitulo(this.posicion());
    else this.iniciar(this.serie);
  }

  // ------------------------------------------------------- eventos del medio

  protected alCargarMetadatos(): void {
    if (!this.esVideo()) {
      this.audioRef().nativeElement.playbackRate = this.velocidad();
      this.alCambiarDuracion();
    }
    if (this.tiempoInicial > 0) this.medio.currentTime = this.tiempoInicial;
    this.medioListo = true;
    this.actualizarSkip();
  }

  protected alPoderReproducir(): void {
    this.cargando.set(false);
    if (this.reproducirAlCargar) {
      this.reproducirAlCargar = false;
      this.medio.play().catch(() => {}); // el navegador puede bloquear el autoplay
    }
  }

  protected alPausar(): void {
    if (this.medioListo) this.guardar();
  }

  protected alTerminar(): void {
    if (this.haySiguiente()) this.iniciarCuentaAtras();
  }

  protected actualizarSkip(): void {
    const skip = Number(this.actual()?.skipTime) || 0;
    this.mostrarSkip.set(
      this.esVideo() && this.medioListo && skip > 0 && this.medio.currentTime < skip,
    );
  }

  // ------------------------------------------------- controles del audio

  protected alActualizarTiempoAudio(): void {
    if (!this.arrastrando) this.tiempo.set(this.audioRef().nativeElement.currentTime);
  }

  protected alCambiarDuracion(): void {
    const d = this.audioRef().nativeElement.duration;
    this.duracion.set(Number.isFinite(d) ? d : 0);
  }

  protected alternarReproduccion(): void {
    const audio = this.audioRef().nativeElement;
    if (audio.paused) audio.play().catch(() => {});
    else audio.pause();
  }

  /** Avanza (+) o retrocede (-) los segundos indicados. */
  protected desplazar(segundos: number): void {
    const audio = this.audioRef().nativeElement;
    const destino = Math.min(Math.max(audio.currentTime + segundos, 0), this.duracion() || audio.duration || 0);
    audio.currentTime = destino;
    this.tiempo.set(destino);
  }

  protected arrastrarBarra(valor: number): void {
    this.arrastrando = true;
    this.tiempo.set(valor);
  }

  protected soltarBarra(valor: number): void {
    this.arrastrando = false;
    this.audioRef().nativeElement.currentTime = valor;
    this.tiempo.set(valor);
    this.guardar();
  }

  protected cambiarVelocidad(): void {
    const i = VELOCIDADES.indexOf(this.velocidad());
    const nueva = VELOCIDADES[(i + 1) % VELOCIDADES.length];
    this.velocidad.set(nueva);
    this.audioRef().nativeElement.playbackRate = nueva;
    try { localStorage.setItem('velocidadAudio', String(nueva)); } catch {}
  }

  /** ← / → : 10 s · Mayús + ← / → : 30 s · Espacio: reproducir/pausar (solo audio). */
  protected atajoTeclado(e: KeyboardEvent): void {
    if (this.esVideo() || this.cuentaAtras() !== null || this.listaAbierta()) return;
    const destino = e.target as HTMLElement | null;
    if (destino?.closest('input, textarea, button, a, mat-slider, [contenteditable]')) return;
    if (e.key === 'ArrowRight') this.desplazar(e.shiftKey ? 30 : 10);
    else if (e.key === 'ArrowLeft') this.desplazar(e.shiftKey ? -30 : -10);
    else if (e.key === ' ') this.alternarReproduccion();
    else return;
    e.preventDefault();
  }

  // ------------------------------------------------------------ controles

  protected anterior(): void {
    if (this.hayAnterior()) this.cargarCapitulo(this.posicion() - 1);
  }

  protected siguiente(): void {
    if (this.haySiguiente()) this.cargarCapitulo(this.posicion() + 1);
    else this.detenerCuentaAtras();
  }

  protected seleccionar(indice: number): void {
    this.listaAbierta.set(false);
    if (indice !== this.posicion()) this.cargarCapitulo(indice);
  }

  protected toggleLista(): void {
    this.listaAbierta.update((abierta) => !abierta);
  }

  protected saltarIntro(): void {
    const skip = Number(this.actual()?.skipTime) || 0;
    this.medio.currentTime = skip;
    this.mostrarSkip.set(false);
    this.guardar();
  }

  protected cancelarSiguiente(): void {
    this.detenerCuentaAtras();
  }

  /** Cuenta atrás antes de pasar al siguiente capítulo: 10 s en video, 5 s en audio. */
  private iniciarCuentaAtras(): void {
    this.detenerCuentaAtras();
    let restante = this.esVideo() ? 10 : 5;
    this.cuentaTotal.set(restante);
    this.cuentaAtras.set(restante);
    this.temporizador = setInterval(() => {
      restante--;
      if (restante <= 0) this.siguiente();
      else this.cuentaAtras.set(restante);
    }, 1000);
  }

  private detenerCuentaAtras(): void {
    clearInterval(this.temporizador);
    this.temporizador = undefined;
    this.cuentaAtras.set(null);
  }

  // ------------------------------------------------------------- progreso

  private segundosGuardados(indice: number): number {
    const p = this.progreso.find((v) => Number(v.video) === indice);
    if (!p) return 0;
    return (Number(p.horas) || 0) * 3600 + (Number(p.minuto) || 0) * 60 + (Number(p.segundos) || 0);
  }

  private progresoLocal(serie: string): RespuestaProgreso | null {
    try {
      const datos = JSON.parse(localStorage.getItem(STORAGE.datosVideos) ?? 'null') as DatosSerie | null;
      return datos?.serie === serie ? datos : null;
    } catch {
      return null;
    }
  }

  /** Guarda la posición actual (equivalente a enviarDatos() de la versión original). */
  protected guardar(alSalir = false): void {
    if (!this.capitulos().length || !this.auth.autenticado()) return;

    const t = this.medioListo ? this.medio.currentTime : this.tiempoInicial;
    const posicion = this.posicion();
    const entrada: ProgresoCapitulo = {
      video: posicion,
      horas: Math.floor(t / 3600),
      minuto: Math.floor((t / 60) % 60),
      segundos: Math.floor(t % 60),
    };
    this.progreso = [...this.progreso.filter((v) => Number(v.video) !== posicion), entrada];

    const datos: DatosSerie = {
      email: this.auth.email(),
      serie: this.serie,
      datosSerieVideos: { videoActSerie: posicion, videos: this.progreso },
    };
    if (alSalir) this.series.guardarProgresoAlSalir(datos, this.auth.token);
    else this.series.guardarProgreso(datos);
  }
}

const VELOCIDADES = [1, 1.25, 1.5, 1.75, 2, 0.75];

function leerVelocidad(): number {
  try {
    const v = Number(localStorage.getItem('velocidadAudio'));
    return VELOCIDADES.includes(v) ? v : 1;
  } catch {
    return 1;
  }
}

/** 75 -> "1:15", 3725 -> "1:02:05" */
function formatoTiempo(total: number): string {
  const t = Math.max(0, Math.floor(total || 0));
  const h = Math.floor(t / 3600);
  const m = Math.floor((t % 3600) / 60);
  const s = String(t % 60).padStart(2, '0');
  return h ? `${h}:${String(m).padStart(2, '0')}:${s}` : `${m}:${s}`;
}
