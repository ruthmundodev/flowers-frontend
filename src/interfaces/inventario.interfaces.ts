export interface InventarioItem {
  variedadId: number;
  variedad: string;
  descripcion: string | null;
  tipo: string | null;
  stockKg: number;
  nivelPct: number;
  nivel: string;
  ultimaSiembra: string | null;
  estado: string;
}
