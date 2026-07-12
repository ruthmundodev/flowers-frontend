import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { Sidebar } from '../shared/sidebar/sidebar';
import { UsuarioService } from '../../services/services/usuario';
import { RolService } from '../../services/services/rol';
import { NotificacionService } from '../../services/services/notificacion';
import { UsuarioRequest, UsuarioResponse } from '../../interfaces/usuario.interfaces';
import { RolResponse } from '../../interfaces/rol.interfaces';

@Component({
  selector: 'app-usuarios',
  imports: [CommonModule, RouterModule, FormsModule, MatSlideToggleModule, Sidebar],
  templateUrl: './usuarios.html',
  styleUrl: './usuarios.scss',
})
export class Usuarios implements OnInit {

  usuarios: UsuarioResponse[] = [];
  roles: RolResponse[] = [];
  cargando = true;
  busqueda = '';

  // Modal "Nuevo usuario"
  mostrarModal = false;
  guardando = false;
  errorForm = '';
  form: UsuarioRequest = this.formVacio();

  // Modal "Editar rol"
  mostrarModalRol = false;
  usuarioEditandoRol: UsuarioResponse | null = null;
  rolIdNuevo: number | null = null;
  guardandoRol = false;

  // Modal "Resetear contraseña"
  mostrarModalPassword = false;
  usuarioPassword: UsuarioResponse | null = null;
  nuevaPassword = '';
  errorPassword = '';
  guardandoPassword = false;

  // Toggle activo (por ID mientras se procesa)
  toggling = new Set<number>();

  constructor(
    private usuarioService: UsuarioService,
    private rolService: RolService,
    private notificacion: NotificacionService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.cargar();
    this.rolService.listar().subscribe({
      next: (data) => {
        this.roles = data;
        this.cdr.detectChanges();
      },
      error: () => this.notificacion.error('Error al cargar los roles'),
    });
  }

  cargar(): void {
    this.cargando = true;
    this.usuarioService.listar().subscribe({
      next: (data) => {
        this.usuarios = data;
        this.cargando = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.cargando = false;
        this.notificacion.error('Error al cargar los usuarios');
        this.cdr.markForCheck();
      },
    });
  }

  get usuariosFiltrados(): UsuarioResponse[] {
    if (!this.busqueda) return this.usuarios;
    const q = this.busqueda.toLowerCase();
    return this.usuarios.filter(u =>
      u.nombreCompleto.toLowerCase().includes(q) ||
      u.correoElectronico.toLowerCase().includes(q) ||
      u.rol.nombre.toLowerCase().includes(q)
    );
  }

  // ── Modal Nuevo usuario ──────────────────────────────────────
  abrirModal(): void {
    this.form = this.formVacio();
    this.errorForm = '';
    this.mostrarModal = true;
  }

  cerrarModal(): void {
    this.mostrarModal = false;
    this.errorForm = '';
  }

  guardarUsuario(): void {
    if (!this.form.nombreCompleto?.trim() || !this.form.correoElectronico?.trim() ||
        !this.form.password?.trim() || this.form.rolId == null) {
      this.errorForm = 'Nombre, correo, contraseña y rol son obligatorios.';
      return;
    }

    this.guardando = true;
    this.errorForm = '';

    this.usuarioService.guardar(this.form).subscribe({
      next: (res) => {
        this.usuarios = [...this.usuarios, res];
        this.guardando = false;
        this.cerrarModal();
        this.notificacion.exito('Usuario creado correctamente');
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.guardando = false;
        this.errorForm = err?.status === 409
          ? 'Ya existe un usuario con ese correo.'
          : 'Error al crear el usuario. Intenta de nuevo.';
        this.notificacion.error('No se pudo crear el usuario');
        this.cdr.markForCheck();
      },
    });
  }

  // ── Modal Editar rol ─────────────────────────────────────────
  abrirModalRol(u: UsuarioResponse): void {
    this.usuarioEditandoRol = u;
    this.rolIdNuevo = u.rol.id;
    this.mostrarModalRol = true;
  }

  cerrarModalRol(): void {
    this.mostrarModalRol = false;
    this.usuarioEditandoRol = null;
    this.rolIdNuevo = null;
  }

  guardarRol(): void {
    if (!this.usuarioEditandoRol || this.rolIdNuevo == null) return;

    this.guardandoRol = true;
    this.usuarioService.actualizarRol(this.usuarioEditandoRol.id, this.rolIdNuevo).subscribe({
      next: (res) => {
        this.usuarios = this.usuarios.map(u => u.id === res.id ? res : u);
        this.guardandoRol = false;
        this.cerrarModalRol();
        this.notificacion.exito('Rol actualizado correctamente');
        this.cdr.markForCheck();
      },
      error: () => {
        this.guardandoRol = false;
        this.notificacion.error('No se pudo actualizar el rol');
        this.cdr.markForCheck();
      },
    });
  }

  // ── Modal Resetear contraseña ────────────────────────────────
  abrirModalPassword(u: UsuarioResponse): void {
    this.usuarioPassword = u;
    this.nuevaPassword = '';
    this.errorPassword = '';
    this.mostrarModalPassword = true;
  }

  cerrarModalPassword(): void {
    this.mostrarModalPassword = false;
    this.usuarioPassword = null;
    this.nuevaPassword = '';
    this.errorPassword = '';
  }

  confirmarPassword(): void {
    if (!this.nuevaPassword.trim()) {
      this.errorPassword = 'La contraseña no puede estar vacía.';
      return;
    }
    if (this.nuevaPassword.length < 6) {
      this.errorPassword = 'La contraseña debe tener al menos 6 caracteres.';
      return;
    }
    if (!this.usuarioPassword) return;

    this.guardandoPassword = true;
    this.errorPassword = '';
    this.usuarioService.resetearPassword(this.usuarioPassword.id, this.nuevaPassword).subscribe({
      next: () => {
        this.guardandoPassword = false;
        this.cerrarModalPassword();
        this.notificacion.exito('Contraseña restablecida correctamente');
        this.cdr.markForCheck();
      },
      error: () => {
        this.guardandoPassword = false;
        this.errorPassword = 'No se pudo restablecer la contraseña.';
        this.cdr.markForCheck();
      },
    });
  }

  // ── Toggle activo ────────────────────────────────────────────
  toggleActivo(u: UsuarioResponse): void {
    this.toggling.add(u.id);
    this.usuarioService.toggleActivo(u.id).subscribe({
      next: (res) => {
        this.usuarios = this.usuarios.map(x => x.id === res.id ? res : x);
        this.toggling.delete(u.id);
        this.notificacion.exito(`Usuario ${res.activo ? 'activado' : 'desactivado'} correctamente`);
        this.cdr.markForCheck();
      },
      error: () => {
        this.toggling.delete(u.id);
        this.notificacion.error('No se pudo cambiar el estado del usuario');
        this.cdr.markForCheck();
      },
    });
  }

  // ── Helpers ──────────────────────────────────────────────────
  private formVacio(): UsuarioRequest {
    return {
      nombreCompleto: '',
      correoElectronico: '',
      password: '',
      codigoTrabajador: null,
      rolId: null,
    };
  }

  rolBadgeClass(rol: string): string {
    const map: Record<string, string> = {
      'Administrador': 'badge--green',
      'Supervisor': 'badge--blue',
      'Sembrador': 'badge--gray',
    };
    return map[rol] ?? 'badge--gray';
  }
}
