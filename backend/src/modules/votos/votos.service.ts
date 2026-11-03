import type { ValorVoto } from '@prisma/client';
import { prisma } from '../../db/prisma';
import { AppError } from '../../errors/AppError';

export interface ResumenVotos {
  positivos: number;
  negativos: number;
  miVoto: ValorVoto | null;
}

type ElementoConId = { id: number };
type ConteoVoto = { recursoId: number; valor: ValorVoto; cantidad: number };
type VotoPropio = { recursoId: number; valor: ValorVoto };

export async function agregarVotosPublicaciones<T extends ElementoConId>(
  publicaciones: T[],
  usuarioId?: number,
): Promise<Array<T & { votos: ResumenVotos }>> {
  const resumenes = await resumenesPublicaciones(
    publicaciones.map(({ id }) => id),
    usuarioId,
  );
  return publicaciones.map((publicacion) => ({
    ...publicacion,
    votos: resumenes.get(publicacion.id) ?? { positivos: 0, negativos: 0, miVoto: null },
  }));
}

export async function agregarVotosComentarios<T extends ElementoConId>(
  comentarios: T[],
  usuarioId?: number,
): Promise<Array<T & { votos: ResumenVotos }>> {
  const resumenes = await resumenesComentarios(
    comentarios.map(({ id }) => id),
    usuarioId,
  );
  return comentarios.map((comentario) => ({
    ...comentario,
    votos: resumenes.get(comentario.id) ?? { positivos: 0, negativos: 0, miVoto: null },
  }));
}

export async function votarPublicacion(publicacionId: number, usuarioId: number, valor: ValorVoto) {
  const publicacion = await prisma.publicacion.findUnique({ where: { id: publicacionId }, select: { autorId: true } });
  verificarPuedeVotar(publicacion, usuarioId, 'Publicación');

  await prisma.votoPublicacion.upsert({
    where: { usuarioId_publicacionId: { usuarioId, publicacionId } },
    create: { usuarioId, publicacionId, valor },
    update: { valor },
  });

  return (await resumenesPublicaciones([publicacionId], usuarioId)).get(publicacionId)!;
}

export async function quitarVotoPublicacion(publicacionId: number, usuarioId: number) {
  const publicacion = await prisma.publicacion.findUnique({ where: { id: publicacionId }, select: { autorId: true } });
  verificarPuedeVotar(publicacion, usuarioId, 'Publicación');

  await prisma.votoPublicacion.deleteMany({ where: { usuarioId, publicacionId } });

  return (await resumenesPublicaciones([publicacionId], usuarioId)).get(publicacionId)!;
}

export async function votarComentario(comentarioId: number, usuarioId: number, valor: ValorVoto) {
  const comentario = await prisma.comentario.findUnique({ where: { id: comentarioId }, select: { autorId: true } });
  verificarPuedeVotar(comentario, usuarioId, 'Comentario');

  await prisma.votoComentario.upsert({
    where: { usuarioId_comentarioId: { usuarioId, comentarioId } },
    create: { usuarioId, comentarioId, valor },
    update: { valor },
  });

  return (await resumenesComentarios([comentarioId], usuarioId)).get(comentarioId)!;
}

export async function quitarVotoComentario(comentarioId: number, usuarioId: number) {
  const comentario = await prisma.comentario.findUnique({ where: { id: comentarioId }, select: { autorId: true } });
  verificarPuedeVotar(comentario, usuarioId, 'Comentario');

  await prisma.votoComentario.deleteMany({ where: { usuarioId, comentarioId } });

  return (await resumenesComentarios([comentarioId], usuarioId)).get(comentarioId)!;
}

function verificarPuedeVotar(recurso: { autorId: number } | null, usuarioId: number, nombre: string): void {
  if (!recurso) {
    throw AppError.noEncontrado(nombre);
  }
  if (recurso.autorId === usuarioId) {
    throw AppError.prohibido('No podés votar tu propio contenido');
  }
}

async function resumenesPublicaciones(publicacionIds: number[], usuarioId?: number) {
  if (publicacionIds.length === 0) return new Map<number, ResumenVotos>();

  const [conteos, propios] = await Promise.all([
    prisma.votoPublicacion.groupBy({
      by: ['publicacionId', 'valor'],
      where: { publicacionId: { in: publicacionIds } },
      _count: { _all: true },
    }),
    usuarioId
      ? prisma.votoPublicacion.findMany({
          where: { publicacionId: { in: publicacionIds }, usuarioId },
          select: { publicacionId: true, valor: true },
        })
      : Promise.resolve([]),
  ]);

  return construirResumenes(
    publicacionIds,
    conteos.map(({ publicacionId, valor, _count }) => ({
      recursoId: publicacionId,
      valor,
      cantidad: _count._all,
    })),
    propios.map(({ publicacionId, valor }) => ({ recursoId: publicacionId, valor })),
  );
}

async function resumenesComentarios(comentarioIds: number[], usuarioId?: number) {
  if (comentarioIds.length === 0) return new Map<number, ResumenVotos>();

  const [conteos, propios] = await Promise.all([
    prisma.votoComentario.groupBy({
      by: ['comentarioId', 'valor'],
      where: { comentarioId: { in: comentarioIds } },
      _count: { _all: true },
    }),
    usuarioId
      ? prisma.votoComentario.findMany({
          where: { comentarioId: { in: comentarioIds }, usuarioId },
          select: { comentarioId: true, valor: true },
        })
      : Promise.resolve([]),
  ]);

  return construirResumenes(
    comentarioIds,
    conteos.map(({ comentarioId, valor, _count }) => ({
      recursoId: comentarioId,
      valor,
      cantidad: _count._all,
    })),
    propios.map(({ comentarioId, valor }) => ({ recursoId: comentarioId, valor })),
  );
}

function construirResumenes(ids: number[], conteos: ConteoVoto[], propios: VotoPropio[]) {
  const resumenes = new Map<number, ResumenVotos>(
    ids.map((id) => [id, { positivos: 0, negativos: 0, miVoto: null }]),
  );
  for (const { recursoId, valor, cantidad } of conteos) {
    const resumen = resumenes.get(recursoId)!;
    if (valor === 'POSITIVO') resumen.positivos = cantidad;
    else resumen.negativos = cantidad;
  }
  for (const { recursoId, valor } of propios) {
    resumenes.get(recursoId)!.miVoto = valor;
  }
  return resumenes;
}
