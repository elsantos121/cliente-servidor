import type { RequestHandler } from 'express';
import { idDeRuta, parsear } from '../../middlewares/validar';
import { esquemaFiltroReportes } from './reportes.schemas';
import * as reportesService from './reportes.service';

export const denunciar: RequestHandler = async (req, res) => {
  const publicacionId = idDeRuta(req.params.publicacionId, 'Publicación');
  const reporte = await reportesService.denunciar(publicacionId, req.usuario!.id, req.body);
  res.status(201).json({ reporte });
};

export const listar: RequestHandler = async (req, res) => {
  const reportes = await reportesService.listarReportes(parsear(esquemaFiltroReportes, req.query));
  res.json({ reportes });
};

export const cambiarEstado: RequestHandler = async (req, res) => {
  const reporte = await reportesService.cambiarEstado(idDeRuta(req.params.id, 'Reporte'), req.body);
  res.json({ reporte });
};
