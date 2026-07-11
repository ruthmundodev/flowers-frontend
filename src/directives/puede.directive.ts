import { Directive, Input, TemplateRef, ViewContainerRef, inject } from '@angular/core';
import { Auth } from '../services/services/auth';

type Accion = 'crear' | 'consultar' | 'editar' | 'eliminar';

/**
 * Directiva estructural que muestra el elemento solo si el usuario tiene
 * el permiso indicado. Uso:
 *
 *   <button *appPuede="'Temporada:crear'">Guardar</button>
 *   <button *appPuede="'Quimico:eliminar'">Eliminar</button>
 *
 * El Administrador siempre pasa (bypass en Auth.puede).
 */
@Directive({
  selector: '[appPuede]',
  standalone: true,
})
export class PuedeDirective {
  private auth = inject(Auth);
  private tpl = inject(TemplateRef<unknown>);
  private vcr = inject(ViewContainerRef);
  private mostrado = false;

  @Input() set appPuede(valor: string) {
    const [modulo, accion] = (valor ?? '').split(':') as [string, Accion];
    const permitido = !!modulo && !!accion && this.auth.puede(modulo, accion);

    if (permitido && !this.mostrado) {
      this.vcr.createEmbeddedView(this.tpl);
      this.mostrado = true;
    } else if (!permitido && this.mostrado) {
      this.vcr.clear();
      this.mostrado = false;
    }
  }
}
