export interface UsuarioResponse {
  id: number;
  nombreCompleto: string;
  correoElectronico: string;
  codigoTrabajador: number | null;
  rol: {
    id: number;
    nombre: string;
  };
  createdAt: string | null;
  updatedAt: string | null;
}
