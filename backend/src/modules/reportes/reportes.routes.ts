import { Router } from 'express';
import { autenticar, autorizar } from '../../middlewares/autenticar';
import { validar } from '../../middlewares/validar';
import * as reportesController from './reportes.controller';
import { esquemaCambioEstado, esquemaDenuncia } from './reportes.schemas';

/** HU-05: se monta en /api/publicaciones/:publicacionId/reportes (mergeParams expone :publicacionId). */
export const denunciasRouter = Router({ mergeParams: true });

denunciasRouter.post('/', autenticar, validar(esquemaDenuncia), reportesController.denunciar);

/** HU-06b: moderación en /api/reportes, solo para administradores. */
export const moderacionRouter = Router();

moderacionRouter.use(autenticar, autorizar('ADMIN'));
moderacionRouter.get('/', reportesController.listar);
moderacionRouter.patch('/:id', validar(esquemaCambioEstado), reportesController.cambiarEstado);
