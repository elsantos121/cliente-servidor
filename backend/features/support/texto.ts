/** Convierte el texto "A", "B", "C" de un paso de Gherkin en ['A', 'B', 'C']. */
export function listaEntreComillas(texto: string): string[] {
  return [...texto.matchAll(/"([^"]*)"/g)].map((m) => m[1]);
}
