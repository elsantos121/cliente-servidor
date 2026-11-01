import 'dotenv/config';
import { z } from 'zod';
import { prisma } from '../src/db/prisma';
import { asegurarAdmin } from '../src/modules/auth/auth.service';

/**
 * Crea el administrador inicial (npx prisma db seed). Es el único camino para tener un ADMIN:
 * el registro público siempre crea ESTUDIANTE. Ejecutarlo de nuevo actualiza la contraseña.
 */
const esquemaSeed = z.object({
  ADMIN_NOMBRE: z.string().min(2).default('Administrador'),
  ADMIN_EMAIL: z.email(),
  ADMIN_PASSWORD: z.string().min(8).max(72),
});

async function main() {
  const resultado = esquemaSeed.safeParse(process.env);
  if (!resultado.success) {
    const faltan = resultado.error.issues.map((i) => i.path.join('.')).join(', ');
    throw new Error(`Configurar en .env para el seed: ${faltan}`);
  }
  const { ADMIN_NOMBRE, ADMIN_EMAIL, ADMIN_PASSWORD } = resultado.data;
  const admin = await asegurarAdmin({ nombre: ADMIN_NOMBRE, email: ADMIN_EMAIL, password: ADMIN_PASSWORD });
  console.log(`Administrador listo: ${admin.email} (id ${admin.id})`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
