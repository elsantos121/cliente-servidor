import { describe, expect, it } from 'vitest';
import { asegurarBaseDePruebas } from '../setup/guardBaseDePruebas';

describe('asegurarBaseDePruebas', () => {
  it('acepta una base cuyo nombre termina en _test', () => {
    expect(() =>
      asegurarBaseDePruebas('postgresql://postgres:x@localhost:5432/foro_test?schema=public'),
    ).not.toThrow();
  });

  it('rechaza la base de desarrollo', () => {
    expect(() =>
      asegurarBaseDePruebas('postgresql://postgres:x@localhost:5432/foro_dev?schema=public'),
    ).toThrow(/no termina en "_test"/);
  });

  it('rechaza una URL ausente', () => {
    expect(() => asegurarBaseDePruebas(undefined)).toThrow(/DATABASE_URL no está definida/);
  });
});
