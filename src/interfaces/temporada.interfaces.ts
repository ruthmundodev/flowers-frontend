export interface TemporadaResponse {
  id: number;
  year: number;
  mes: number;
  descripcion: string | null;
}

export interface TemporadaRequest {
  year: number | null;
  mes: number | null;
  descripcion: string;
}
