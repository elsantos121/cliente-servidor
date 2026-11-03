import type { RequestHandler } from 'express';
import { idDeRuta } from '../../middlewares/validar';
import * as votosService from './votos.service';

export const votarPublicacion: RequestHandler = async (req, res) => {
  const votos = await votosService.votarPublicacion(
    idDeRuta(req.params.id, 'Publicación'),
    req.usuario!.id,
    req.body.valor,
  );
  res.json({ votos });
};

export const quitarVotoPublicacion: RequestHandler = async (req, res) => {
  const votos = await votosService.quitarVotoPublicacion(idDeRuta(req.params.id, 'Publicación'), req.usuario!.id);
  res.json({ votos });
};

export const votarComentario: RequestHandler = async (req, res) => {
  const votos = await votosService.votarComentario(
    idDeRuta(req.params.id, 'Comentario'),
    req.usuario!.id,
    req.body.valor,
  );
  res.json({ votos });
};

export const quitarVotoComentario: RequestHandler = async (req, res) => {
  const votos = await votosService.quitarVotoComentario(idDeRuta(req.params.id, 'Comentario'), req.usuario!.id);
  res.json({ votos });
};
