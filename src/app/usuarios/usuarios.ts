import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Sidebar } from '../shared/sidebar/sidebar';
import { UsuarioService } from '../../services/services/usuario';
import { RolService } from '../../services/services/rol';
import { NotificacionService } from '../../services/services/notificacion';
import { UsuarioRequest, UsuarioResponse } from '../../interfaces/usuario.interfaces';
import { RolResponse } from '../../interfaces/rol.interfaces';

@Component({
  selector: 'app-usuarios',
  imports: [CommonModule, RouterModule, FormsModule, Sidebar],
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
        this.cdr.markForCheck();
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
      (u.rol?.nombre ?? '').toLowerCase().includes(q)
    );
  }

  // ── Modal ───────────────────────────────────────────────────
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

  private formVacio(): UsuarioRequest {
    return {
      nombreCompleto: '',
      correoElectronico: '',
      password: '',
      codigoTrabajador: null,
      rolId: null,
    };
  }

  rolBadgeClass(rol: string | null | undefined): string {
    const map: Record<string, string> = {
      'Administrador': 'badge--green',
      'Supervisor': 'badge--blue',
      'Trabajador': 'badge--gray',
      'Sembrador': 'badge--gray',
    };
    return map[rol ?? ''] ?? 'badge--gray';
  }
}
