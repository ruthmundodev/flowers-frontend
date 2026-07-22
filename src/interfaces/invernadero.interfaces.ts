export interface InvernaderoResponse {
  id: number;
  numero: number;
  nombreCultivo: string;
  createdAt: string | null;
  cultivoId: number | null;
  fincaId: number | null;
  fincaNombre: string | null;
  latitud: number | null;
  longitud: number | null;
  mapaUrl: string | null;
}

export interface InvernaderoRequest {
  numero: number | null;
  nombreCultivo: string;
  cultivoId?: number | null;
  fincaId?: number | null;
  latitud?: number | null;
  longitud?: number | null;
}
