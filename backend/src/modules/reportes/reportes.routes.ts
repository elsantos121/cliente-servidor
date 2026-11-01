import { Router } from 'express';
import { autenticar } from '../../middlewares/autenticar';
import { validar } from '../../middlewares/validar';
import * as reportesController from './reportes.controller';
import { esquemaDenuncia } from './reportes.schemas';

// Se monta en /api/publicaciones/:publicacionId/reportes (HU-05). La moderación (HU-06b) irá en /api/reportes.
export const denunciasRouter = Router({ mergeParams: true });

denunciasRouter.post('/', autenticar, validar(esquemaDenuncia), reportesController.denunciar);
