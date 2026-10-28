# Estrategia de pruebas

> Fase 1 (Análisis). Este documento describe la estrategia; la evidencia real de ejecución (salidas de RED → GREEN) se agrega en la Fase 3, solo con resultados efectivamente ejecutados.

## Niveles de prueba

| Nivel | Herramienta | Qué verifica | Ubicación |
|---|---|---|---|
| Unitarias | Vitest | Reglas de negocio de los servicios, validaciones Zod, middlewares | `backend/tests/unit/` |
| Integración | Vitest + Supertest + PostgreSQL de pruebas | Endpoints completos: HTTP → servicio → base de datos | `backend/tests/integration/` |
| Aceptación (BDD) | Cucumber.js + Gherkin | Criterios de aceptación de cada historia contra la API real | `backend/features/` |
| Frontend | Runner de Angular | Componentes y servicios principales (formularios, mensajes de error) | `frontend/src/**/*.spec.ts` |

## Ciclo TDD por historia

1. **Gherkin primero:** se escribe el `.feature` con los criterios de aceptación. Falla porque no hay implementación.
2. **RED:** prueba unitaria del servicio que falla. Se ejecuta y se registra la salida.
3. **GREEN:** código mínimo para que pase. Se ejecuta de nuevo.
4. **REFACTOR:** se mejora el código manteniendo todas las pruebas en verde.
5. Se repite para el endpoint (Supertest) y se conectan los pasos de Cucumber.

Commits sugeridos: `test(HU-01): registro con correo duplicado (RED)` → `feat(HU-01): rechazar correo duplicado (GREEN)` → `refactor(HU-01): ...`.

## Base de datos de pruebas

- Base separada: `foro_test` (variable `DATABASE_URL` en `backend/.env.test`).
- Protección: el script de pruebas **se niega a ejecutar** si la URL no contiene `_test`, para no borrar una base de desarrollo o real.
- Reinicio: `prisma migrate reset --force --skip-seed` antes de la suite; cada prueba limpia las tablas que usa (`TRUNCATE ... CASCADE`).
- En GitHub Actions se usa un servicio PostgreSQL efímero.

## Casos mínimos a cubrir

- Registro válido y correo duplicado.
- Login válido e inválido.
- Creación y consulta de publicaciones.
- Rechazo de datos incorrectos.
- Creación de comentarios.
- Acceso denegado a operaciones administrativas por estudiantes.
- Reporte de publicaciones.
- Gestión administrativa de reportes.
- Manejo de recursos inexistentes.

## Comandos (previstos, PowerShell)

```powershell
cd backend
npm test              # unitarias + integración
npm run test:bdd      # escenarios Cucumber
npm run typecheck
npm run lint
```

## Registro de ejecuciones reales

### Fase 2 — Verificación de la configuración (2026-10-28)

Ejecutado por el equipo en Windows (Node v22.18.0, PowerShell, PostgreSQL local, base `foro_test`).

| Comando | Resultado |
|---|---|
| `npm run typecheck` | sin errores |
| `npm run lint` | sin errores |
| `npm run build` | sin errores |
| `npm test` | 2 archivos, **6 pruebas pasadas** (`salud.test.ts` 3, `guardBaseDePruebas.test.ts` 3) |
| `npm run test:bdd` | **2 escenarios / 5 pasos pasados** |

**La protección de la base funcionó en un caso real:** en la primera ejecución `.env.test` todavía apuntaba a `foro_dev`, y tanto Vitest como Cucumber se detuvieron con:

```
Error: Se canceló la ejecución: la base "foro_dev" no termina en "_test". Las pruebas solo pueden usar una base de pruebas.
```

Se corrigió `.env.test` y las pruebas pasaron sin tocar la base de desarrollo.

**Auditoría de dependencias (`npm audit`):** la instalación inicial reportó 11 vulnerabilidades, todas en herramientas de desarrollo. Se actualizó Vitest 3.2.7 → 4.1.12 y Cucumber 11.3.0 → 12.9.0 (versiones mínimas sin vulnerabilidades, sin saltar a versiones mayores con cambios incompatibles) y se volvieron a ejecutar todas las pruebas con resultado verde.

**Limitación conocida:** quedan 3 avisos *high* por `deepmerge-ts` 7.x, usado internamente por la CLI de Prisma 6 (`@prisma/config`). Afecta solo a la herramienta de línea de comandos (no a la API en ejecución) y es una denegación de servicio con objetos recursivos, que no se aplica a este uso. La corrección requiere migrar a Prisma 7, que tiene cambios incompatibles; se evaluará como tarea separada.
