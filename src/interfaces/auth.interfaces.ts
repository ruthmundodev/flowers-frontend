export interface LoginRequest {
  correoElectronico: string;
  password: string;
}

export interface PermisoSession {
  moduloId: number;
  moduloNombre: string;
  crear: boolean;
  consultar: boolean;
  editar: boolean;
  eliminar: boolean;
}

export interface UsuarioSession {
  id: number;
  nombreCompleto: string;
  correoElectronico: string;
  codigoTrabajador: number;
  rol: {
    id: number;
    nombre: string;
  };
  permisos: PermisoSession[];
}

export interface LoginResponse {
  token: string;
  tipo: string;
  usuario: UsuarioSession;
}
