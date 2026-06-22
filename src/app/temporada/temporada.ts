import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Sidebar } from '../shared/sidebar/sidebar';
import { TemporadaService } from '../../services/services/temporada';
import { TemporadaRequest, TemporadaResponse } from '../../interfaces/temporada.interfaces';

@Component({
  selector: 'app-temporada',
  imports: [CommonModule, RouterModule, FormsModule, Sidebar],
  templateUrl: './temporada.html',
  styleUrl: './temporada.scss',
})
export class Temporada implements OnInit {

  readonly meses = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
  ];

  temporadas: TemporadaResponse[] = [];
  cargando = true;
  error = false;

  busqueda = '';

  modoEdicion = false;
  editandoId: number | null = null;
  guardando = false;
  errorForm = '';

  form: TemporadaRequest = this.formVacio();

  constructor(
    private temporadaService: TemporadaService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.cargando = true;
    this.temporadaService.listar().subscribe({
      next: (data) => {
        this.temporadas = data;
        this.cargando = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.error = true;
        this.cargando = false;
        this.cdr.markForCheck();
      },
    });
  }

  // ── Filtro ──────────────────────────────────────────────────
  get temporadasFiltradas(): TemporadaResponse[] {
    if (!this.busqueda) return this.temporadas;
    const q = this.busqueda.toLowerCase();
    return this.temporadas.filter(
      t => String(t.year).includes(q) ||
           this.nombreMes(t.mes).toLowerCase().includes(q) ||
           (t.descripcion ?? '').toLowerCase().includes(q)
    );
  }

  // ── Seleccionar fila → editar ───────────────────────────────
  seleccionar(t: TemporadaResponse): void {
    this.form = {
      year: t.year,
      mes: t.mes,
      descripcion: t.descripcion ?? '',
    };
    this.modoEdicion = true;
    this.editandoId = t.id;
    this.errorForm = '';
  }

  cancelar(): void {
    this.form = this.formVacio();
    this.modoEdicion = false;
    this.editandoId = null;
    this.errorForm = '';
  }

  // ── Guardar / actualizar ────────────────────────────────────
  guardar(): void {
    if (this.form.year == null || this.form.mes == null) {
      this.errorForm = 'Año y mes son obligatorios.';
      return;
    }

    this.guardando = true;
    this.errorForm = '';

    const op$ = this.modoEdicion
      ? this.temporadaService.actualizar(this.editandoId!, this.form)
      : this.temporadaService.guardar(this.form);

    op$.subscribe({
      next: (res) => {
        if (this.modoEdicion) {
          this.temporadas = this.temporadas.map(t => t.id === res.id ? res : t);
        } else {
          this.temporadas = [...this.temporadas, res];
        }
        this.guardando = false;
        this.cancelar();
        this.cdr.markForCheck();
      },
      error: () => {
        this.errorForm = 'Error al guardar. Intenta de nuevo.';
        this.guardando = false;
        this.cdr.markForCheck();
      },
    });
  }

  // ── Eliminar ────────────────────────────────────────────────
  eliminar(t: TemporadaResponse, event: MouseEvent): void {
    event.stopPropagation();
    if (!confirm(`¿Eliminar la temporada ${this.nombreMes(t.mes)} ${t.year}?`)) return;

    this.temporadaService.eliminar(t.id).subscribe({
      next: () => {
        this.temporadas = this.temporadas.filter(r => r.id !== t.id);
        if (this.editandoId === t.id) this.cancelar();
        this.cdr.markForCheck();
      },
      error: () => alert('No se pudo eliminar la temporada.'),
    });
  }

  // ── Helpers ─────────────────────────────────────────────────
  nombreMes(mes: number): string {
    return this.meses[mes - 1] ?? '—';
  }

  private formVacio(): TemporadaRequest {
    return { year: null, mes: null, descripcion: '' };
  }
}
