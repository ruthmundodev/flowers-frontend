export interface ParcelaResponse {
  id: number;
  nombre: string;
  invernaderoId: number;
  invernaderoNumero?: number | null;
  invernaderoNombre?: string | null;
  numeroBancos?: number | null;
  bancosOcupados: number;
  bancosLibres?: number | null;
  activo: boolean;
}

export interface ParcelaRequest {
  nombre: string;
  invernaderoId: number | null;
  numeroBancos?: number | null;
  activo?: boolean;
}
