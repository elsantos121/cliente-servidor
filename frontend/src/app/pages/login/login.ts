import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { ErrorApi } from '../../core/modelos';
import { SesionService } from '../../core/sesion.service';

type Campo = 'email' | 'password';

const MENSAJES: Record<Campo, string> = {
  email: 'El correo es obligatorio',
  password: 'La contraseña es obligatoria',
};

/** HU-02: inicio de sesión (/login). Al entrar vuelve a la página pedida (?volver=) o al inicio. */
@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './login.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Login {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly ruta = inject(ActivatedRoute);
  protected readonly sesion = inject(SesionService);

  protected readonly formulario = inject(NonNullableFormBuilder).group({
    email: ['', Validators.required],
    password: ['', Validators.required],
  });

  /** Fase 4: si el interceptor trajo al usuario porque su sesión dejó de valer, se lo explica. */
  protected readonly sesionExpirada = this.ruta.snapshot.queryParamMap.get('motivo') === 'sesion-expirada';
  protected readonly enviando = signal(false);
  protected readonly errorGeneral = signal<string | null>(null);

  protected errorDe(campo: Campo): string | null {
    const control = this.formulario.controls[campo];
    return control.touched && control.invalid ? MENSAJES[campo] : null;
  }

  protected enviar(): void {
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }

    this.enviando.set(true);
    this.errorGeneral.set(null);

    const { email, password } = this.formulario.getRawValue();
    this.auth.iniciarSesion({ email: email.trim(), password }).subscribe({
      next: () => {
        this.enviando.set(false);
        void this.router.navigateByUrl(this.destino());
      },
      error: (respuesta: HttpErrorResponse) => {
        this.enviando.set(false);
        const error = (respuesta.error as { error?: ErrorApi } | null)?.error;
        if (respuesta.status === 0) {
          this.errorGeneral.set('No se pudo conectar con el servidor. Intentá de nuevo en unos minutos.');
        } else {
          this.errorGeneral.set(error?.mensaje ?? 'Ocurrió un error inesperado. Intentá de nuevo.');
        }
      },
    });
  }

  protected cerrarSesion(): void {
    this.auth.cerrarSesion();
  }

  /** Solo se vuelve a rutas internas, para no redirigir a otro sitio. */
  private destino(): string {
    const volver = this.ruta.snapshot.queryParamMap.get('volver');
    return volver?.startsWith('/') && !volver.startsWith('//') ? volver : '/';
  }
}
