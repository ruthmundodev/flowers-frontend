import { Component, OnInit, OnDestroy, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import * as L from 'leaflet';
import { Sidebar } from '../shared/sidebar/sidebar';
import { ConfirmDialog } from '../shared/confirm-dialog/confirm-dialog';
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
export class Asignaciones implements OnInit, OnDestroy {

  readonly rolesGestionables = ['Supervisor', 'Sembrador'];
  readonly pluralRol: Record<string, string> = {
    'Supervisor': 'Supervisores',
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

  // Mapa de solo lectura para previsualizar la ubicación del invernadero
  // seleccionado en la asignación.
  private mapaPreview: L.Map | null = null;

  private dialog = inject(MatDialog);

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

    this.cargarInvernaderos();

    this.fincaService.listar().subscribe({
      next: (data) => {
        this.fincas = data;
        this.cdr.markForCheck();
      },
      error: () => this.notificacion.error('Error al cargar las fincas'),
    });
  }

  ngOnDestroy(): void {
    this.destruirMapaPreview();
  }

  private cargarInvernaderos(): void {
    this.invernaderoService.listar().subscribe({
      next: (data) => {
        this.invernaderos = data;
        this.cdr.markForCheck();
      },
      error: () => this.notificacion.error('Error al cargar los invernaderos'),
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
    this.destruirMapaPreview();
  }

  cambiarFinca(id: number | null): void {
    this.fincaFiltro = id;
    this.invernaderoSeleccionado = null;
    this.destruirMapaPreview();
  }

  seleccionarUsuario(): void {
    this.asignaciones = [];
    this.invernaderoSeleccionado = null;
    this.destruirMapaPreview();
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

  // ── Preview de ubicación del invernadero seleccionado ─────────
  get invSeleccionado(): InvernaderoResponse | null {
    return this.invernaderos.find(i => i.id === this.invernaderoSeleccionado) ?? null;
  }

  get seleccionadoTieneUbicacion(): boolean {
    const inv = this.invSeleccionado;
    return !!inv && inv.latitud != null && inv.longitud != null;
  }

  get mapaUrlSeleccionado(): string | null {
    const inv = this.invSeleccionado;
    if (!inv || inv.latitud == null || inv.longitud == null) return null;
    return inv.mapaUrl ?? `https://www.google.com/maps?q=${inv.latitud},${inv.longitud}`;
  }

  onSeleccionInvernadero(): void {
    // Solo se muestra el mapa cuando hay un invernadero seleccionado con coords.
    if (!this.seleccionadoTieneUbicacion) {
      this.destruirMapaPreview();
      return;
    }
    // El contenedor entra al DOM con el *ngIf; se inicializa tras el render.
    setTimeout(() => this.iniciarMapaPreview(), 0);
  }

  private iniciarMapaPreview(): void {
    const inv = this.invSeleccionado;
    if (!inv || inv.latitud == null || inv.longitud == null) return;
    const punto: L.LatLngTuple = [inv.latitud, inv.longitud];

    this.destruirMapaPreview();
    this.mapaPreview = L.map('mapaAsignacion', {
      center: punto,
      zoom: 16,
      zoomControl: true,
      scrollWheelZoom: false, // no robar el scroll de la página
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap',
    }).addTo(this.mapaPreview);

    const pin = L.divIcon({
      className: 'pin-invernadero',
      html: '<span class="pin-dot"></span>',
      iconSize: [22, 22],
      iconAnchor: [11, 11],
    });
    L.marker(punto, { icon: pin }).addTo(this.mapaPreview);

    setTimeout(() => this.mapaPreview?.invalidateSize(), 120);
  }

  private destruirMapaPreview(): void {
    this.mapaPreview?.remove();
    this.mapaPreview = null;
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
          this.destruirMapaPreview();
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
    this.dialog
      .open(ConfirmDialog, {
        width: '380px',
        autoFocus: false,
        data: {
          titulo: 'Quitar asignación',
          mensaje: `¿Seguro que deseas quitar el invernadero #${a.invernaderoNumero} de este ${this.rolFiltro.toLowerCase()}?`,
          textoConfirmar: 'Quitar',
          textoCancelar: 'Cancelar',
          peligro: true,
        },
      })
      .afterClosed()
      .subscribe((confirmado) => {
        if (!confirmado) return;

        this.invUsuarioService.eliminar(a.id).subscribe({
          next: () => {
            this.asignaciones = this.asignaciones.filter(x => x.id !== a.id);
            this.notificacion.exito('Asignación eliminada correctamente');
            this.cdr.markForCheck();
          },
          error: () => this.notificacion.error('No se pudo eliminar la asignación'),
        });
      });
  }
}
