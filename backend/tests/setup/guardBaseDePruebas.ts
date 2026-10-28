/**
 * Protección: las pruebas borran datos, así que solo pueden ejecutarse contra una base
 * cuyo nombre termine en "_test". Evita destruir por error la base de desarrollo u otra.
 */
export function asegurarBaseDePruebas(url: string | undefined): void {
  if (!url) {
    throw new Error('DATABASE_URL no está definida. Crear backend/.env.test a partir de .env.example.');
  }
  let nombreBase: string;
  try {
    nombreBase = new URL(url).pathname.replace(/^\//, '');
  } catch {
    throw new Error('DATABASE_URL no es una URL válida.');
  }
  if (!nombreBase.endsWith('_test')) {
    throw new Error(
      `Se canceló la ejecución: la base "${nombreBase}" no termina en "_test". ` +
        'Las pruebas solo pueden usar una base de pruebas.',
    );
  }
}
