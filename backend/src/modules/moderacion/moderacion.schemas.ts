import { z } from 'zod';

const accionesModeracion = [
  'REPORTE_RESUELTO',
  'REPORTE_DESCARTADO',
  'PUBLICACION_OCULTADA',
  'PUBLICACION_RESTAURADA',
  'PUBLICACION_ELIMINADA',
] as const;

export const esquemaFiltroHistorial = z.object({
  publicacionId: z.coerce.number().int().positive('La publicación debe ser un entero positivo').optional(),
  accion: z.enum(accionesModeracion, { error: 'La acción no es válida' }).optional(),
});
