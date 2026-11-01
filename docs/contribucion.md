# Guía para integrar features

La otra parte del equipo actúa como **cliente** (ver la consigna en el [README](../README.md)) y envía nuevas features. Cada una entra como pull request a `develop` y solo se acepta con el **CI en verde** y **sin romper las pruebas existentes**. No se implementan features por adelantado.

## 1. Recibir la historia

La feature llega como historia de usuario: *Como [rol], quiero [acción], para [beneficio]*, con criterios de aceptación verificables (códigos HTTP, validaciones, permisos). Si no los trae, se escriben y se acuerdan **antes** de tocar código, y se agrega la historia a [historias-usuario.md](historias-usuario.md).

## 2. Ubicarla en el código

- **Recurso nuevo** → módulo nuevo en `backend/src/modules/<nombre>/` con la estructura de siempre y **una línea** en `backend/src/app.ts`:

  ```
  modules/<nombre>/
  ├── <nombre>.routes.ts       rutas y middlewares (autenticar, autorizar, validar)
  ├── <nombre>.controller.ts   HTTP ⇄ servicio, sin reglas de negocio
  ├── <nombre>.service.ts      reglas de negocio y acceso a datos con Prisma
  ├── <nombre>.schemas.ts      esquemas Zod de entrada
  └── index.ts                 exporta el router
  ```

  ```ts
  // backend/src/app.ts — único punto de registro
  { ruta: '/api/<nombre>', router: <nombre>Router }, // HU-xx
  ```

  Un sub-recurso de otro (como los comentarios de una publicación) usa `Router({ mergeParams: true })` y se monta en `/api/<padre>/:padreId/<nombre>`.

- **Cambio en un módulo existente** → se toca solo su servicio (y esquemas si cambian las entradas) y se agregan pruebas. No se cambian respuestas que ya usa el frontend; si hace falta un campo nuevo, se **agrega**.

### Piezas reutilizables

| Pieza | Dónde | Para qué |
|---|---|---|
| `autenticar` | `src/middlewares/autenticar.ts` | exige un JWT válido y deja `req.usuario = { id, rol }` (401 si no) |
| `autorizar(...roles)` | ídem | exige uno de los roles (403 si no) |
| `validar(esquema)` · `parsear(esquema, datos)` | `src/middlewares/validar.ts` | valida el cuerpo (o `req.query`) con Zod; 400 con detalle por campo |
| `idDeRuta(valor, recurso)` | ídem | convierte un `:id` inválido en 404 |
| `AppError` | `src/errors/AppError.ts` | errores con código HTTP (`validacion`, `noAutenticado`, `prohibido`, `noEncontrado`, `conflicto`) |
| `traducirErrorPrisma(error, { unico, claveForanea, inexistente })` | `src/db/errores.ts` | traduce P2002 / P2003 / P2025 a 409 / 400-404 / 404 |
| `requiereSesion(...roles)` | `frontend/src/app/core/auth.guard.ts` | protege rutas del frontend |
| `authInterceptor` | `frontend/src/app/core/auth.interceptor.ts` | agrega el token y maneja el 401 |

Los permisos **siempre** se verifican en el backend; ocultar un botón en el frontend es solo comodidad.

## 3. Base de datos

- Migraciones **aditivas**: agregar tablas o columnas, nunca borrar ni renombrar columnas en uso.
- Crear la migración en desarrollo:

  ```powershell
  cd backend
  npx prisma migrate dev --name <descripcion>
  ```

- Sumar la tabla nueva a `limpiarBase()` en `backend/tests/helpers/db.ts` para que las pruebas empiecen de cero.
- Si la tabla depende de otra, decidir y documentar qué pasa al borrar el padre (`Restrict` o `Cascade`).

## 4. Pruebas (TDD + BDD)

La feature trae sus propias pruebas; **toda la suite anterior es la prueba de regresión**.

1. `backend/features/<nombre>.feature` en Gherkin (`# language: es`) con los criterios de aceptación. Ejecutarlo: debe fallar.
2. **RED**: prueba del servicio en `backend/tests/integration/`. Commit `test(HU-xx): … (RED)`.
3. **GREEN**: modelo, migración y código mínimo. Commit `feat(HU-xx): … (GREEN)`.
4. Repetir RED → GREEN para el endpoint con Supertest; conectar los pasos de Cucumber (reutilizar los de `features/step_definitions/` cuando existan).
5. **REFACTOR** con todo en verde. Commit `refactor(HU-xx): …`.
6. Pantalla de Angular con su prueba de componente (`*.spec.ts`).
7. Si la feature cambia el recorrido completo, actualizar `features/integracion.feature`.

Verificación completa antes del pull request:

```powershell
cd backend
npm run typecheck; npm run lint; npm test; npm run test:bdd; npm run build
cd ..\frontend
npx ng test --watch=false; npx ng build
```

## 5. Ramas

- `feature/<nombre>` desde `develop` **actualizado** (`git pull` en `develop` antes de crearla).
- Los conflictos se resuelven en la rama de la feature, volviendo a correr toda la suite.
- Un pull request por historia, contra `develop`. Al mergear: **"Create a merge commit"** (conserva el historial RED → GREEN → REFACTOR) y borrar solo la rama de la feature; **nunca** tildar "Delete branch" en un PR que sale de `develop`.

## 6. Revisión del pull request

- [ ] CI en verde (Backend y Frontend).
- [ ] Criterios de aceptación cubiertos por escenarios Gherkin que pasan.
- [ ] Pruebas del servicio y del endpoint; ciclo RED → GREEN → REFACTOR en commits separados.
- [ ] Migración aditiva y tabla agregada a `limpiarBase()`.
- [ ] Permisos verificados en el backend (401/403 probados).
- [ ] Endpoints documentados en [arquitectura.md](arquitectura.md) (método, ruta, cuerpo, respuestas, errores).
- [ ] Sin cambios innecesarios en otros módulos ni en respuestas que ya usa el frontend.

## 7. Documentación

Al integrar: estado de la historia en [historias-usuario.md](historias-usuario.md), endpoints en [arquitectura.md](arquitectura.md) y la evidencia real de las ejecuciones en [testing.md](testing.md).

## 8. A `main`

Al cierre de cada entrega, `develop` se integra a `main` por pull request con el CI en verde.

## Features futuras ya anotadas

- Votos en publicaciones o comentarios.
- Historial de moderación (borrado lógico de publicaciones en lugar de borrado en cascada).
- Mejoras de moderación (por ejemplo, ocultar una publicación mientras se revisa).
