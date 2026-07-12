import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Sidebar } from '../shared/sidebar/sidebar';
import { UsuarioService } from '../../services/services/usuario';
import { InvernaderoService } from '../../services/services/invernadero';
import { InvernaderoUsuarioService } from '../../services/services/invernadero-usuario';
import { FincaService } from '../../services/services/finca';
import { NotificacionService } from '../../services/services/notificacion';
import { UsuarioResponse } from '../../interfaces/usuario.interfaces';
import { InvernaderoResponse } from '../../interfaces/invernadero.interfaces';
import { FincaResponse } from '../../interfaces/finca.interfaces';
import { InvernaderoUsuarioResponse } from '../../interfaces/invernadero-usuario.interfaces';

@Component({
  selector: 'app-asignaciones',
  imports: [CommonModule, RouterModule, FormsModule, Sidebar],
  templateUrl: './asignaciones.html',
  styleUrl: './asignaciones.scss',
})
export class Asignaciones implements OnInit {

  readonly rolesGestionables = ['Supervisor', 'Trabajador', 'Sembrador'];
  readonly pluralRol: Record<string, string> = {
    'Supervisor': 'Supervisores',
    'Trabajador': 'Trabajadores',
    'Sembrador':  'Sembradores',
  };
  rolFiltro = 'Supervisor';

  todos: UsuarioResponse[] = [];
  invernaderos: InvernaderoResponse[] = [];
  fincas: FincaResponse[] = [];
  asignaciones: InvernaderoUsuarioResponse[] = [];

  usuarioSeleccionadoId: number | null = null;
  invernaderoSeleccionado: number | null = null;
  fincaFiltro: number | null = null;

  cargando = true;
  guardando = false;

  constructor(
    private usuarioService: UsuarioService,
    private invernaderoService: InvernaderoService,
    private invUsuarioService: InvernaderoUsuarioService,
    private fincaService: FincaService,
    private notificacion: NotificacionService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.usuarioService.listar().subscribe({
      next: (usuarios) => {
        this.todos = usuarios.filter(u =>
          this.rolesGestionables.includes(u.rol.nombre));
        this.cargando = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.cargando = false;
        this.notificacion.error('Error al cargar los usuarios');
        this.cdr.markForCheck();
      },
    });

    this.invernaderoService.listar().subscribe({
      next: (data) => {
        this.invernaderos = data;
        this.cdr.markForCheck();
      },
      error: () => this.notificacion.error('Error al cargar los invernaderos'),
    });

    this.fincaService.listar().subscribe({
      next: (data) => {
        this.fincas = data;
        this.cdr.markForCheck();
      },
      error: () => this.notificacion.error('Error al cargar las fincas'),
    });
  }

  get usuariosFiltrados(): UsuarioResponse[] {
    return this.todos.filter(u => u.rol.nombre === this.rolFiltro);
  }

  cambiarRol(rol: string): void {
    this.rolFiltro = rol;
    this.usuarioSeleccionadoId = null;
    this.asignaciones = [];
    this.invernaderoSeleccionado = null;
  }

  cambiarFinca(id: number | null): void {
    this.fincaFiltro = id;
    this.invernaderoSeleccionado = null;
  }

  seleccionarUsuario(): void {
    this.asignaciones = [];
    this.invernaderoSeleccionado = null;
    if (this.usuarioSeleccionadoId == null) return;

    this.invUsuarioService.listarPorUsuario(this.usuarioSeleccionadoId).subscribe({
      next: (data) => {
        this.asignaciones = data;
        this.cdr.markForCheck();
      },
      error: () => this.notificacion.error('Error al cargar las asignaciones'),
    });
  }

  get invernaderosDisponibles(): InvernaderoResponse[] {
    const asignadosIds = new Set(this.asignaciones.map(a => a.invernaderoId));
    return this.invernaderos.filter(inv =>
      !asignadosIds.has(inv.id) &&
      (this.fincaFiltro == null || inv.fincaId === this.fincaFiltro),
    );
  }

  asignar(): void {
    if (this.usuarioSeleccionadoId == null || this.invernaderoSeleccionado == null) {
      this.notificacion.error('Selecciona un usuario y un invernadero');
      return;
    }

    this.guardando = true;
    this.invUsuarioService
      .asignar({ usuarioId: this.usuarioSeleccionadoId, invernaderoId: this.invernaderoSeleccionado })
      .subscribe({
        next: (res) => {
          this.asignaciones = [...this.asignaciones, res];
          this.invernaderoSeleccionado = null;
          this.guardando = false;
          this.notificacion.exito('Invernadero asignado correctamente');
          this.cdr.markForCheck();
        },
        error: () => {
          this.guardando = false;
          this.notificacion.error('No se pudo asignar el invernadero');
          this.cdr.markForCheck();
        },
      });
  }

  quitar(a: InvernaderoUsuarioResponse): void {
    if (!confirm(`¿Quitar el invernadero #${a.invernaderoNumero} de este ${this.rolFiltro.toLowerCase()}?`)) return;

    this.invUsuarioService.eliminar(a.id).subscribe({
      next: () => {
        this.asignaciones = this.asignaciones.filter(x => x.id !== a.id);
        this.notificacion.exito('Asignación eliminada correctamente');
        this.cdr.markForCheck();
      },
      error: () => this.notificacion.error('No se pudo eliminar la asignación'),
    });
  }
}
