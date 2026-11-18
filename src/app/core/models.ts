import { environment } from '../../environments/environment';

/** URL base del backend; depende del environment (dev: localhost:8000, prod: alwaysdata). */
export const API_URL = environment.apiUrl;

/** Claves de localStorage que usaba la app original (se mantienen por compatibilidad). */
export const STORAGE = {
  email: 'email',
  token: 'x-access-token',
  ttp: 'ttp',
  datosVideos: 'datosvideos',
} as const;

export interface RespuestaIngreso {
  status: string; // 'Usuario encontrado' cuando es correcto
  email?: string;
  token?: string;
  ttp?: string; // 'ffp' => puede registrar usuarios
}

export interface RespuestaRegistro {
  status: string; // 'Usuario guardado' cuando es correcto
}

export interface Capitulo {
  id: number | string;
  nombre: string;
  /** Enlace público de pCloud. */
  url: string;
  /** Segundo donde termina la intro (botón "Saltar intro"). */
  skipTime?: number | string;
  /** true => audiolibro. */
  audio?: boolean;
}

export interface ProgresoCapitulo {
  video: number; // posición (índice) del capítulo
  horas?: number;
  minuto: number;
  segundos: number;
}

export interface DatosSerie {
  email: string | null;
  serie: string;
  datosSerieVideos: {
    videoActSerie: number;
    videos: ProgresoCapitulo[];
  };
}

/** Respuesta del POST /{serie}: o bien los datos guardados, o { status: 'no encontrado' }. */
export type RespuestaProgreso = Partial<DatosSerie> & { status?: string };

export interface TituloCatalogo {
  id: string; // nombreSerie que espera el backend
  nombre: string;
  imagen: string;
}

export interface SeccionCatalogo {
  titulo: string;
  items: TituloCatalogo[];
}
