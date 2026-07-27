import { Injectable, signal } from '@angular/core';

type Tema = 'light' | 'dark';

const STORAGE_KEY = 'tema';

/**
 * Gestiona el tema claro/oscuro de la aplicación.
 *
 * El tema se aplica poniendo el atributo `data-theme` en <html>, y la capa
 * oscura vive en `styles.scss` bajo `html[data-theme="dark"]`. La preferencia
 * se guarda en `localStorage` (clave `tema`) para que persista entre sesiones.
 *
 * Nota: para evitar el "flash" de tema claro al cargar, `index.html` aplica el
 * atributo con un pequeño script inline ANTES de que arranque Angular. Este
 * servicio solo lo re-sincroniza y expone el toggle.
 */
@Injectable({ providedIn: 'root' })
export class ThemeService {
  /** `true` si el tema activo es oscuro. Úsalo para pintar el icono del toggle. */
  readonly esOscuro = signal<boolean>(this.leerInicial() === 'dark');

  constructor() {
    // Re-aplica por si el script inline de index.html no corrió (SSR, etc.).
    this.aplicar(this.esOscuro() ? 'dark' : 'light');
  }

  /** Alterna entre claro y oscuro y persiste la preferencia. */
  alternar(): void {
    const nuevo: Tema = this.esOscuro() ? 'light' : 'dark';
    // Activa transiciones suaves SOLO durante el cambio (estilo Apple): una
    // clase temporal en <html> hace que todo se funda junto, y se retira
    // después para no interferir con los hovers/interacciones normales.
    const root = document.documentElement;
    root.classList.add('theme-anim');
    window.clearTimeout(this.animTimer);
    this.animTimer = window.setTimeout(() => root.classList.remove('theme-anim'), 360);

    this.esOscuro.set(nuevo === 'dark');
    this.aplicar(nuevo);
    try {
      localStorage.setItem(STORAGE_KEY, nuevo);
    } catch {
      /* localStorage no disponible: el tema aplica solo para esta sesión. */
    }
  }

  private animTimer = 0;

  private aplicar(tema: Tema): void {
    document.documentElement.setAttribute('data-theme', tema);
  }

  private leerInicial(): Tema {
    try {
      const guardado = localStorage.getItem(STORAGE_KEY);
      if (guardado === 'dark' || guardado === 'light') return guardado;
    } catch {
      /* ignora: cae al tema claro por defecto */
    }
    return 'light';
  }
}
