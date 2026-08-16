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
import { Chart, registerables } from 'chart.js';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Sidebar } from '../shared/sidebar/sidebar';
import { ReporteService } from '../../services/services/reporte';
import { NotificacionService } from '../../services/services/notificacion';
import {
  ReporteInventario,
  GrupoInventario,
  BolsaInventario,
  AgregadoVariedad,
} from '../../interfaces/reporte.interfaces';

Chart.register(...registerables);

/** Modelo de vista por grupo/tipo, ya agregado para gráfica y PDF. */
interface VistaGrupo {
  tipo: string;
  total: number;
  agg: AgregadoVariedad[];
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

  cargando = false;
  reporte: ReporteInventario | null = null;

  vista: VistaGrupo[] = [];

  @ViewChildren('grupoCanvas') canvases?: QueryList<ElementRef<HTMLCanvasElement>>;

  private charts: Chart[] = [];

  constructor(
    private reporteService: ReporteService,
    private cdr: ChangeDetectorRef,
    private notificacion: NotificacionService,
  ) {
    // Rango por defecto: del día 1 del mes actual a hoy.
    const hoy = new Date();
    this.hasta = this.iso(hoy);
    this.desde = this.iso(new Date(hoy.getFullYear(), hoy.getMonth(), 1));
  }

  private iso(d: Date): string {
    return d.toISOString().slice(0, 10);
  }

  color(i: number): string {
    return PALETA[i % PALETA.length];
  }

  generar(): void {
    if (!this.desde || !this.hasta) {
      this.notificacion.error('Selecciona el rango de fechas');
      return;
    }
    if (this.desde > this.hasta) {
      this.notificacion.error('La fecha inicial no puede ser mayor a la final');
      return;
    }

    this.cargando = true;
    this.reporteService.inventario(this.desde, this.hasta).subscribe({
      next: (data) => {
        this.reporte = data;
        this.vista = (data.grupos ?? []).map((g) => this.aVista(g));
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

  private aVista(g: GrupoInventario): VistaGrupo {
    return {
      tipo: g.tipo,
      total: g.total,
      items: g.items,
      agg: this.agregar(g.items),
    };
  }

  private agregar(bolsas: BolsaInventario[]): AgregadoVariedad[] {
    const mapa = new Map<string, number>();
    for (const b of bolsas) {
      const nombre = b.variedadNombre ?? 'Sin variedad';
      mapa.set(nombre, (mapa.get(nombre) ?? 0) + (b.cantidad ?? 0));
    }
    return [...mapa.entries()]
      .map(([variedad, cantidad]) => ({ variedad, cantidad }))
      .sort((a, b) => b.cantidad - a.cantidad);
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
    doc.text(`Total general: ${this.reporte.totalGeneral}`, margen, y + 6);
    doc.setTextColor(0);
    y += 16;

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
