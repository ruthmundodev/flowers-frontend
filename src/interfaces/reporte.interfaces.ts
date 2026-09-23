export interface BolsaInventario {
  id: number;
  cantidad: number;
  calidad: string | null;
  fechaRecepcion: string;
  variedadId: number | null;
  variedadNombre: string | null;
  invernaderoId: number | null;
  invernaderoNombre: string | null;
}

/** Un grupo de inventario por tipo (SEMILLA, POLEN, FRUTA, …). */
export interface GrupoInventario {
  tipo: string;
  items: BolsaInventario[];
  total: number;
}

export interface ReporteInventario {
  desde: string;
  hasta: string;
  grupos: GrupoInventario[];
  totalGeneral: number;
}

/** Agregado por variedad, para las gráficas. */
export interface AgregadoVariedad {
  variedad: string;
  cantidad: number;
}

export interface ReporteGuardarRequest {
  desde: string;
  hasta: string;
  tipo?: string | null;
  invernaderoId?: number | null;
  descripcion?: string | null;
  observaciones?: string | null;
}

export interface ReporteGuardado {
  id: number;
  fecha: string;
  desde: string;
  hasta: string;
  tipo: string | null;
  invernaderoId: number | null;
  invernaderoNombre: string | null;
  totalGeneral: number;
  descripcion: string | null;
  observaciones: string | null;
  createdAt: string | null;
  createdBy: number | null;
  reporte?: ReporteInventario | null;
}
