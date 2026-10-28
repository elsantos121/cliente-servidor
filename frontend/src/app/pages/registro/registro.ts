import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../core/auth.service';
import { ErrorApi, Usuario } from '../../core/modelos';

type Campo = 'nombre' | 'email' | 'password';

/** Mensajes de las validaciones del formulario; el backend valida las mismas reglas. */
const MENSAJES: Record<Campo, Record<string, string>> = {
  nombre: {
    required: 'El nombre es obligatorio',
    minlength: 'El nombre debe tener al menos 2 caracteres',
    maxlength: 'El nombre no puede superar 100 caracteres',
  },
  email: {
    required: 'El correo es obligatorio',
    email: 'El correo no es válido',
    maxlength: 'El correo es demasiado largo',
  },
  password: {
    required: 'La contraseña es obligatoria',
    minlength: 'La contraseña debe tener al menos 8 caracteres',
    maxlength: 'La contraseña no puede superar 72 caracteres',
  },
};

/** HU-01: página de registro de estudiantes (/registro). */
@Component({
  selector: 'app-registro',
  imports: [ReactiveFormsModule],
  templateUrl: './registro.html',
  styleUrl: './registro.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Registro {
  private readonly auth = inject(AuthService);

  protected readonly formulario = inject(NonNullableFormBuilder).group({
    nombre: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
    email: ['', [Validators.required, Validators.email, Validators.maxLength(254)]],
    password: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(72)]],
  });

  protected readonly enviando = signal(false);
  protected readonly errorGeneral = signal<string | null>(null);
  protected readonly erroresServidor = signal<Partial<Record<Campo, string>>>({});
  protected readonly registrado = signal<Usuario | null>(null);

  /** Error a mostrar bajo un campo: primero el del servidor, luego el de la validación local. */
  protected errorDe(campo: Campo): string | null {
    const delServidor = this.erroresServidor()[campo];
    if (delServidor) return delServidor;

    const control = this.formulario.controls[campo];
    if (!control.touched || !control.errors) return null;
    const clave = Object.keys(control.errors)[0];
    return MENSAJES[campo][clave] ?? 'Valor inválido';
  }

  /** Al editar un campo se borra el error que el servidor había informado para él. */
  protected limpiarErrorServidor(campo: Campo): void {
    this.erroresServidor.update((errores) => ({ ...errores, [campo]: undefined }));
  }

  protected enviar(): void {
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }

    this.enviando.set(true);
    this.errorGeneral.set(null);
    this.erroresServidor.set({});

    const { nombre, email, password } = this.formulario.getRawValue();
    this.auth.registrar({ nombre: nombre.trim(), email: email.trim(), password }).subscribe({
      next: ({ usuario }) => {
        this.enviando.set(false);
        this.registrado.set(usuario);
      },
      error: (respuesta: HttpErrorResponse) => {
        this.enviando.set(false);
        const error = (respuesta.error as { error?: ErrorApi } | null)?.error;
        if (respuesta.status === 409) {
          this.erroresServidor.set({ email: error?.mensaje ?? 'El correo ya está registrado' });
        } else if (respuesta.status === 400 && error?.detalles) {
          this.erroresServidor.set(error.detalles);
        } else if (respuesta.status === 0) {
          this.errorGeneral.set('No se pudo conectar con el servidor. Intentá de nuevo en unos minutos.');
        } else {
          this.errorGeneral.set(error?.mensaje ?? 'Ocurrió un error inesperado. Intentá de nuevo.');
        }
      },
    });
  }
}
