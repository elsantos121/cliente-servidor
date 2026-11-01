import { Router } from 'express';
import { autenticar } from '../../middlewares/autenticar';
import { validar } from '../../middlewares/validar';
import * as publicacionesController from './publicaciones.controller';
import { esquemaPublicacion } from './publicaciones.schemas';

// Los permisos por autor (editar) y autor o ADMIN (eliminar) los decide el servicio.
export const publicacionesRouter = Router();

publicacionesRouter.get('/', publicacionesController.listar);
publicacionesRouter.get('/:id', publicacionesController.detalle);
publicacionesRouter.post('/', autenticar, validar(esquemaPublicacion), publicacionesController.crear);
publicacionesRouter.put('/:id', autenticar, validar(esquemaPublicacion), publicacionesController.editar);
publicacionesRouter.delete('/:id', autenticar, publicacionesController.eliminar);
