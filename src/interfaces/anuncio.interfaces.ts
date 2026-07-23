export type Prioridad = 'INFO' | 'NORMAL' | 'IMPORTANTE' | 'URGENTE';

export interface AnuncioResponse {
  id: number;
  titulo?: string | null;
  texto: string;
  prioridad?: string;
  /** Rol destinatario (null = GLOBAL) y su nombre. */
  rolId?: number | null;
  rolNombre?: string | null;
  fechaExpiracion?: string | null;
  fechaPublicacion?: string | null;
  /** Imagen en Base64 (sin prefijo data:), o null. */
  imagen: string | null;
}

export interface AnuncioRequest {
  titulo?: string | null;
  texto: string;
  prioridad?: string | null;
  /** Rol destinatario; null = anuncio GLOBAL (para todos). */
  rolId?: number | null;
  fechaExpiracion?: string | null;
  /** Imagen en Base64 (sin prefijo data:), o null. */
  imagen: string | null;
}
