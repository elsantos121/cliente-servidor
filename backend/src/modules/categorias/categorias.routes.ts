import { Router } from 'express';
import { autenticar, autorizar } from '../../middlewares/autenticar';
import { validar } from '../../middlewares/validar';
import * as categoriasController from './categorias.controller';
import { esquemaCategoria } from './categorias.schemas';

export const categoriasRouter = Router();

categoriasRouter.get('/', categoriasController.listar);
categoriasRouter.post(
  '/',
  autenticar,
  autorizar('ADMIN'),
  validar(esquemaCategoria),
  categoriasController.crear,
);
