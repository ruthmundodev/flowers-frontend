import {
  Component,
  ChangeDetectorRef,
  ElementRef,
  QueryList,
  ViewChildren,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { Chart, registerables } from 'chart.js';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Sidebar } from '../shared/sidebar/sidebar';
import { ConfirmDialog } from '../shared/confirm-dialog/confirm-dialog';
import { ReporteService } from '../../services/services/reporte';
import { VariedadService } from '../../services/services/variedad';
import { InvernaderoService } from '../../services/services/invernadero';
import { NotificacionService } from '../../services/services/notificacion';
import { InvernaderoResponse } from '../../interfaces/invernadero.interfaces';
import {
  ReporteInventario,
  ReporteGuardado,
  GrupoInventario,
  BolsaInventario,
  AgregadoVariedad,
} from '../../interfaces/reporte.interfaces';

Chart.register(...registerables);

interface DesgloseInvernadero {
  invernadero: string;
  cantidad: number;
}

/** Modelo de vista por grupo/tipo, ya agregado para gráfica y PDF. */
interface VistaGrupo {
  tipo: string;
  total: number;
  agg: AgregadoVariedad[];
  porInvernadero: DesgloseInvernadero[];
  items: BolsaInventario[];
}

// Paleta que se cicla por tipo. Escalable: cualquier tipo nuevo toma un color.
const PALETA = ['#2f7d32', '#c9891f', '#1f6fb2', '#a23bb0', '#b32020', '#2fa39a'];

@Component({
  selector: 'app-exportar',
  imports: [CommonModule, RouterModule, FormsModule, Sidebar],
  templateUrl: './exportar.html',
  styleUrl: './exportar.scss',
})
export class Exportar {

  desde = '';
  hasta = '';

  tipoSel: string | null = null;
  invernaderoSel: number | null = null;
  descripcion = '';

  tipos: string[] = [];
  invernaderos: InvernaderoResponse[] = [];

  cargando = false;
  guardando = false;
  reporte: ReporteInventario | null = null;

  vista: VistaGrupo[] = [];

  guardados: ReporteGuardado[] = [];
  cargandoGuardados = false;

  @ViewChildren('grupoCanvas') canvases?: QueryList<ElementRef<HTMLCanvasElement>>;

  private charts: Chart[] = [];

  constructor(
    private reporteService: ReporteService,
    private variedadService: VariedadService,
    private invernaderoService: InvernaderoService,
    private cdr: ChangeDetectorRef,
    private notificacion: NotificacionService,
    private dialog: MatDialog,
  ) {
    // Rango por defecto: del día 1 del mes actual a hoy.
    const hoy = new Date();
    this.hasta = this.iso(hoy);
    this.desde = this.iso(new Date(hoy.getFullYear(), hoy.getMonth(), 1));

    this.variedadService.tipos().subscribe({
      next: (t) => { this.tipos = t ?? []; this.cdr.markForCheck(); },
      error: () => {},
    });
    this.invernaderoService.listar().subscribe({
      next: (data) => { this.invernaderos = data; this.cdr.markForCheck(); },
      error: () => {},
    });
    this.cargarGuardados();
  }

  private iso(d: Date): string {
    return d.toISOString().slice(0, 10);
  }

  color(i: number): string {
    return PALETA[i % PALETA.length];
  }

  private validarRango(): boolean {
    if (!this.desde || !this.hasta) {
      this.notificacion.error('Selecciona el rango de fechas');
      return false;
    }
    if (this.desde > this.hasta) {
      this.notificacion.error('La fecha inicial no puede ser mayor a la final');
      return false;
    }
    return true;
  }

  generar(): void {
    if (!this.validarRango()) return;

    this.cargando = true;
    this.reporteService
      .inventario(this.desde, this.hasta, this.tipoSel, this.invernaderoSel)
      .subscribe({
        next: (data) => {
          this.aplicarReporte(data);
          this.cargando = false;
          this.cdr.markForCheck();
          setTimeout(() => this.renderCharts());
        },
        error: () => {
          this.cargando = false;
          this.notificacion.error('Error al generar el reporte');
          this.cdr.markForCheck();
        },
      });
  }

  private aplicarReporte(data: ReporteInventario): void {
    this.reporte = data;
    this.vista = (data.grupos ?? []).map((g) => this.aVista(g));
  }

  private aVista(g: GrupoInventario): VistaGrupo {
    const porVariedad = this.sumarPor(g.items, (b) => b.variedadNombre ?? 'Sin variedad');
    const porInv = this.sumarPor(g.items, (b) => b.invernaderoNombre ?? 'Sin invernadero');
    return {
      tipo: g.tipo,
      total: g.total,
      items: g.items,
      agg: porVariedad.map(([variedad, cantidad]) => ({ variedad, cantidad })),
      porInvernadero: porInv.map(([invernadero, cantidad]) => ({ invernadero, cantidad })),
    };
  }

  private sumarPor(
    bolsas: BolsaInventario[],
    clave: (b: BolsaInventario) => string,
  ): [string, number][] {
    const mapa = new Map<string, number>();
    for (const b of bolsas) {
      const k = clave(b);
      mapa.set(k, (mapa.get(k) ?? 0) + (b.cantidad ?? 0));
    }
    return [...mapa.entries()].sort((a, b) => b[1] - a[1]);
  }

  guardar(): void {
    if (!this.validarRango()) return;
    this.guardando = true;
    this.reporteService.guardar({
      desde: this.desde,
      hasta: this.hasta,
      tipo: this.tipoSel,
      invernaderoId: this.invernaderoSel,
      descripcion: this.descripcion?.trim() || null,
    }).subscribe({
      next: () => {
        this.guardando = false;
        this.notificacion.exito('Reporte guardado en el histórico');
        this.cargarGuardados();
        this.cdr.markForCheck();
      },
      error: () => {
        this.guardando = false;
        this.notificacion.error('No se pudo guardar el reporte');
        this.cdr.markForCheck();
      },
    });
  }

  cargarGuardados(): void {
    this.cargandoGuardados = true;
    this.reporteService.listarGuardados().subscribe({
      next: (data) => {
        this.guardados = data ?? [];
        this.cargandoGuardados = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.cargandoGuardados = false;
        this.cdr.markForCheck();
      },
    });
  }

  abrirGuardado(g: ReporteGuardado): void {
    this.reporteService.obtenerGuardado(g.id).subscribe({
      next: (det) => {
        if (!det.reporte) {
          this.notificacion.error('El reporte guardado no tiene contenido');
          return;
        }
        this.desde = det.desde;
        this.hasta = det.hasta;
        this.tipoSel = det.tipo ?? null;
        this.invernaderoSel = det.invernaderoId ?? null;
        this.aplicarReporte(det.reporte);
        this.cdr.markForCheck();
        setTimeout(() => this.renderCharts());
      },
      error: () => this.notificacion.error('No se pudo abrir el reporte'),
    });
  }

  eliminarGuardado(g: ReporteGuardado): void {
    this.dialog.open(ConfirmDialog, {
      width: '380px',
      autoFocus: false,
      data: {
        titulo: 'Eliminar reporte',
        mensaje: `¿Eliminar el reporte del ${g.desde} al ${g.hasta}?`,
        textoConfirmar: 'Eliminar',
        textoCancelar: 'Cancelar',
        peligro: true,
      },
    }).afterClosed().subscribe((confirmado) => {
      if (!confirmado) return;
      this.reporteService.eliminarGuardado(g.id).subscribe({
        next: () => {
          this.guardados = this.guardados.filter(x => x.id !== g.id);
          this.notificacion.exito('Reporte eliminado');
          this.cdr.markForCheck();
        },
        error: () => this.notificacion.error('No se pudo eliminar el reporte'),
      });
    });
  }

  private renderCharts(): void {
    this.charts.forEach((c) => c.destroy());
    this.charts = [];

    const canvases = this.canvases?.toArray() ?? [];
    // 1:1 con this.vista: cada grupo renderiza su canvas.
    canvases.forEach((ref, i) => {
      const v = this.vista[i];
      if (!v) return;
      this.charts.push(
        this.barChart(ref.nativeElement, v.agg, `${v.tipo} (cantidad)`, this.color(i)),
      );
    });
  }

  private barChart(
    canvas: HTMLCanvasElement,
    data: AgregadoVariedad[],
    label: string,
    color: string,
  ): Chart {
    return new Chart(canvas, {
      type: 'bar',
      data: {
        labels: data.map((d) => d.variedad),
        datasets: [{ label, data: data.map((d) => d.cantidad), backgroundColor: color }],
      },
      options: {
        responsive: true,
        animation: false,
        plugins: { legend: { display: true } },
        scales: { y: { beginAtZero: true } },
      },
    });
  }

  exportarPdf(): void {
    if (!this.reporte) {
      return;
    }
    const doc = new jsPDF();
    const margen = 14;
    let y = 18;

    doc.setFontSize(16);
    doc.text('Reporte de Inventario', margen, y);
    y += 8;
    doc.setFontSize(10);
    doc.setTextColor(90);
    doc.text(`Rango: ${this.desde}  a  ${this.hasta}`, margen, y);
    const filtroInv = this.invernaderoSel != null
      ? this.nombreInvernadero(this.invernaderoSel) : 'Todos';
    doc.text(`Invernadero: ${filtroInv}    Tipo: ${this.tipoSel ?? 'Todos'}`, margen, y + 6);
    doc.text(`Total general: ${this.reporte.totalGeneral}`, margen, y + 12);
    doc.setTextColor(0);
    y += 22;

    if (!this.vista.length) {
      doc.setFontSize(11);
      doc.text('Sin registros en el rango seleccionado.', margen, y);
      doc.save(`reporte-inventario_${this.desde}_${this.hasta}.pdf`);
      return;
    }

    this.vista.forEach((v, i) => {
      if (i > 0) {
        doc.addPage();
        y = 18;
      }
      this.seccionPdf(doc, y, v, this.charts[i]);
    });

    doc.save(`reporte-inventario_${this.desde}_${this.hasta}.pdf`);
  }

  nombreInvernadero(id: number): string {
    const inv = this.invernaderos.find(x => x.id === id);
    return inv ? `#${inv.numero} — ${inv.nombreCultivo}` : `#${id}`;
  }

  private seccionPdf(
    doc: jsPDF,
    y: number,
    v: VistaGrupo,
    chart: Chart | undefined,
  ): number {
    const margen = 14;
    doc.setFontSize(13);
    doc.text(`Inventario: ${v.tipo}   (total ${v.total})`, margen, y);
    y += 6;

    if (chart) {
      const img = chart.toBase64Image('image/png', 1);
      doc.addImage(img, 'PNG', margen, y, 180, 75);
      y += 82;
    }

    if (v.porInvernadero.length) {
      autoTable(doc, {
        startY: y,
        head: [['Invernadero', 'Cantidad']],
        body: v.porInvernadero.map((d) => [d.invernadero, String(d.cantidad)]),
        styles: { fontSize: 8 },
        headStyles: { fillColor: [47, 125, 50] },
      });
      y = (doc as any).lastAutoTable.finalY + 6;
    }

    if (v.items.length) {
      autoTable(doc, {
        startY: y,
        head: [['Variedad', 'Invernadero', 'Calidad', 'Cantidad', 'Fecha recepción']],
        body: v.items.map((b) => [
          b.variedadNombre ?? '—',
          b.invernaderoNombre ?? '—',
          b.calidad ?? '—',
          String(b.cantidad ?? 0),
          b.fechaRecepcion ?? '—',
        ]),
        styles: { fontSize: 8 },
        headStyles: { fillColor: [26, 46, 28] },
      });
      y = (doc as any).lastAutoTable.finalY + 6;
    }
    return y;
  }
}
