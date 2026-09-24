import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { Sidebar } from '../shared/sidebar/sidebar';
import { ConfirmDialog } from '../shared/confirm-dialog/confirm-dialog';
import { PuedeDirective } from '../../directives/puede.directive';
import { ParcelaService } from '../../services/services/parcela';
import { InvernaderoService } from '../../services/services/invernadero';
import { NotificacionService } from '../../services/services/notificacion';
import { ParcelaRequest, ParcelaResponse } from '../../interfaces/parcela.interfaces';
import { InvernaderoResponse } from '../../interfaces/invernadero.interfaces';

@Component({
  selector: 'app-parcelas',
  imports: [CommonModule, RouterModule, FormsModule, Sidebar, PuedeDirective],
  templateUrl: './parcelas.html',
  styleUrl: './parcelas.scss',
})
export class Parcelas implements OnInit {

  parcelas: ParcelaResponse[] = [];
  invernaderos: InvernaderoResponse[] = [];
  cargando = true;
  error = false;

  filtroInvernaderoId: number | null = null;

  mostrarModal = false;
  modoEdicion = false;
  editId: number | null = null;
  guardando = false;
  errorForm = '';
  form: ParcelaRequest = this.formVacio();

  private dialog = inject(MatDialog);

  constructor(
    private parcelaService: ParcelaService,
    private invernaderoService: InvernaderoService,
    private notificacion: NotificacionService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.invernaderoService.listar().subscribe({
      next: (data) => { this.invernaderos = data; this.cdr.markForCheck(); },
      error: () => this.notificacion.error('Error al cargar los invernaderos'),
    });
    this.cargar();
  }

  private cargar(): void {
    this.cargando = true;
    this.parcelaService.listar(this.filtroInvernaderoId).subscribe({
      next: (data) => {
        this.parcelas = data;
        this.cargando = false;
        this.error = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.cargando = false;
        this.error = true;
        this.notificacion.error('Error al cargar las parcelas');
        this.cdr.markForCheck();
      },
    });
  }

  aplicarFiltros(): void {
    this.cargar();
  }

  porcentajeOcupacion(p: ParcelaResponse): number | null {
    if (p.numeroBancos == null || p.numeroBancos <= 0) return null;
    return Math.min(100, Math.round((p.bancosOcupados / p.numeroBancos) * 100));
  }

  private mensajeError(err: any, generico: string): string {
    const mensajeBackend = err?.error?.message;
    if (mensajeBackend) return mensajeBackend;
    if (err?.status === 403) return 'No tienes acceso a ese invernadero';
    if (err?.status === 409) return 'No se puede realizar la acción: hay datos asociados.';
    return generico;
  }

  private formVacio(): ParcelaRequest {
    return {
      nombre: '',
      invernaderoId: this.filtroInvernaderoId ?? null,
      numeroBancos: null,
      activo: true,
    };
  }

  abrirCrear(): void {
    this.modoEdicion = false;
    this.editId = null;
    this.form = this.formVacio();
    this.errorForm = '';
    this.mostrarModal = true;
  }

  abrirEditar(p: ParcelaResponse): void {
    this.modoEdicion = true;
    this.editId = p.id;
    this.form = {
      nombre: p.nombre,
      invernaderoId: p.invernaderoId,
      numeroBancos: p.numeroBancos ?? null,
      activo: p.activo,
    };
    this.errorForm = '';
    this.mostrarModal = true;
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
    if (!this.form.nombre?.trim()) {
      this.errorForm = 'El nombre de la parcela es obligatorio.';
      return;
    }
    if (this.form.numeroBancos != null && this.form.numeroBancos < 0) {
      this.errorForm = 'El número de bancos no puede ser negativo.';
      return;
    }

    this.guardando = true;
    this.errorForm = '';

    const obs = this.modoEdicion && this.editId != null
      ? this.parcelaService.actualizar(this.editId, this.form)
      : this.parcelaService.guardar(this.form);

    obs.subscribe({
      next: () => {
        this.guardando = false;
        this.cerrarModal();
        this.notificacion.exito(
          this.modoEdicion ? 'Parcela actualizada correctamente' : 'Parcela creada correctamente');
        this.cargar();
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.guardando = false;
        this.errorForm = this.mensajeError(err, 'No se pudo guardar la parcela. Revisa los datos.');
        this.notificacion.error(this.errorForm);
        this.cdr.markForCheck();
      },
    });
  }

  eliminar(p: ParcelaResponse): void {
    this.dialog
      .open(ConfirmDialog, {
        width: '380px',
        autoFocus: false,
        data: {
          titulo: 'Eliminar parcela',
          mensaje: `¿Seguro que deseas eliminar la parcela “${p.nombre}”? Esta acción no se puede deshacer.`,
          textoConfirmar: 'Eliminar',
          textoCancelar: 'Cancelar',
          peligro: true,
        },
      })
      .afterClosed()
      .subscribe((confirmado) => {
        if (!confirmado) return;
        this.parcelaService.eliminar(p.id).subscribe({
          next: () => {
            this.parcelas = this.parcelas.filter(x => x.id !== p.id);
            this.notificacion.exito('Parcela eliminada correctamente');
            this.cdr.markForCheck();
          },
          error: (err) => this.notificacion.error(
            this.mensajeError(err, 'No se pudo eliminar la parcela')),
        });
      });
  }
}
