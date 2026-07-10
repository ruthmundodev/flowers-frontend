export interface InvernaderoUsuarioResponse {
  id: number;
  usuarioId: number;
  invernaderoId: number;
  invernaderoNumero: number | null;
  invernaderoNombreCultivo: string | null;
}

export interface InvernaderoUsuarioRequest {
  usuarioId: number;
  invernaderoId: number;
}
