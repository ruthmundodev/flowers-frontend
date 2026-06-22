export interface RendimientoResponse {
  id: number;
  variedadId: number;
  nombreVariedad: string | null;
  numeroBancos: number;
  rendimientoTotal: number;
}

export interface RendimientoRequest {
  variedadId: number | null;
  numeroBancos: number | null;
  rendimientoTotal: number | null;
}
