import type { RequestHandler } from 'express';
import * as usuariosService from './usuarios.service';

export const me: RequestHandler = async (req, res) => {
  const usuario = await usuariosService.obtenerUsuarioActual(req.usuario!.id);
  res.json({ usuario });
};
