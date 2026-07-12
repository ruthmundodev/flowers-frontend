import { Component, ChangeDetectorRef, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Auth } from '../../services/services/auth';

@Component({
  selector: 'app-login',
  imports: [CommonModule, FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login implements OnInit {
  email = '';
  password = '';
  rememberDevice = true;
  showPassword = false;
  loading = false;
  submitted = false;
  errorMessage = '';

  constructor(
    readonly router: Router,
    readonly route: ActivatedRoute,
    readonly authService: Auth,
    readonly cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    if (this.route.snapshot.queryParamMap.has('sesionInvalida')) {
      this.errorMessage = 'Tu sesión no es válida. Por favor inicia sesión de nuevo.';
    }
  }

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  onSubmit(): void {
    this.submitted = true;
    this.errorMessage = '';

    if (!this.email || !this.password) return;

    this.loading = true;

    this.authService.login(this.email, this.password).subscribe({
      next: () => {
        this.loading = false;
        this.router.navigate(['/dashboard']);
      },
      error: (err: { status: number; error?: { message?: string } }) => {
        this.loading = false;
        if (err.status === 403 && err.error?.message === 'CUENTA_DESACTIVADA') {
          this.errorMessage = 'Tu cuenta está desactivada. Contacta al administrador.';
        } else if (err.status === 403) {
          this.errorMessage = 'Correo o contraseña incorrectos';
        } else {
          this.errorMessage = 'Error al iniciar sesión, intenta de nuevo';
        }
        this.cdr.detectChanges();
      }
    });
  }
}