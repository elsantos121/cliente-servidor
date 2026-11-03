import { z } from 'zod';

export const esquemaVoto = z.object({
  valor: z.enum(['POSITIVO', 'NEGATIVO'], { error: 'El voto debe ser POSITIVO o NEGATIVO' }),
});
