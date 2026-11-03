import { Router } from 'express';
import { autenticar } from '../../middlewares/autenticar';
import { validar } from '../../middlewares/validar';
import * as votosController from './votos.controller';
import { esquemaVoto } from './votos.schemas';

export const votosRouter = Router();

votosRouter.put('/publicaciones/:id', autenticar, validar(esquemaVoto), votosController.votarPublicacion);
votosRouter.delete('/publicaciones/:id', autenticar, votosController.quitarVotoPublicacion);
votosRouter.put('/comentarios/:id', autenticar, validar(esquemaVoto), votosController.votarComentario);
votosRouter.delete('/comentarios/:id', autenticar, votosController.quitarVotoComentario);
