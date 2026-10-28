import { z } from 'zod';

/**
 * Lee y valida las variables de entorno una sola vez.
 * Si falta una variable obligatoria, la aplicación falla al arrancar con un mensaje claro
 * en lugar de fallar más tarde de forma confusa.
 */
const esquemaEnv = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  CORS_ORIGIN: z.string().min(1).default('http://localhost:4200'),
});

export type Env = z.infer<typeof esquemaEnv>;

export function leerEnv(fuente: NodeJS.ProcessEnv = process.env): Env {
  const resultado = esquemaEnv.safeParse(fuente);
  if (!resultado.success) {
    const problemas = resultado.error.issues
      .map((i) => `${i.path.join('.')}: ${i.message}`)
      .join('; ');
    throw new Error(`Configuración inválida: ${problemas}`);
  }
  return resultado.data;
}
