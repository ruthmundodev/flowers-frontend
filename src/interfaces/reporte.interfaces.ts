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
