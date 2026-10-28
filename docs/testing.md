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
