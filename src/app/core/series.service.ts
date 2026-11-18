import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { API_URL, Capitulo, DatosSerie, RespuestaProgreso, STORAGE } from './models';

export interface MedioResuelto {
  url: string;
  esAudio: boolean;
  /** Enlace de descarga del archivo original (downloadlink de pCloud). */
  descarga: string;
  /** Nombre del archivo en pCloud, p. ej. "1. Harry Potter y la piedra filosofal.mp4". */
  nombreArchivo?: string;
}

@Injectable({ providedIn: 'root' })
export class SeriesService {
  private readonly http = inject(HttpClient);

  /** GET /capitulos/{serie}. El backend devuelve el JSON serializado como string. */
  async capitulos(serie: string): Promise<Capitulo[]> {
    const res = await firstValueFrom(this.http.get<unknown>(`${API_URL}/capitulos/${serie}`));
    const lista = typeof res === 'string' ? JSON.parse(res) : res;
    return Array.isArray(lista) ? lista : [];
  }

  /** POST /{serie}: progreso guardado del usuario para esa serie. */
  obtenerProgreso(serie: string, email: string | null): Promise<RespuestaProgreso> {
    return firstValueFrom(this.http.post<RespuestaProgreso>(`${API_URL}/${serie}`, { email, serie }));
  }

  /** PUT /{serie}: guarda el progreso (y lo cachea en localStorage como hacía la app original). */
  guardarProgreso(datos: DatosSerie): void {
    localStorage.setItem(STORAGE.datosVideos, JSON.stringify(datos));
    this.http.put(`${API_URL}/${datos.serie}`, datos).subscribe({ error: (e) => console.error(e) });
  }

  /** Variante para beforeunload: fetch con keepalive sobrevive al cierre de la pestaña. */
  guardarProgresoAlSalir(datos: DatosSerie, token: string | null): void {
    localStorage.setItem(STORAGE.datosVideos, JSON.stringify(datos));
    fetch(`${API_URL}/${datos.serie}`, {
      method: 'PUT',
      keepalive: true,
      body: JSON.stringify(datos),
      headers: { 'Content-Type': 'application/json', 'x-access-token': token ?? '' },
    }).catch(() => {});
  }

  /**
   * Obtiene la URL directa del medio a partir de la página pública de pCloud
   * (https://u.pcloud.link/publink/show?code=...), que incluye `var publinkData = {...};`.
   *
   * Video: se usa la variante original (MP4) con su propio host. La primera variante suele
   * ser HLS (master.m3u8), que Chrome/Firefox no reproducen sin hls.js, y el host cambia
   * entre archivos, así que no se puede fijar (antes estaba fijo a t62.pcloud.com).
   */
  async resolverMedio(cap: Capitulo): Promise<MedioResuelto> {
    const html = await (await fetch(cap.url)).text();
    const data = extraerPublinkData(html);
    const medio = (url: string, esAudio: boolean): MedioResuelto => ({
      url,
      esAudio,
      descarga: data.downloadlink ?? url,
      nombreArchivo: data.metadata?.name,
    });

    if (cap.audio === true) {
      if (!data.downloadlink) throw new Error('pCloud no devolvió downloadlink');
      return medio(data.downloadlink, true);
    }

    const variantes = data.variants ?? [];
    const original = variantes.find((v) => v.isoriginal || v.transcodetype === 'original');
    if (original?.path && original.hosts?.length) {
      return medio(`https://${original.hosts[0]}${original.path}`, false);
    }
    if (data.downloadlink) return medio(data.downloadlink, false);

    // Último recurso: HLS (solo funciona nativamente en Safari / iOS).
    const hls = variantes.find((v) => v.transcodetype === 'hls' && v.path && v.hosts?.length);
    if (hls) return medio(`https://${hls.hosts![0]}${hls.path}`, false);

    throw new Error('pCloud no devolvió ninguna variante de video reproducible');
  }
}

interface VariantePCloud {
  path?: string;
  hosts?: string[];
  isoriginal?: boolean;
  transcodetype?: string; // 'original' | 'hls' | ...
}

interface PublinkData {
  downloadlink?: string;
  metadata?: { name?: string };
  variants?: VariantePCloud[];
}

/**
 * Extrae el objeto `publinkData` del HTML de pCloud recorriendo llaves (respetando strings),
 * en vez de cortar por ';' o por la primera '}', que fallan con objetos anidados.
 */
function extraerPublinkData(html: string): PublinkData {
  const marca = html.indexOf('var publinkData');
  const inicio = marca === -1 ? -1 : html.indexOf('{', marca);
  if (inicio === -1) throw new Error('No se encontró publinkData en la página de pCloud');

  let profundidad = 0;
  let enString = false;
  for (let i = inicio; i < html.length; i++) {
    const c = html[i];
    if (enString) {
      if (c === '\\') i++;
      else if (c === '"') enString = false;
    } else if (c === '"') {
      enString = true;
    } else if (c === '{') {
      profundidad++;
    } else if (c === '}' && --profundidad === 0) {
      return JSON.parse(html.slice(inicio, i + 1));
    }
  }
  throw new Error('publinkData incompleto en la página de pCloud');
}
