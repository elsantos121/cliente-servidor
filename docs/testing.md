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

### Fase 2 — Frontend generado (2026-10-28)

Se generó con Angular CLI 21 (`@angular/core` ^21.2, TypeScript ~5.9, Vitest ^4) porque Angular 22 exige Node ≥ 22.22.3 y el equipo usa Node 22.18.0. Angular 21 sigue con soporte y es compatible con esa versión.

| Comando | Resultado |
|---|---|
| `npm test -- --watch=false` (frontend) | 1 archivo, **2 pruebas pasadas** (`app.spec.ts`) |

Frontend y backend usan el mismo runner de pruebas (Vitest 4).

### Fase 3 · Iteración 1 — HU-01 Registro (2026-10-28)

Rama `feature/HU-01-registro`. Ejecutado en Windows (Node v22.18.0, PostgreSQL local, base `foro_test`). Cada paso quedó en su propio commit.

| Paso | Commit | Comando | Resultado real |
|---|---|---|---|
| Gherkin | `test(HU-01): escenarios BDD de registro` | `npm run test:bdd` | **falla:** 8 escenarios (6 *undefined*, 2 passed), 20 pasos sin definir |
| RED servicio | `test(HU-01): servicio de registro ... (RED)` | `npx vitest run tests/integration/auth.service.test.ts` | **falla:** `Cannot find module '../../src/modules/auth/auth.service'` |
| GREEN servicio | `feat(HU-01): modelo Usuario, migracion y servicio (GREEN)` | ídem | **4 pruebas pasadas**; migración `20261028225558_crear_usuarios` aplicada |
| RED endpoint | `test(HU-01): endpoint POST /api/auth/registro (RED)` | `npx vitest run tests/integration/auth.routes.test.ts` | **6 de 6 fallan:** `expected 404 to be 201` (la ruta no existía) |
| GREEN endpoint | `feat(HU-01): endpoint ... con validacion Zod (GREEN)` | ídem | **6 pruebas pasadas** |
| Pasos BDD | `test(HU-01): conectar pasos de Cucumber` | `npm run test:bdd` | **8 escenarios / 31 pasos pasados** |
| REFACTOR | `refactor(HU-01): tipar el registro desde el esquema Zod ...` | `npm test` + `npm run test:bdd` | **4 archivos / 16 pruebas** y **8 escenarios** pasados |
| Pantalla | `feat(HU-01): pagina de registro en Angular` | `npx ng test --watch=false` | **2 archivos / 8 pruebas pasadas** (`registro.spec.ts` 6, `app.spec.ts` 2) |

Verificación completa al cierre de la iteración:

| Comando | Resultado |
|---|---|
| backend `npm run typecheck` | sin errores |
| backend `npm run lint` | sin errores |
| backend `npm test` | 4 archivos, **16 pruebas pasadas** |
| backend `npm run test:bdd` | **8 escenarios / 31 pasos pasados** |
| backend `npm run build` | sin errores |
| frontend `npx ng test --watch=false` | 2 archivos, **8 pruebas pasadas** |
| frontend `npx ng build` | sin errores (registro en un chunk diferido de 39 kB) |

Prueba manual contra la API en ejecución (`npm run dev`, base `foro_dev`): registro con `"rol": "ADMIN"` → `201` con rol `ESTUDIANTE` y cabecera `Access-Control-Allow-Origin: http://localhost:4200`; el mismo correo en mayúsculas → `409`; *preflight* CORS `OPTIONS` → `204`.

**Pendiente:** recorrer la pantalla `/registro` en el navegador con `npm start` (no se pudo levantar `ng serve` desde la sesión de Claude por falta de memoria del entorno).

**Dependencia agregada:** `bcryptjs` 3.0.3 (trae sus propios tipos). `npm audit` sigue mostrando solo los 3 avisos conocidos de `deepmerge-ts`.
