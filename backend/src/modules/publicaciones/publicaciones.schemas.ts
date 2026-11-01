import { z } from 'zod';

const categoriaId = z.coerce
  .number({ error: 'Elegí una categoría' })
  .int('Elegí una categoría')
  .positive('Elegí una categoría');

/** Crear o editar (PUT reemplaza todos los campos). El autor nunca se toma del cuerpo. */
export const esquemaPublicacion = z.object({
  titulo: z
    .string({ error: 'El título es obligatorio' })
    .trim()
    .min(3, 'El título debe tener entre 3 y 150 caracteres')
    .max(150, 'El título debe tener entre 3 y 150 caracteres'),
  contenido: z
    .string({ error: 'El contenido es obligatorio' })
    .trim()
    .min(10, 'El contenido debe tener entre 10 y 5000 caracteres')
    .max(5000, 'El contenido debe tener entre 10 y 5000 caracteres'),
  categoriaId,
});

/** GET /api/publicaciones?categoriaId= (opcional). */
export const esquemaFiltro = z.object({
  categoriaId: categoriaId.optional(),
});
