import { z } from 'zod';

/** Cuerpo de una denuncia. El estado nunca se toma del cliente: siempre empieza PENDIENTE. */
export const esquemaDenuncia = z.object({
  motivo: z
    .string({ error: 'Contá el motivo de la denuncia' })
    .trim()
    .min(5, 'El motivo debe tener entre 5 y 500 caracteres')
    .max(500, 'El motivo debe tener entre 5 y 500 caracteres'),
});

const mensajeEstado = 'El estado debe ser PENDIENTE, RESUELTO o DESCARTADO';

/** HU-06b: GET /api/reportes?estado= (opcional; por defecto PENDIENTE). */
export const esquemaFiltroReportes = z.object({
  estado: z.enum(['PENDIENTE', 'RESUELTO', 'DESCARTADO'], { error: mensajeEstado }).optional(),
});

/** HU-06b: PATCH /api/reportes/:id. Un reporte moderado no vuelve a PENDIENTE. */
export const esquemaCambioEstado = z.object({
  estado: z.enum(['RESUELTO', 'DESCARTADO'], { error: 'El estado debe ser RESUELTO o DESCARTADO' }),
});
