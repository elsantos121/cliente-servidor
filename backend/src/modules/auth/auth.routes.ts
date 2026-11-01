import { Router } from 'express';
import { validar } from '../../middlewares/validar';
import * as authController from './auth.controller';
import { esquemaRegistro } from './auth.schemas';

export const authRouter = Router();

authRouter.post('/registro', validar(esquemaRegistro), authController.registro);
