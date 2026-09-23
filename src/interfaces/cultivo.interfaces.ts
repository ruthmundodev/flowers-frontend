export interface CultivoResponse {
  id: number;
  fechaSiembra?: string;
  fechaInicioSiembra?: string | null;
  fechaFinSiembra?: string | null;
  fechaInicioProdu?: string | null;
  fechaFinProdu?: string | null;
  cantidad?: number;
  createdAt?: string | null;
  variedadId?: number;
  variedadNombre?: string | null;
  invernaderoId?: number;
  invernaderoNumero?: number | null;
  temporadaId?: number | null;
  temporadaDescripcion?: string | null;
}

export interface CultivoRequest {
  variedadId: number | null;
  invernaderoId: number | null;
  temporadaId: number | null;
  fechaSiembra: string;
  fechaInicioSiembra: string | null;
  fechaFinSiembra: string | null;
  fechaInicioProdu: string | null;
  fechaFinProdu: string | null;
  cantidad: number | null;
}

export interface CosechaRequest {
  fechaInicioProdu: string | null;
  fechaFinProdu: string | null;
  fechaCosecha: string;
  numeroBancos: number | null;
  rendimientoTotal: number | null;
}
