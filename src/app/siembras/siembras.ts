import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { forkJoin } from 'rxjs';
import { Sidebar } from '../shared/sidebar/sidebar';
import { ConfirmDialog } from '../shared/confirm-dialog/confirm-dialog';
import { PuedeDirective } from '../../directives/puede.directive';
import { CultivoService } from '../../services/services/cultivo';
import { InvernaderoService } from '../../services/services/invernadero';
import { TemporadaService } from '../../services/services/temporada';
import { VariedadService } from '../../services/services/variedad';
import { ParcelaService } from '../../services/services/parcela';
import { NotificacionService } from '../../services/services/notificacion';
import { CosechaRequest, CultivoRequest, CultivoResponse } from '../../interfaces/cultivo.interfaces';
import { InvernaderoResponse } from '../../interfaces/invernadero.interfaces';
import { TemporadaResponse } from '../../interfaces/temporada.interfaces';
import { VariedadResponse } from '../../interfaces/variedad.interfaces';
import { ParcelaResponse } from '../../interfaces/parcela.interfaces';

type EstadoSiembra = 'Sembrado' | 'En producción' | 'Cosechado';

@Component({
  selector: 'app-siembras',
  imports: [CommonModule, RouterModule, FormsModule, Sidebar, PuedeDirective],
  templateUrl: './siembras.html',
  styleUrl: './siembras.scss',
})
export class Siembras implements OnInit {

  cultivos: CultivoResponse[] = [];
  invernaderos: InvernaderoResponse[] = [];
  temporadas: TemporadaResponse[] = [];
  variedades: VariedadResponse[] = [];
  cargando = true;
  error = false;

  filtroInvernaderoId: number | null = null;
  filtroTemporadaId: number | null = null;
  filtroParcelaId: number | null = null;
  parcelasFiltro: ParcelaResponse[] = [];

  mostrarModal = false;
  modoEdicion = false;
  editId: number | null = null;
  guardando = false;
  errorForm = '';
  form: CultivoRequest = this.formVacio();
  parcelasModal: ParcelaResponse[] = [];
  cargandoParcelasModal = false;
  bancosActualesEdicion = 0;

  mostrarModalCosecha = false;
  cultivoCosechaId: number | null = null;
  cultivoCosechaLabel = '';
  guardandoCosecha = false;
  errorCosecha = '';
  formCosecha: CosechaRequest = this.formCosechaVacio();

  private dialog = inject(MatDialog);

  constructor(
    private cultivoService: CultivoService,
    private invernaderoService: InvernaderoService,
    private temporadaService: TemporadaService,
    private variedadService: VariedadService,
    private parcelaService: ParcelaService,
    private notificacion: NotificacionService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    forkJoin({
      invernaderos: this.invernaderoService.listar(),
      temporadas: this.temporadaService.listar(),
      variedades: this.variedadService.listar(),
    }).subscribe({
      next: ({ invernaderos, temporadas, variedades }) => {
        this.invernaderos = invernaderos;
        this.temporadas = temporadas;
        this.variedades = variedades;
        this.cdr.markForCheck();
      },
      error: () => this.notificacion.error('Error al cargar los catálogos'),
    });
    this.cargar();
  }

  private cargar(): void {
    this.cargando = true;
    this.cultivoService.listar(this.filtroInvernaderoId, this.filtroTemporadaId, this.filtroParcelaId).subscribe({
      next: (data) => {
        this.cultivos = data;
        this.cargando = false;
        this.error = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.cargando = false;
        this.error = true;
        this.notificacion.error('Error al cargar las siembras');
        this.cdr.markForCheck();
      },
    });
  }

  aplicarFiltros(): void {
    this.cargar();
  }

  onFiltroInvernaderoChange(): void {
    this.filtroParcelaId = null;
    this.parcelasFiltro = [];
    if (this.filtroInvernaderoId == null) {
      this.aplicarFiltros();
      return;
    }
    this.parcelaService.listar(this.filtroInvernaderoId).subscribe({
      next: (data) => {
        this.parcelasFiltro = data;
        this.cdr.markForCheck();
      },
      error: () => this.notificacion.error('Error al cargar las parcelas'),
    });
    this.aplicarFiltros();
  }

  temporadaLabel(t: TemporadaResponse): string {
    if (t.descripcion) return t.descripcion;
    const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    return `${meses[(t.mes ?? 1) - 1] ?? t.mes}/${t.year}`;
  }

  estado(c: CultivoResponse): EstadoSiembra {
    const hoy = this.hoyStr();
    if (c.fechaFinProdu && c.fechaFinProdu <= hoy) return 'Cosechado';
    if (c.fechaInicioProdu && c.fechaInicioProdu <= hoy) return 'En producción';
    return 'Sembrado';
  }

  claseEstado(c: CultivoResponse): string {
    switch (this.estado(c)) {
      case 'Cosechado': return 'badge--gray';
      case 'En producción': return 'badge--green';
      default: return 'badge--yellow';
    }
  }

  private mensajeError(err: any, generico: string): string {
    const mensajeBackend = err?.error?.message;
    if (mensajeBackend) return mensajeBackend;
    if (err?.status === 403) return 'No tienes acceso a ese invernadero';
    if (err?.status === 409) return 'No se puede realizar la acción: hay datos asociados.';
    return generico;
  }

  private hoyStr(): string {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  private formVacio(): CultivoRequest {
    return {
      variedadId: null,
      invernaderoId: this.filtroInvernaderoId ?? null,
      parcelaId: null,
      bancos: null,
      temporadaId: this.filtroTemporadaId ?? null,
      fechaSiembra: this.hoyStr(),
      fechaInicioSiembra: null,
      fechaFinSiembra: null,
      fechaInicioProdu: null,
      fechaFinProdu: null,
      cantidad: null,
    };
  }

  abrirCrear(): void {
    this.modoEdicion = false;
    this.editId = null;
    this.form = this.formVacio();
    this.errorForm = '';
    this.parcelasModal = [];
    this.bancosActualesEdicion = 0;
    this.mostrarModal = true;
    if (this.form.invernaderoId != null) this.onInvernaderoModalChange(true);
  }

  abrirEditar(c: CultivoResponse): void {
    this.modoEdicion = true;
    this.editId = c.id;
    this.form = {
      variedadId: c.variedadId ?? null,
      invernaderoId: c.invernaderoId ?? null,
      parcelaId: c.parcelaId ?? null,
      bancos: c.bancos ?? null,
      temporadaId: c.temporadaId ?? null,
      fechaSiembra: c.fechaSiembra ?? '',
      fechaInicioSiembra: c.fechaInicioSiembra ?? null,
      fechaFinSiembra: c.fechaFinSiembra ?? null,
      fechaInicioProdu: c.fechaInicioProdu ?? null,
      fechaFinProdu: c.fechaFinProdu ?? null,
      cantidad: c.cantidad ?? null,
    };
    this.errorForm = '';
    this.parcelasModal = [];
    this.bancosActualesEdicion = c.bancos ?? 0;
    this.mostrarModal = true;
    if (this.form.invernaderoId != null) this.onInvernaderoModalChange(true);
  }

  onInvernaderoModalChange(mantenerParcela = false): void {
    if (!mantenerParcela) this.form.parcelaId = null;
    this.parcelasModal = [];
    if (this.form.invernaderoId == null) return;
    this.cargandoParcelasModal = true;
    this.parcelaService.listar(this.form.invernaderoId).subscribe({
      next: (data) => {
        this.parcelasModal = data.filter(p => p.activo);
        this.cargandoParcelasModal = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.cargandoParcelasModal = false;
        this.notificacion.error('Error al cargar las parcelas del invernadero');
        this.cdr.markForCheck();
      },
    });
  }

  parcelaLabel(p: ParcelaResponse): string {
    const libres = p.numeroBancos == null ? 'sin límite' : `${p.bancosLibres ?? 0} libres`;
    return `${p.nombre} · ${libres}`;
  }

  get parcelaSeleccionadaModal(): ParcelaResponse | null {
    return this.parcelasModal.find(p => p.id === this.form.parcelaId) ?? null;
  }

  get bancosLibresModal(): number | null {
    const p = this.parcelaSeleccionadaModal;
    if (!p || p.numeroBancos == null) return null;
    const libres = p.bancosLibres ?? 0;
    return this.modoEdicion ? libres + this.bancosActualesEdicion : libres;
  }

  cerrarModal(): void {
    this.mostrarModal = false;
    this.errorForm = '';
  }

  guardar(): void {
    if (this.form.invernaderoId == null) {
      this.errorForm = 'El invernadero es obligatorio.';
      return;
    }
    if (this.form.variedadId == null) {
      this.errorForm = 'La variedad es obligatoria.';
      return;
    }
    if (this.form.parcelaId == null) {
      this.errorForm = 'La parcela es obligatoria.';
      return;
    }
    if (this.form.bancos != null && this.form.bancos <= 0) {
      this.errorForm = 'Los bancos deben ser mayor a 0.';
      return;
    }
    if (this.form.bancos != null && this.bancosLibresModal != null && this.form.bancos > this.bancosLibresModal) {
      this.errorForm = `La parcela no tiene suficientes bancos libres (libres: ${this.bancosLibresModal}).`;
      return;
    }
    if (!this.form.fechaSiembra) {
      this.errorForm = 'La fecha de siembra es obligatoria.';
      return;
    }
    if (this.form.cantidad == null || this.form.cantidad <= 0) {
      this.errorForm = 'La cantidad debe ser mayor a 0.';
      return;
    }
    if (this.form.fechaInicioSiembra && this.form.fechaFinSiembra
      && this.form.fechaFinSiembra < this.form.fechaInicioSiembra) {
      this.errorForm = 'La fecha fin de la ventana de siembra no puede ser anterior a la fecha inicio.';
      return;
    }

    this.guardando = true;
    this.errorForm = '';

    const obs = this.modoEdicion && this.editId != null
      ? this.cultivoService.actualizar(this.editId, this.form)
      : this.cultivoService.guardar(this.form);

    obs.subscribe({
      next: () => {
        this.guardando = false;
        this.cerrarModal();
        this.notificacion.exito(
          this.modoEdicion ? 'Siembra actualizada correctamente' : 'Siembra creada correctamente');
        this.cargar();
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.guardando = false;
        this.errorForm = this.mensajeError(err, 'No se pudo guardar la siembra. Revisa los datos.');
        this.notificacion.error(this.errorForm);
        this.cdr.markForCheck();
      },
    });
  }

  eliminar(c: CultivoResponse): void {
    this.dialog
      .open(ConfirmDialog, {
        width: '380px',
        autoFocus: false,
        data: {
          titulo: 'Eliminar siembra',
          mensaje: `¿Seguro que deseas eliminar la siembra de “${c.variedadNombre ?? 'esta variedad'}”? Esta acción no se puede deshacer.`,
          textoConfirmar: 'Eliminar',
          textoCancelar: 'Cancelar',
          peligro: true,
        },
      })
      .afterClosed()
      .subscribe((confirmado) => {
        if (!confirmado) return;
        this.cultivoService.eliminar(c.id).subscribe({
          next: () => {
            this.cultivos = this.cultivos.filter(x => x.id !== c.id);
            this.notificacion.exito('Siembra eliminada correctamente');
            this.cdr.markForCheck();
          },
          error: (err) => this.notificacion.error(
            this.mensajeError(err, 'No se pudo eliminar la siembra')),
        });
      });
  }

  private formCosechaVacio(): CosechaRequest {
    return {
      fechaInicioProdu: null,
      fechaFinProdu: null,
      fechaCosecha: this.hoyStr(),
      numeroBancos: null,
      rendimientoTotal: null,
    };
  }

  abrirCosecha(c: CultivoResponse): void {
    this.cultivoCosechaId = c.id;
    this.cultivoCosechaLabel = `${c.variedadNombre ?? 'Variedad'} — Invernadero #${c.invernaderoNumero ?? '—'}`;
    this.formCosecha = {
      fechaInicioProdu: c.fechaInicioProdu ?? null,
      fechaFinProdu: c.fechaFinProdu ?? null,
      fechaCosecha: this.hoyStr(),
      numeroBancos: null,
      rendimientoTotal: null,
    };
    this.errorCosecha = '';
    this.mostrarModalCosecha = true;
  }

  cerrarModalCosecha(): void {
    this.mostrarModalCosecha = false;
    this.errorCosecha = '';
    this.cultivoCosechaId = null;
  }

  guardarCosecha(): void {
    if (!this.formCosecha.fechaCosecha) {
      this.errorCosecha = 'La fecha de cosecha es obligatoria.';
      return;
    }
    if (this.formCosecha.numeroBancos == null || this.formCosecha.numeroBancos < 0) {
      this.errorCosecha = 'El número de bancos es obligatorio.';
      return;
    }
    if (this.formCosecha.rendimientoTotal == null || this.formCosecha.rendimientoTotal < 0) {
      this.errorCosecha = 'El rendimiento total es obligatorio.';
      return;
    }
    if (this.formCosecha.fechaInicioProdu && this.formCosecha.fechaFinProdu
      && this.formCosecha.fechaFinProdu < this.formCosecha.fechaInicioProdu) {
      this.errorCosecha = 'La fecha fin de producción no puede ser anterior a la fecha inicio.';
      return;
    }
    if (this.cultivoCosechaId == null) return;

    this.guardandoCosecha = true;
    this.errorCosecha = '';

    this.cultivoService.registrarCosecha(this.cultivoCosechaId, this.formCosecha).subscribe({
      next: () => {
        this.guardandoCosecha = false;
        this.cerrarModalCosecha();
        this.notificacion.exito('Cosecha registrada correctamente');
        this.cargar();
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.guardandoCosecha = false;
        this.errorCosecha = this.mensajeError(err, 'No se pudo registrar la cosecha. Revisa los datos.');
        this.notificacion.error(this.errorCosecha);
        this.cdr.markForCheck();
      },
    });
  }
}
