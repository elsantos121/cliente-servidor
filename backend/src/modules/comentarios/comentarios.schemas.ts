import { z } from 'zod';

export const esquemaComentario = z.object({
  contenido: z
    .string({ error: 'El comentario no puede estar vacío' })
    .trim()
    .min(1, 'El comentario no puede estar vacío')
    .max(2000, 'El comentario no puede superar 2000 caracteres'),
});
