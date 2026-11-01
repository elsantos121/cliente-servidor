import { Prisma } from '@prisma/client';
import { describe, expect, it } from 'vitest';
import { traducirErrorPrisma } from '../../src/db/errores';
import { AppError } from '../../src/errors/AppError';

function errorPrisma(code: string) {
  return new Prisma.PrismaClientKnownRequestError('falla de prueba', { code, clientVersion: 'prueba' });
}

describe('traducirErrorPrisma', () => {
  const conflicto = AppError.conflicto('Duplicado');
  const noEncontrado = AppError.noEncontrado('Publicación');

  it('P2002 (UNIQUE) se traduce al error indicado en "unico"', () => {
    expect(traducirErrorPrisma(errorPrisma('P2002'), { unico: conflicto })).toBe(conflicto);
  });

  it('P2003 (clave foránea) se traduce al error indicado en "claveForanea"', () => {
    expect(traducirErrorPrisma(errorPrisma('P2003'), { claveForanea: noEncontrado })).toBe(noEncontrado);
  });

  it('P2025 (registro inexistente) se traduce al error indicado en "inexistente"', () => {
    expect(traducirErrorPrisma(errorPrisma('P2025'), { inexistente: noEncontrado })).toBe(noEncontrado);
  });

  it('un código sin traducción indicada se devuelve tal cual', () => {
    const original = errorPrisma('P2003');

    expect(traducirErrorPrisma(original, { unico: conflicto })).toBe(original);
  });

  it('un error que no es de Prisma se devuelve tal cual', () => {
    const original = new Error('otra cosa');

    expect(traducirErrorPrisma(original, { unico: conflicto, claveForanea: noEncontrado })).toBe(original);
  });
});
