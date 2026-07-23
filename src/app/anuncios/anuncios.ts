import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { Sidebar } from '../shared/sidebar/sidebar';
import { ConfirmDialog } from '../shared/confirm-dialog/confirm-dialog';
import { AnuncioService } from '../../services/services/anuncio';
import { NotificacionService } from '../../services/services/notificacion';
import { Auth } from '../../services/services/auth';
import { AnuncioRequest, AnuncioResponse } from '../../interfaces/anuncio.interfaces';
import { RolService } from '../../services/services/rol';
import { RolResponse } from '../../interfaces/rol.interfaces';

@Component({
  selector: 'app-anuncios',
  imports: [CommonModule, RouterModule, FormsModule, Sidebar],
  templateUrl: './anuncios.html',
  styleUrl: './anuncios.scss',
})
export class Anuncios implements OnInit {

  private readonly MODULO = 'Anuncios';

  anuncios: AnuncioResponse[] = [];
  cargando = true;

  // Permisos derivados del rol (Administrador siempre puede)
  puedeCrear = false;
  puedeEliminar = false;

  // Modal "Nuevo anuncio"
  mostrarModal = false;
  guardando = false;
  errorForm = '';
  form: AnuncioRequest = this.formVacio();

  // Para el modal: roles destinatarios y prioridades disponibles.
  roles: RolResponse[] = [];
  readonly prioridades = ['INFO', 'NORMAL', 'IMPORTANTE', 'URGENTE'];

  private dialog = inject(MatDialog);

  constructor(
    private anuncioService: AnuncioService,
    private rolService: RolService,
    private notificacion: NotificacionService,
    private auth: Auth,
    private cdr: ChangeDetectorRef,
  ) {}

  private formVacio(): AnuncioRequest {
    return { titulo: '', texto: '', prioridad: 'NORMAL', rolId: null, imagen: null };
  }

  ngOnInit(): void {
    const admin = this.auth.esAdministrador();
    const permiso = this.auth.getPermiso(this.MODULO);
    this.puedeCrear = admin || !!permiso?.crear;
    this.puedeEliminar = admin || !!permiso?.eliminar;

    // Roles para el selector "Dirigido a" (solo si puede crear).
    if (this.puedeCrear) {
      this.rolService.listar().subscribe({
        next: (r) => { this.roles = r; this.cdr.markForCheck(); },
        error: () => { /* sin roles el selector queda solo con "Todos" */ },
      });
    }

    this.cargar();
  }

  cargar(): void {
    this.cargando = true;
    this.anuncioService.listar().subscribe({
      next: (data) => {
        this.anuncios = data;
        this.cargando = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.cargando = false;
        this.notificacion.error('Error al cargar los anuncios');
        this.cdr.markForCheck();
      },
    });
  }

  // ── Modal ───────────────────────────────────────────────────
  abrirModal(): void {
    this.form = this.formVacio();
    this.errorForm = '';
    this.mostrarModal = true;
  }

  cerrarModal(): void {
    this.mostrarModal = false;
    this.errorForm = '';
  }

  onImagenSeleccionada(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) {
      this.form.imagen = null;
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      // reader.result = "data:image/png;base64,XXXX" → guardamos solo la parte Base64
      const result = String(reader.result);
      this.form.imagen = result.includes(',') ? result.split(',')[1] : result;
      this.cdr.markForCheck();
    };
    reader.readAsDataURL(file);
  }

  guardarAnuncio(): void {
    if (!this.form.texto?.trim()) {
      this.errorForm = 'El texto del anuncio es obligatorio.';
      return;
    }

    this.guardando = true;
    this.errorForm = '';

    this.anuncioService.guardar(this.form).subscribe({
      next: (res) => {
        this.anuncios = [res, ...this.anuncios];
        this.guardando = false;
        this.cerrarModal();
        this.notificacion.exito('Anuncio publicado correctamente');
        this.cdr.markForCheck();
      },
      error: () => {
        this.errorForm = 'Error al publicar. Intenta de nuevo.';
        this.guardando = false;
        this.notificacion.error('Error al publicar el anuncio');
        this.cdr.markForCheck();
      },
    });
  }

  eliminar(a: AnuncioResponse): void {
    this.dialog
      .open(ConfirmDialog, {
        width: '380px',
        autoFocus: false,
        data: {
          titulo: 'Eliminar anuncio',
          mensaje: a.titulo
            ? `¿Seguro que deseas eliminar el anuncio “${a.titulo}”? Esta acción no se puede deshacer.`
            : '¿Seguro que deseas eliminar este anuncio? Esta acción no se puede deshacer.',
          textoConfirmar: 'Eliminar',
          textoCancelar: 'Cancelar',
          peligro: true,
        },
      })
      .afterClosed()
      .subscribe((confirmado) => {
        if (!confirmado) return;

        this.anuncioService.eliminar(a.id).subscribe({
          next: () => {
            this.anuncios = this.anuncios.filter(x => x.id !== a.id);
            this.notificacion.exito('Anuncio eliminado correctamente');
            this.cdr.markForCheck();
          },
          error: () => this.notificacion.error('No se pudo eliminar el anuncio'),
        });
      });
  }

  imgSrc(imagen: string | null): string {
    return imagen ? `data:image/*;base64,${imagen}` : '';
  }
}
