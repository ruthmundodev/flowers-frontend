export interface DashboardStats {
  cultivosActivos: number;
  totalVariedades: number;
  stockTotalKg: number;
  variedadesStockBajo: number;
  proximaCosecha: string | null;
}

export interface DashboardCultivo {
  cultivoId: number;
  variedadNombre: string;
  invernaderoNombre: string;
  cantidad: number;
  estado: string;
  nivelPct: number;
  fechaPoda: string | null;
}

export interface CosechaMes {
  mes: string;
  totalKg: number;
}
