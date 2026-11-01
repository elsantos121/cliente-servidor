import type { RequestHandler } from 'express';
import { idDeRuta } from '../../middlewares/validar';
import * as comentariosService from './comentarios.service';

export const listar: RequestHandler = async (req, res) => {
  const comentarios = await comentariosService.listarComentarios(idDeRuta(req.params.publicacionId, 'Publicación'));
  res.json({ comentarios });
};

export const crear: RequestHandler = async (req, res) => {
  const publicacionId = idDeRuta(req.params.publicacionId, 'Publicación');
  const comentario = await comentariosService.comentar(publicacionId, req.usuario!.id, req.body);
  res.status(201).json({ comentario });
};
