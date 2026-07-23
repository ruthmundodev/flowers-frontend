import { Component, inject } from '@angular/core';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';

/** Datos de configuración del diálogo de confirmación. */
export interface ConfirmDialogData {
  titulo: string;
  mensaje: string;
  /** Texto del botón de confirmación. Por defecto "Aceptar". */
  textoConfirmar?: string;
  /** Texto del botón de cancelar. Por defecto "Cancelar". */
  textoCancelar?: string;
  /** Si true, el botón de confirmación usa el estilo destructivo (rojo). */
  peligro?: boolean;
}

/**
 * Diálogo de confirmación genérico basado en Angular Material.
 * Sustituye a `window.confirm()`. Devuelve `true` si el usuario confirma.
 *
 * Uso:
 *   this.dialog.open(ConfirmDialog, { data: { ... } })
 *     .afterClosed().subscribe(ok => { if (ok) { ... } });
 */
@Component({
  selector: 'app-confirm-dialog',
  imports: [MatDialogModule, MatButtonModule],
  template: `
    <div class="confirm">
      <div class="confirm-icon" [class.peligro]="data.peligro">
        <i class="ti" [class.ti-trash]="data.peligro" [class.ti-help-circle]="!data.peligro"></i>
      </div>

      <h2 class="confirm-titulo">{{ data.titulo }}</h2>
      <p class="confirm-mensaje">{{ data.mensaje }}</p>

      <div class="confirm-acciones">
        <button type="button" class="c-btn c-btn-light" (click)="cerrar(false)">
          {{ data.textoCancelar || 'Cancelar' }}
        </button>
        <button
          type="button"
          class="c-btn"
          [class.c-btn-peligro]="data.peligro"
          [class.c-btn-primario]="!data.peligro"
          (click)="cerrar(true)"
        >
          {{ data.textoConfirmar || 'Aceptar' }}
        </button>
      </div>
    </div>
  `,
  styles: [
    `
      .confirm {
        font-family: 'DM Sans', sans-serif;
        padding: 24px 24px 20px;
        text-align: center;
        max-width: 360px;
      }

      .confirm-icon {
        width: 52px;
        height: 52px;
        margin: 0 auto 14px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        background: #eaf1ea;
        color: #1e3320;
        font-size: 26px;

        &.peligro {
          background: #fceaea;
          color: #c0392b;
        }
      }

      .confirm-titulo {
        font-size: 17px;
        font-weight: 600;
        color: #1a2e1c;
        margin: 0 0 6px;
      }

      .confirm-mensaje {
        font-size: 14px;
        line-height: 1.5;
        color: #5b615a;
        margin: 0 0 22px;
      }

      .confirm-acciones {
        display: flex;
        gap: 10px;
        justify-content: center;
      }

      .c-btn {
        flex: 1;
        border: none;
        border-radius: 9px;
        padding: 10px 16px;
        font-size: 13.5px;
        font-weight: 500;
        cursor: pointer;
        font-family: 'DM Sans', sans-serif;
        transition: background 0.15s, filter 0.15s;
      }

      .c-btn-light {
        background: #f5f3ee;
        border: 1px solid #ddd9cf;
        color: #555;

        &:hover { background: #ede8df; }
      }

      .c-btn-primario {
        background: #1e3320;
        color: #b8d8b8;

        &:hover { background: #2a4a2e; }
      }

      .c-btn-peligro {
        background: #c0392b;
        color: #fff;

        &:hover { filter: brightness(1.08); }
      }
    `,
  ],
})
export class ConfirmDialog {
  readonly data = inject<ConfirmDialogData>(MAT_DIALOG_DATA);
  private ref = inject(MatDialogRef<ConfirmDialog>);

  cerrar(resultado: boolean): void {
    this.ref.close(resultado);
  }
}
