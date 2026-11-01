import type { RequestHandler } from 'express';
import { idDeRuta, parsear } from '../../middlewares/validar';
import { esquemaFiltro } from './publicaciones.schemas';
import * as publicacionesService from './publicaciones.service';

const RECURSO = 'Publicación';

export const listar: RequestHandler = async (req, res) => {
  const filtro = parsear(esquemaFiltro, req.query);
  const publicaciones = await publicacionesService.listarPublicaciones(filtro);
  res.json({ publicaciones });
};

export const detalle: RequestHandler = async (req, res) => {
  const publicacion = await publicacionesService.obtenerPublicacion(idDeRuta(req.params.id, RECURSO));
  res.json({ publicacion });
};

export const crear: RequestHandler = async (req, res) => {
  const publicacion = await publicacionesService.crearPublicacion(req.usuario!.id, req.body);
  res.status(201).json({ publicacion });
};

export const editar: RequestHandler = async (req, res) => {
  const id = idDeRuta(req.params.id, RECURSO);
  const publicacion = await publicacionesService.editarPublicacion(id, req.usuario!, req.body);
  res.json({ publicacion });
};

export const eliminar: RequestHandler = async (req, res) => {
  await publicacionesService.eliminarPublicacion(idDeRuta(req.params.id, RECURSO), req.usuario!);
  res.status(204).end();
};
