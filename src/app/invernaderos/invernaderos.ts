import { Component, OnInit, OnDestroy, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import * as L from 'leaflet';
import { Sidebar } from '../shared/sidebar/sidebar';
import { ConfirmDialog } from '../shared/confirm-dialog/confirm-dialog';
import { InvernaderoService } from '../../services/services/invernadero';
import { FincaService } from '../../services/services/finca';
import { NotificacionService } from '../../services/services/notificacion';
import { InvernaderoRequest, InvernaderoResponse } from '../../interfaces/invernadero.interfaces';
import { FincaResponse } from '../../interfaces/finca.interfaces';

@Component({
  selector: 'app-invernaderos',
  imports: [CommonModule, RouterModule, FormsModule, Sidebar],
  templateUrl: './invernaderos.html',
  styleUrl: './invernaderos.scss',
})
export class Invernaderos implements OnInit, OnDestroy {

  invernaderos: InvernaderoResponse[] = [];
  fincas: FincaResponse[] = [];
  cargando = true;

  // ── Modal crear/editar ────────────────────────────────────────
  mostrarModal = false;
  modoEdicion = false;
  editId: number | null = null;
  guardando = false;
  errorForm = '';
  form: InvernaderoRequest = this.formVacio();

  // ── Preview de ubicación de una fila ──────────────────────────
  ubicacionActivaId: number | null = null;

  private mapa: L.Map | null = null;
  private marcador: L.Marker | null = null;
  private mapaPreview: L.Map | null = null;
  private readonly centroPorDefecto: L.LatLngTuple = [14.6349, -90.5069];

  private dialog = inject(MatDialog);

  constructor(
    private invernaderoService: InvernaderoService,
    private fincaService: FincaService,
    private notificacion: NotificacionService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.cargar();
    this.fincaService.listar().subscribe({
      next: (data) => { this.fincas = data; this.cdr.markForCheck(); },
      error: () => this.notificacion.error('Error al cargar las fincas'),
    });
  }

  ngOnDestroy(): void {
    this.destruirMapa();
    this.destruirMapaPreview();
  }

  private cargar(): void {
    this.cargando = true;
    this.invernaderoService.listar().subscribe({
      next: (data) => { this.invernaderos = data; this.cargando = false; this.cdr.markForCheck(); },
      error: () => {
        this.cargando = false;
        this.notificacion.error('Error al cargar los invernaderos');
        this.cdr.markForCheck();
      },
    });
  }

  tieneUbicacion(inv: InvernaderoResponse): boolean {
    return inv.latitud != null && inv.longitud != null;
  }

  mapaUrl(inv: InvernaderoResponse): string | null {
    if (inv.latitud == null || inv.longitud == null) return null;
    return inv.mapaUrl ?? `https://www.google.com/maps?q=${inv.latitud},${inv.longitud}`;
  }

  // ── Ver ubicación (mapa embebido en la fila) ──────────────────
  verUbicacion(inv: InvernaderoResponse): void {
    if (this.ubicacionActivaId === inv.id) {
      this.ubicacionActivaId = null;
      this.destruirMapaPreview();
      return;
    }
    this.ubicacionActivaId = inv.id;
    this.destruirMapaPreview();
    if (!this.tieneUbicacion(inv)) return;
    setTimeout(() => this.iniciarMapaPreview(inv), 0);
  }

  private iniciarMapaPreview(inv: InvernaderoResponse): void {
    if (inv.latitud == null || inv.longitud == null) return;
    const punto: L.LatLngTuple = [inv.latitud, inv.longitud];
    this.mapaPreview = L.map('mapaInvPreview', {
      center: punto, zoom: 16, zoomControl: true, scrollWheelZoom: false,
    });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19, attribution: '© OpenStreetMap',
    }).addTo(this.mapaPreview);
    L.marker(punto, { icon: this.pin() }).addTo(this.mapaPreview);
    setTimeout(() => this.mapaPreview?.invalidateSize(), 120);
  }

  private destruirMapaPreview(): void {
    this.mapaPreview?.remove();
    this.mapaPreview = null;
  }

  // ── Modal ─────────────────────────────────────────────────────
  private formVacio(): InvernaderoRequest {
    return { numero: null, nombreCultivo: '', fincaId: null, latitud: null, longitud: null };
  }

  abrirCrear(): void {
    this.modoEdicion = false;
    this.editId = null;
    this.form = this.formVacio();
    if (this.fincas.length === 1) this.form.fincaId = this.fincas[0].id;
    this.errorForm = '';
    this.mostrarModal = true;
    setTimeout(() => this.iniciarMapa(), 0);
  }

  abrirEditar(inv: InvernaderoResponse): void {
    this.modoEdicion = true;
    this.editId = inv.id;
    this.form = {
      numero: inv.numero,
      nombreCultivo: inv.nombreCultivo,
      fincaId: inv.fincaId,
      latitud: inv.latitud,
      longitud: inv.longitud,
    };
    this.errorForm = '';
    this.mostrarModal = true;
    setTimeout(() => this.iniciarMapa(), 0);
  }

  cerrarModal(): void {
    this.mostrarModal = false;
    this.errorForm = '';
    this.destruirMapa();
  }

  private iniciarMapa(): void {
    const centro: L.LatLngTuple =
      this.form.latitud != null && this.form.longitud != null
        ? [this.form.latitud, this.form.longitud]
        : this.centroPorDefecto;

    this.mapa = L.map('mapaInvForm', { center: centro, zoom: 12 });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19, attribution: '© OpenStreetMap',
    }).addTo(this.mapa);

    this.mapa.on('click', (e: L.LeafletMouseEvent) =>
      this.ponerMarcador(e.latlng.lat, e.latlng.lng));

    if (this.form.latitud != null && this.form.longitud != null) {
      this.ponerMarcador(this.form.latitud, this.form.longitud);
    }
    setTimeout(() => this.mapa?.invalidateSize(), 120);
  }

  private pin(): L.DivIcon {
    return L.divIcon({
      className: 'pin-invernadero',
      html: '<span class="pin-dot"></span>',
      iconSize: [22, 22],
      iconAnchor: [11, 11],
    });
  }

  private ponerMarcador(lat: number, lng: number): void {
    if (!this.marcador) {
      this.marcador = L.marker([lat, lng], { icon: this.pin(), draggable: true }).addTo(this.mapa!);
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
    this.form.latitud = this.redondear(lat);
    this.form.longitud = this.redondear(lng);
    this.cdr.markForCheck();
  }

  private redondear(n: number): number {
    return Math.round(n * 1e6) / 1e6;
  }

  coordsManual(): void {
    const { latitud, longitud } = this.form;
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
    this.form.latitud = null;
    this.form.longitud = null;
    if (this.marcador && this.mapa) {
      this.mapa.removeLayer(this.marcador);
      this.marcador = null;
    }
    this.cdr.markForCheck();
  }

  get mapaUrlForm(): string | null {
    const { latitud, longitud } = this.form;
    if (latitud == null || longitud == null) return null;
    return `https://www.google.com/maps?q=${latitud},${longitud}`;
  }

  private destruirMapa(): void {
    this.mapa?.remove();
    this.mapa = null;
    this.marcador = null;
  }

  guardar(): void {
    if (this.form.numero == null) {
      this.errorForm = 'El número del invernadero es obligatorio.';
      return;
    }
    if (!this.form.nombreCultivo?.trim()) {
      this.errorForm = 'El nombre de cultivo es obligatorio.';
      return;
    }

    this.guardando = true;
    this.errorForm = '';

    const obs = this.modoEdicion && this.editId != null
      ? this.invernaderoService.actualizar(this.editId, this.form)
      : this.invernaderoService.guardar(this.form);

    obs.subscribe({
      next: () => {
        this.guardando = false;
        this.cerrarModal();
        this.notificacion.exito(
          this.modoEdicion ? 'Invernadero actualizado correctamente' : 'Invernadero creado correctamente');
        this.ubicacionActivaId = null;
        this.destruirMapaPreview();
        this.cargar();
      },
      error: (err) => {
        this.guardando = false;
        this.errorForm = err?.status === 409
          ? 'Ya existe un invernadero con ese número.'
          : 'No se pudo guardar el invernadero. Revisa los datos.';
        this.notificacion.error(this.errorForm);
        this.cdr.markForCheck();
      },
    });
  }

  eliminar(inv: InvernaderoResponse): void {
    this.dialog
      .open(ConfirmDialog, {
        width: '380px',
        autoFocus: false,
        data: {
          titulo: 'Eliminar invernadero',
          mensaje: `¿Seguro que deseas eliminar el invernadero #${inv.numero} — ${inv.nombreCultivo}?`,
          textoConfirmar: 'Eliminar',
          textoCancelar: 'Cancelar',
          peligro: true,
        },
      })
      .afterClosed()
      .subscribe((confirmado) => {
        if (!confirmado) return;
        this.invernaderoService.eliminar(inv.id).subscribe({
          next: () => {
            this.invernaderos = this.invernaderos.filter(x => x.id !== inv.id);
            if (this.ubicacionActivaId === inv.id) {
              this.ubicacionActivaId = null;
              this.destruirMapaPreview();
            }
            this.notificacion.exito('Invernadero eliminado correctamente');
            this.cdr.markForCheck();
          },
          error: (err) => this.notificacion.error(
            err?.status === 409
              ? 'No se puede eliminar: el invernadero tiene datos asociados.'
              : 'No se pudo eliminar el invernadero'),
        });
      });
  }
}
