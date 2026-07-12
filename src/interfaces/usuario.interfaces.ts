export interface UsuarioResponse {
  id: number;
  nombreCompleto: string;
  correoElectronico: string;
  codigoTrabajador: number | null;
  rol: {
    id: number;
    nombre: string;
  };
  activo: boolean;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface UsuarioRequest {
  nombreCompleto: string;
  correoElectronico: string;
  password: string;
  codigoTrabajador: number | null;
  rolId: number | null;
}
