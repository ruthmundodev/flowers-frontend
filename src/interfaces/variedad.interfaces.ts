export interface VariedadResponse {
  id: number;
  nombre: string;
  descripcion: string | null;
  numeroBass: number | null;
  fechaInicio: string | null;
  fechaPoda: string | null;
  parental: string | null;
  createdAt: string | null;
  invernaderoId: number | null;
  invernaderoNombre: string | null;
}

export interface VariedadRequest {
  nombre: string;
  descripcion: string;
  numeroBass: number | null;
  fechaInicio: string | null;
  fechaPoda: string | null;
  invernaderoId: number | null;
  parental: string;
}
