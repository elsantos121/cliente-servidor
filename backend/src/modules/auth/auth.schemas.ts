import { z } from 'zod';

/**
 * Datos de registro. Los campos desconocidos (por ejemplo "rol") se descartan:
 * el registro público siempre crea un ESTUDIANTE.
 */
export const esquemaRegistro = z.object({
  nombre: z
    .string({ error: 'El nombre es obligatorio' })
    .trim()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(100, 'El nombre no puede superar 100 caracteres'),
  email: z
    .string({ error: 'El correo es obligatorio' })
    .trim()
    .max(254, 'El correo es demasiado largo')
    .pipe(z.email('El correo no es válido')),
  // bcrypt solo usa los primeros 72 bytes de la contraseña
  password: z
    .string({ error: 'La contraseña es obligatoria' })
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .max(72, 'La contraseña no puede superar 72 caracteres'),
});

/** Credenciales de inicio de sesión: solo se exige que estén; el servicio decide si son correctas. */
export const esquemaLogin = z.object({
  email: z.string({ error: 'El correo es obligatorio' }).trim().min(1, 'El correo es obligatorio'),
  password: z.string({ error: 'La contraseña es obligatoria' }).min(1, 'La contraseña es obligatoria'),
});
