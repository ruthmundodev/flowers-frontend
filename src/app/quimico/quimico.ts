import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { Sidebar } from '../shared/sidebar/sidebar';
import { QuimicoService } from '../../services/services/quimico';
import { QuimicoRequest, QuimicoResponse } from '../../interfaces/quimico.interfaces';
import { VariedadResponse } from '../../interfaces/variedad.interfaces';
import { NotificacionService } from '../../services/services/notificacion';

@Component({
  selector: 'app-quimico',
  imports: [CommonModule, RouterModule, FormsModule, Sidebar],
  templateUrl: './quimico.html',
  styleUrl: './quimico.scss',
})
export class Quimico implements OnInit {

  quimicos: QuimicoResponse[] = [];
  variedades: VariedadResponse[] = [];
  cargando = true;
  error = false;

  busqueda = '';

  modalVisible = false;
  modoEdicion = false;
  editandoId: number | null = null;
  guardando = false;
  errorModal = '';

  form: QuimicoRequest = this.formVacio();

  constructor(
    private quimicoService: QuimicoService,
    private cdr: ChangeDetectorRef,
    private notificacion: NotificacionService,
  ) {}

  ngOnInit(): void {
    forkJoin({
      quimicos:  this.quimicoService.listar(),
      variedades: this.quimicoService.listarVariedades(),
    }).subscribe({
      next: ({ quimicos, variedades }) => {
        this.quimicos  = quimicos;
        this.variedades = variedades;
        this.cargando  = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.error    = true;
        this.cargando = false;
        this.cdr.markForCheck();
      },
    });
  }

  // ── KPIs ────────────────────────────────────────────────────
  get totalRegistros(): number { return this.quimicos.length; }

  get fumigacionesMes(): number {
    const ahora = new Date();
    return this.quimicos.filter(q => {
      const f = new Date(q.fechaFumigacion);
      return f.getMonth() === ahora.getMonth() && f.getFullYear() === ahora.getFullYear();
    }).length;
  }

  get variedadesTratadas(): number {
    return new Set(this.quimicos.map(q => q.variedadId)).size;
  }

  get ultimaFumigacion(): string {
    if (!this.quimicos.length) return '—';
    const ultima = this.quimicos
      .map(q => q.fechaFumigacion)
      .sort()
      .at(-1)!;
    return this.formatFecha(ultima);
  }

  // ── Filtro ──────────────────────────────────────────────────
  get quimicosFiltrados(): QuimicoResponse[] {
    if (!this.busqueda) return this.quimicos;
    const q = this.busqueda.toLowerCase();
    return this.quimicos.filter(
      r => r.nombre.toLowerCase().includes(q) ||
           (r.variedadNombre ?? '').toLowerCase().includes(q)
    );
  }

  // ── Modal crear ─────────────────────────────────────────────
  abrirModalCrear(): void {
    this.form       = this.formVacio();
    this.modoEdicion = false;
    this.editandoId  = null;
    this.errorModal  = '';
    this.modalVisible = true;
  }

  // ── Modal editar ─────────────────────────────────────────────
  abrirModalEditar(q: QuimicoResponse): void {
    this.form = {
      nombre:          q.nombre,
      fechaFumigacion: q.fechaFumigacion,
      descripcion:     q.descripcion ?? '',
      variedadId:      q.variedadId,
    };
    this.modoEdicion  = true;
    this.editandoId   = q.id;
    this.errorModal   = '';
    this.modalVisible = true;
  }

  cerrarModal(): void {
    this.modalVisible = false;
  }

  // ── Guardar ─────────────────────────────────────────────────
  guardar(): void {
    if (!this.form.nombre || !this.form.fechaFumigacion || !this.form.variedadId) {
      this.errorModal = 'Nombre, fecha y variedad son obligatorios.';
      return;
    }

    this.guardando  = true;
    this.errorModal = '';

    const op$ = this.modoEdicion
      ? this.quimicoService.actualizar(this.editandoId!, this.form)
      : this.quimicoService.guardar(this.form);

    op$.subscribe({
      next: (res) => {
        if (this.modoEdicion) {
          this.quimicos = this.quimicos.map(q => q.id === res.id ? res : q);
        } else {
          this.quimicos = [...this.quimicos, res];
        }
        this.guardando    = false;
        this.modalVisible = false;
        this.notificacion.exito(this.modoEdicion ? 'Químico actualizado correctamente' : 'Químico guardado correctamente');
        this.cdr.markForCheck();
      },
      error: () => {
        this.errorModal = 'Error al guardar. Intenta de nuevo.';
        this.guardando  = false;
        this.notificacion.error('Error al guardar el químico');
        this.cdr.markForCheck();
      },
    });
  }

  // ── Eliminar ────────────────────────────────────────────────
  eliminar(q: QuimicoResponse): void {
    if (!confirm(`¿Eliminar "${q.nombre}"?`)) return;

    this.quimicoService.eliminar(q.id).subscribe({
      next: () => {
        this.quimicos = this.quimicos.filter(r => r.id !== q.id);
        this.notificacion.exito('Químico eliminado correctamente');
        this.cdr.markForCheck();
      },
      error: () => this.notificacion.error('No se pudo eliminar el registro'),
    });
  }

  // ── Helpers ─────────────────────────────────────────────────
  formatFecha(fecha: string | null): string {
    if (!fecha) return '—';
    return new Date(fecha + 'T00:00:00').toLocaleDateString('es-MX', {
      day: 'numeric', month: 'short', year: 'numeric',
    });
  }

  private formVacio(): QuimicoRequest {
    return { nombre: '', fechaFumigacion: '', descripcion: '', variedadId: null };
  }
}
