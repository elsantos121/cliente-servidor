import type { RequestHandler } from 'express';
import * as authService from './auth.service';

export const registro: RequestHandler = async (req, res) => {
  const usuario = await authService.registrar(req.body);
  res.status(201).json({ usuario });
};

export const login: RequestHandler = async (req, res) => {
  const { token, usuario } = await authService.iniciarSesion(req.body);
  res.json({ token, usuario });
};
