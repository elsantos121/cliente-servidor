import type { RequestHandler } from 'express';
import * as categoriasService from './categorias.service';

export const listar: RequestHandler = async (_req, res) => {
  const categorias = await categoriasService.listarCategorias();
  res.json({ categorias });
};

export const crear: RequestHandler = async (req, res) => {
  const categoria = await categoriasService.crearCategoria(req.body);
  res.status(201).json({ categoria });
};
