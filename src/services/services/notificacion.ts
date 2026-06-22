import { Injectable, inject } from '@angular/core';
import { MatSnackBar, MatSnackBarConfig } from '@angular/material/snack-bar';

@Injectable({ providedIn: 'root' })
export class NotificacionService {
  private snackBar = inject(MatSnackBar);

  private readonly baseConfig: MatSnackBarConfig = {
    horizontalPosition: 'center',
    verticalPosition: 'bottom',
  };

  exito(mensaje: string): void {
    this.snackBar.open(mensaje, 'Cerrar', {
      ...this.baseConfig,
      duration: 3000,
      panelClass: ['snack-exito'],
    });
  }

  error(mensaje: string): void {
    this.snackBar.open(mensaje, 'Cerrar', {
      ...this.baseConfig,
      duration: 4000,
      panelClass: ['snack-error'],
    });
  }

  info(mensaje: string): void {
    this.snackBar.open(mensaje, 'Cerrar', {
      ...this.baseConfig,
      duration: 3000,
      panelClass: ['snack-info'],
    });
  }
}
