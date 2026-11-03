import type { RequestHandler } from 'express';
import { parsear } from '../../middlewares/validar';
import { esquemaFiltroHistorial } from './moderacion.schemas';
import { listarHistorial } from './moderacion.service';

export const listar: RequestHandler = async (req, res) => {
  const eventos = await listarHistorial(parsear(esquemaFiltroHistorial, req.query));
  res.json({ eventos });
};
