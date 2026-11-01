import { Router } from 'express';
import { autenticar } from '../../middlewares/autenticar';
import * as usuariosController from './usuarios.controller';

export const usuariosRouter = Router();

usuariosRouter.get('/me', autenticar, usuariosController.me);
