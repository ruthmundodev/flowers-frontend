export interface QuimicoResponse {
  id: number;
  nombre: string;
  fechaFumigacion: string;
  descripcion: string | null;
  variedadId: number;
  variedadNombre: string | null;
}

export interface QuimicoRequest {
  nombre: string;
  fechaFumigacion: string;
  descripcion: string;
  variedadId: number | null;
}
