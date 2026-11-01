import { z } from 'zod';

/** Cuerpo de una denuncia. El estado nunca se toma del cliente: siempre empieza PENDIENTE. */
export const esquemaDenuncia = z.object({
  motivo: z
    .string({ error: 'Contá el motivo de la denuncia' })
    .trim()
    .min(5, 'El motivo debe tener entre 5 y 500 caracteres')
    .max(500, 'El motivo debe tener entre 5 y 500 caracteres'),
});
