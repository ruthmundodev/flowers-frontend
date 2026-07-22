import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import * as L from 'leaflet';
import { Sidebar } from '../shared/sidebar/sidebar';
import { UsuarioService } from '../../services/services/usuario';
import { InvernaderoService } from '../../services/services/invernadero';
import { InvernaderoUsuarioService } from '../../services/services/invernadero-usuario';
import { FincaService } from '../../services/services/finca';
import { NotificacionService } from '../../services/services/notificacion';
import { Auth } from '../../services/services/auth';
import { UsuarioResponse } from '../../interfaces/usuario.interfaces';
import { InvernaderoRequest, InvernaderoResponse } from '../../interfaces/invernadero.interfaces';
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

  // ── Alta de invernadero (modal con mapa) ────────────────────
  puedeCrearInvernadero = false;
  mostrarModalInv = false;
  guardandoInv = false;
  errorFormInv = '';
  formInv: InvernaderoRequest = this.formVacio();

  private mapa: L.Map | null = null;
  private marcador: L.Marker | null = null;
  // Centro por defecto: Guatemala (cuando aún no hay coordenadas elegidas).
  private readonly centroPorDefecto: L.LatLngTuple = [14.6349, -90.5069];

  // Mapa de solo lectura para previsualizar la ubicación del invernadero
  // seleccionado en la asignación.
  private mapaPreview: L.Map | null = null;

  constructor(
    private usuarioService: UsuarioService,
    private invernaderoService: InvernaderoService,
    private invUsuarioService: InvernaderoUsuarioService,
    private fincaService: FincaService,
    private notificacion: NotificacionService,
    private auth: Auth,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.puedeCrearInvernadero =
      this.auth.esAdministrador() || !!this.auth.getPermiso('Asignaciones')?.crear;

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
    this.destruirMapa();
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

  // ── Modal "Nuevo invernadero" ─────────────────────────────────
  private formVacio(): InvernaderoRequest {
    return { numero: null, nombreCultivo: '', fincaId: null, latitud: null, longitud: null };
  }

  abrirModalInvernadero(): void {
    this.formInv = this.formVacio();
    if (this.fincas.length === 1) this.formInv.fincaId = this.fincas[0].id;
    this.errorFormInv = '';
    this.mostrarModalInv = true;
    // El mapa necesita el contenedor ya renderizado en el DOM.
    setTimeout(() => this.iniciarMapa(), 0);
  }

  cerrarModalInvernadero(): void {
    this.mostrarModalInv = false;
    this.errorFormInv = '';
    this.destruirMapa();
  }

  private iniciarMapa(): void {
    const centro: L.LatLngTuple =
      this.formInv.latitud != null && this.formInv.longitud != null
        ? [this.formInv.latitud, this.formInv.longitud]
        : this.centroPorDefecto;

    this.mapa = L.map('mapaInvernadero', { center: centro, zoom: 12 });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap',
    }).addTo(this.mapa);

    this.mapa.on('click', (e: L.LeafletMouseEvent) =>
      this.ponerMarcador(e.latlng.lat, e.latlng.lng));

    if (this.formInv.latitud != null && this.formInv.longitud != null) {
      this.ponerMarcador(this.formInv.latitud, this.formInv.longitud);
    }

    // Leaflet a veces calcula mal el tamaño dentro de un modal recién abierto.
    setTimeout(() => this.mapa?.invalidateSize(), 120);
  }

  private ponerMarcador(lat: number, lng: number): void {
    const pin = L.divIcon({
      className: 'pin-invernadero',
      html: '<span class="pin-dot"></span>',
      iconSize: [22, 22],
      iconAnchor: [11, 11],
    });

    if (!this.marcador) {
      this.marcador = L.marker([lat, lng], { icon: pin, draggable: true }).addTo(this.mapa!);
      this.marcador.on('dragend', () => {
        const p = this.marcador!.getLatLng();
        this.actualizarCoords(p.lat, p.lng);
      });
    } else {
      this.marcador.setLatLng([lat, lng]);
    }
    this.actualizarCoords(lat, lng);
  }

  private actualizarCoords(lat: number, lng: number): void {
    this.formInv.latitud = this.redondear(lat);
    this.formInv.longitud = this.redondear(lng);
    this.cdr.markForCheck();
  }

  private redondear(n: number): number {
    return Math.round(n * 1e6) / 1e6; // ~11 cm de precisión, suficiente.
  }

  // Cuando el usuario escribe las coordenadas a mano, refleja en el mapa.
  coordsManual(): void {
    const { latitud, longitud } = this.formInv;
    if (latitud == null || longitud == null || !this.mapa) return;
    if (latitud < -90 || latitud > 90 || longitud < -180 || longitud > 180) return;
    this.ponerMarcador(latitud, longitud);
    this.mapa.setView([latitud, longitud], Math.max(this.mapa.getZoom(), 14));
  }

  usarMiUbicacion(): void {
    if (!navigator.geolocation) {
      this.notificacion.error('Tu dispositivo no permite geolocalización');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        this.ponerMarcador(latitude, longitude);
        this.mapa?.setView([latitude, longitude], 15);
        this.cdr.markForCheck();
      },
      () => this.notificacion.error('No se pudo obtener tu ubicación'),
    );
  }

  quitarUbicacion(): void {
    this.formInv.latitud = null;
    this.formInv.longitud = null;
    if (this.marcador && this.mapa) {
      this.mapa.removeLayer(this.marcador);
      this.marcador = null;
    }
    this.cdr.markForCheck();
  }

  get mapaUrlPreview(): string | null {
    const { latitud, longitud } = this.formInv;
    if (latitud == null || longitud == null) return null;
    return `https://www.google.com/maps?q=${latitud},${longitud}`;
  }

  private destruirMapa(): void {
    this.mapa?.remove();
    this.mapa = null;
    this.marcador = null;
  }

  guardarInvernadero(): void {
    if (this.formInv.numero == null) {
      this.errorFormInv = 'El número del invernadero es obligatorio.';
      return;
    }
    if (!this.formInv.nombreCultivo?.trim()) {
      this.errorFormInv = 'El nombre de cultivo es obligatorio.';
      return;
    }

    this.guardandoInv = true;
    this.errorFormInv = '';
    this.invernaderoService.guardar(this.formInv).subscribe({
      next: () => {
        this.guardandoInv = false;
        this.cerrarModalInvernadero();
        this.notificacion.exito('Invernadero creado correctamente');
        this.cargarInvernaderos(); // refresca la lista (incluye nombre de finca)
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.guardandoInv = false;
        this.errorFormInv = err?.status === 409
          ? 'Ya existe un invernadero con ese número.'
          : 'No se pudo crear el invernadero. Revisa los datos.';
        this.notificacion.error(this.errorFormInv);
        this.cdr.markForCheck();
      },
    });
  }
}
