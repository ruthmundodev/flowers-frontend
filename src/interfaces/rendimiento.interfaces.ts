export interface RendimientoResponse {
  id: number;
  variedadId: number;
  nombreVariedad: string | null;
  numeroBancos: number;
  rendimientoTotal: number;
  cultivoId?: number | null;
  invernaderoNumero?: number | null;
  fechaCosecha?: string | null;
}

export interface RendimientoRequest {
  variedadId: number | null;
  numeroBancos: number | null;
  rendimientoTotal: number | null;
  cultivoId?: number | null;
  fechaCosecha?: string | null;
}
