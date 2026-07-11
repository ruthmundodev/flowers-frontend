export interface AnuncioResponse {
  id: number;
  texto: string;
  /** Imagen en Base64 (sin prefijo data:), o null. */
  imagen: string | null;
}

export interface AnuncioRequest {
  texto: string;
  /** Imagen en Base64 (sin prefijo data:), o null. */
  imagen: string | null;
}
