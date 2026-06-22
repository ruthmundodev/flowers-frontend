import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { Sidebar } from '../shared/sidebar/sidebar';
import { RendimientoService } from '../../services/services/rendimiento';
import { RendimientoRequest, RendimientoResponse } from '../../interfaces/rendimiento.interfaces';
import { VariedadResponse } from '../../interfaces/variedad.interfaces';
import { NotificacionService } from '../../services/services/notificacion';

@Component({
  selector: 'app-rendimientos',
  imports: [CommonModule, RouterModule, FormsModule, Sidebar],
  templateUrl: './rendimientos.html',
  styleUrl: './rendimientos.scss',
})
export class Rendimientos implements OnInit {

  rendimientos: RendimientoResponse[] = [];
  variedades: VariedadResponse[] = [];
  cargando = true;
  error = false;

  modoEdicion = false;
  editandoId: number | null = null;
  guardando = false;
  errorForm = '';

  form: RendimientoRequest = this.formVacio();

  constructor(
    private rendimientoService: RendimientoService,
    private cdr: ChangeDetectorRef,
    private notificacion: NotificacionService,
  ) {}

  ngOnInit(): void {
    forkJoin({
      rendimientos: this.rendimientoService.listar(),
      variedades: this.rendimientoService.listarVariedades(),
    }).subscribe({
      next: ({ rendimientos, variedades }) => {
        this.rendimientos = rendimientos;
        this.variedades = variedades;
        this.cargando = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.error = true;
        this.cargando = false;
        this.notificacion.error('Error al cargar los rendimientos');
        this.cdr.markForCheck();
      },
    });
  }

  // ── KPIs ────────────────────────────────────────────────────
  get totalRegistros(): number { return this.rendimientos.length; }

  get totalKg(): number {
    return this.rendimientos.reduce((acc, r) => acc + Number(r.rendimientoTotal), 0);
  }

  get totalBancos(): number {
    return this.rendimientos.reduce((acc, r) => acc + Number(r.numeroBancos), 0);
  }

  // ── Guardar / actualizar ────────────────────────────────────
  guardar(): void {
    if (this.form.variedadId == null || this.form.numeroBancos == null || this.form.rendimientoTotal == null) {
      this.errorForm = 'Todos los campos son obligatorios.';
      return;
    }

    this.guardando = true;
    this.errorForm = '';
    const editando = this.modoEdicion;

    const op$ = editando
      ? this.rendimientoService.actualizar(this.editandoId!, this.form)
      : this.rendimientoService.guardar(this.form);

    op$.subscribe({
      next: (res) => {
        if (editando) {
          this.rendimientos = this.rendimientos.map(r => r.id === res.id ? res : r);
        } else {
          this.rendimientos = [...this.rendimientos, res];
        }
        this.guardando = false;
        this.limpiar();
        this.notificacion.exito(editando ? 'Rendimiento actualizado correctamente' : 'Rendimiento guardado correctamente');
        this.cdr.markForCheck();
      },
      error: () => {
        this.errorForm = 'Error al guardar. Intenta de nuevo.';
        this.guardando = false;
        this.notificacion.error('Error al guardar el rendimiento');
        this.cdr.markForCheck();
      },
    });
  }

  // ── Editar ──────────────────────────────────────────────────
  editar(r: RendimientoResponse): void {
    this.form = {
      variedadId: r.variedadId,
      numeroBancos: r.numeroBancos,
      rendimientoTotal: r.rendimientoTotal,
    };
    this.modoEdicion = true;
    this.editandoId = r.id;
    this.errorForm = '';
  }

  limpiar(): void {
    this.form = this.formVacio();
    this.modoEdicion = false;
    this.editandoId = null;
    this.errorForm = '';
  }

  // ── Eliminar ────────────────────────────────────────────────
  eliminar(r: RendimientoResponse): void {
    if (!confirm(`¿Eliminar el rendimiento de "${r.nombreVariedad ?? 'esta variedad'}"?`)) return;

    this.rendimientoService.eliminar(r.id).subscribe({
      next: () => {
        this.rendimientos = this.rendimientos.filter(x => x.id !== r.id);
        if (this.editandoId === r.id) this.limpiar();
        this.notificacion.exito('Rendimiento eliminado correctamente');
        this.cdr.markForCheck();
      },
      error: () => this.notificacion.error('No se pudo eliminar el rendimiento'),
    });
  }

  private formVacio(): RendimientoRequest {
    return { variedadId: null, numeroBancos: null, rendimientoTotal: null };
  }
}
