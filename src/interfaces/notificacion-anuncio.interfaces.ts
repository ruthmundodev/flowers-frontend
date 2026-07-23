/** Una notificación (anuncio) tal como la ve el usuario en su campana. */
export interface NotificacionResponse {
  /** Id del anuncio. */
  id: number;
  titulo?: string | null;
  texto: string;
  prioridad: string;
  leido: boolean;
  fecha?: string | null;
}

export interface ContadorNoLeidas {
  noLeidas: number;
}
