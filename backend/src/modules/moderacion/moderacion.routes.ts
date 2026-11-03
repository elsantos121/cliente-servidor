import { Router } from 'express';
import { autenticar, autorizar } from '../../middlewares/autenticar';
import * as moderacionController from './moderacion.controller';

export const historialRouter = Router();

historialRouter.use(autenticar, autorizar('ADMIN'));
historialRouter.get('/historial', moderacionController.listar);
