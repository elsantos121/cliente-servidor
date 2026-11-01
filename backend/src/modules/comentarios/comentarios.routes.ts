import { Router } from 'express';
import { autenticar } from '../../middlewares/autenticar';
import { validar } from '../../middlewares/validar';
import * as comentariosController from './comentarios.controller';
import { esquemaComentario } from './comentarios.schemas';

// Se monta en /api/publicaciones/:publicacionId/comentarios: mergeParams expone :publicacionId.
export const comentariosRouter = Router({ mergeParams: true });

comentariosRouter.get('/', comentariosController.listar);
comentariosRouter.post('/', autenticar, validar(esquemaComentario), comentariosController.crear);
