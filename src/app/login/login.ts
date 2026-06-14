import { Component, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Auth } from '../../services/services/auth';

@Component({
  selector: 'app-login',
  imports: [CommonModule, FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login {
  email = '';
  password = '';
  rememberDevice = true;
  showPassword = false;
  loading = false;
  submitted = false;
  errorMessage = '';

  constructor(
    readonly router: Router,
    readonly authService: Auth,
    readonly cdr: ChangeDetectorRef
  ) {}

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
      error: (err: { status: number }) => {
        this.loading = false;
        this.errorMessage = err.status === 403
          ? 'Correo o contraseña incorrectos'
          : 'Error al iniciar sesión, intenta de nuevo';
        this.cdr.detectChanges(); 
      }
    });
  }
}