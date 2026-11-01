import type { RequestHandler } from 'express';
import { idDeRuta } from '../../middlewares/validar';
import * as reportesService from './reportes.service';

export const denunciar: RequestHandler = async (req, res) => {
  const publicacionId = idDeRuta(req.params.publicacionId, 'Publicación');
  const reporte = await reportesService.denunciar(publicacionId, req.usuario!.id, req.body);
  res.status(201).json({ reporte });
};
