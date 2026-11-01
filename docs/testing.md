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

### Fase 3 · Iteración 2 — HU-02 Inicio de sesión (2026-10-28)

Rama `feature/HU-02-login` (creada desde `feature/HU-01-registro`, que todavía no estaba integrada). Mismo entorno que la iteración 1.

| Paso | Comando | Resultado real |
|---|---|---|
| Gherkin | `npm run test:bdd` | **falla:** 15 escenarios (7 *undefined*), 13 pasos sin definir |
| RED servicio | `npx vitest run tests/integration/auth.login.service.test.ts` | **9 de 9 fallan:** `iniciarSesion is not a function` |
| GREEN servicio | ídem + `auth.service.test.ts` | **13 pruebas pasadas** (9 de login/tokens/seed, 4 de registro) |
| RED middlewares | `npx vitest run tests/unit/autenticar.test.ts` | **falla:** `Cannot find module '../../src/middlewares/autenticar'` |
| GREEN middlewares | ídem | **8 pruebas pasadas** (401 sin token, esquema, firma, expirado; 403 por rol) |
| RED endpoints | `npx vitest run tests/integration/login.routes.test.ts` | **8 de 8 fallan:** `expected 404 to be 200/401/400` |
| GREEN endpoints | ídem | **8 pruebas pasadas** |
| Pasos BDD | `npm run test:bdd` | **15 escenarios / 69 pasos pasados** |
| Seed | `npm run prisma:seed` (dos veces, base `foro_dev`) | sin variables: error claro; con variables: `Administrador listo: admin@uni.edu (id 2)` las dos veces (idempotente) |
| REFACTOR | suite completa | ver tabla siguiente |
| Pantalla | `npx ng test --watch=false` | 4 archivos, **25 pruebas pasadas** |

Verificación completa al cierre de la iteración:

| Comando | Resultado |
|---|---|
| backend `npm run typecheck` / `lint` / `build` | sin errores |
| backend `npm test` | 7 archivos, **41 pruebas pasadas** |
| backend `npm run test:bdd` | **15 escenarios / 69 pasos pasados** |
| frontend `npx ng test --watch=false` | 4 archivos, **25 pruebas pasadas** |
| frontend `npx ng build` | sin errores (chunks diferidos: login 3,8 kB, registro 5,3 kB) |

Prueba manual en el navegador (`npm run dev` + `ng serve`, base `foro_dev`): registro de un estudiante nuevo → enlace a iniciar sesión → contraseña incorrecta muestra "Correo o contraseña incorrectos" → login correcto muestra el nombre en la cabecera → al recargar la sesión sigue y el token guardado obtiene `200` en `GET /api/usuarios/me` → "Cerrar sesión" borra la sesión guardada.

**Configuración:** `JWT_SECRET` ahora se valida al arrancar (mínimo 16 caracteres, como ya decía `.env.example`). El `.env.test` local tenía uno más corto y las pruebas fallaron con `Configuración inválida: JWT_SECRET: debe tener al menos 16 caracteres` hasta reemplazarlo. El seed necesita `ADMIN_EMAIL` y `ADMIN_PASSWORD` en `.env`.

**Corrección de documentación:** en la iteración 1 la tabla de `docs/historias-usuario.md` marcó por error HU-02 como implementada (la fila menciona HU-01 como dependencia). Con esta iteración la marca pasa a ser correcta.

**Entorno:** durante la iteración la máquina se quedó sin memoria virtual y el motor de Prisma no arrancaba (`0xC0000142`); se resolvió cerrando programas.

### Fase 3 · Iteración 3 — HU-06a Gestión de categorías (2026-10-28)

Rama `feature/HU-06a-categorias` (creada desde `feature/HU-02-login`). Mismo entorno.

| Paso | Comando | Resultado real |
|---|---|---|
| Gherkin | `npm run test:bdd` | **falla:** 21 escenarios (6 *undefined*), 10 pasos sin definir |
| RED servicio | `npx vitest run tests/integration/categorias.service.test.ts` | **falla:** `Cannot find module '../../src/modules/categorias/categorias.service'` |
| GREEN servicio | ídem | **4 pruebas pasadas**; migración `20261029021208_crear_categorias` aplicada |
| RED endpoints | `npx vitest run tests/integration/categorias.routes.test.ts` | **11 de 11 fallan:** `expected 404 to be 201/400/403/409` |
| GREEN endpoints | ídem | **11 pruebas pasadas** |
| Pasos BDD | `npm run test:bdd` | **21 escenarios / 108 pasos pasados** |
| REFACTOR | `duplicados.concurrentes.test.ts` contra el código **anterior** | **2 de 2 fallan:** el duplicado simultáneo devolvía el error crudo `P2002` (500) |
| REFACTOR | suite completa con el cambio | ver tabla siguiente (los 2 casos dan `201` + `409`) |
| Pantalla | `npx ng test --watch=false` | primera ejecución: **3 fallan** (`(ngSubmit)` no se disparaba en un `<form>` sin `[formGroup]`); corregido → **5 archivos, 31 pruebas pasadas** |

Verificación completa al cierre de la iteración:

| Comando | Resultado |
|---|---|
| backend `npm run typecheck` / `lint` / `build` | sin errores |
| backend `npm test` | 10 archivos, **58 pruebas pasadas** |
| backend `npm run test:bdd` | **21 escenarios / 108 pasos pasados** |
| frontend `npx ng test --watch=false` | 5 archivos, **31 pruebas pasadas** |
| frontend `npx ng build` | sin errores (chunk diferido `admin-categorias` 5,4 kB) |

Prueba manual en el navegador (`npm run dev` + `ng serve`, base `foro_dev`, ancho de móvil 360 px):
- Sin sesión, `/admin/categorias` lleva a `/login?volver=%2Fadmin%2Fcategorias`.
- Como administrador del seed: el panel muestra el estado vacío; crear "Matemática" la agrega a la lista; "matemática" muestra "Ya existe una categoría con ese nombre".
- Como estudiante: la cabecera no muestra "Categorías", `/admin/categorias` redirige fuera del panel y `POST /api/categorias` responde `403 PROHIBIDO`.

**Nota de proceso:** la ejecución de Vitest del frontend falló una vez con `Timeout waiting for worker to respond` por falta de memoria en la máquina; al reintentar corrió normalmente.

### Fase 3 · Iteración 4 — HU-03 Publicaciones (2026-11-01)

Rama `feature/HU-03-publicaciones` (creada desde `feature/HU-06a-categorias`). Mismo entorno.

| Paso | Comando | Resultado real |
|---|---|---|
| Gherkin | `npm run test:bdd` | **falla:** 34 escenarios (13 *undefined*), 29 pasos sin definir |
| RED servicio | `npx vitest run tests/integration/publicaciones.service.test.ts` | **falla:** `Cannot find module '../../src/modules/publicaciones/publicaciones.service'` |
| GREEN servicio | ídem | **14 pruebas pasadas**; migración `20261101185103_crear_publicaciones` aplicada |
| RED endpoints | `npx vitest run tests/integration/publicaciones.routes.test.ts` | **22 de 25 fallan** (`expected 404 to be 201/400/401`). Las 3 que pasan son las de "id inexistente → 404": coinciden por casualidad con el 404 genérico de ruta inexistente |
| GREEN endpoints | ídem | **25 pruebas pasadas** |
| Pasos BDD | `npm run test:bdd` | **34 escenarios / 224 pasos pasados** |
| REFACTOR | suite completa antes del cambio | 12 archivos, 97 pruebas · 128 s en total, **64 s de pruebas** · Cucumber **29 s** |
| REFACTOR | suite completa con `BCRYPT_COSTO=4` | 12 archivos, 97 pruebas · 141 s en total, **27 s de pruebas** · Cucumber **10 s** |
| Pantallas | `npx ng test --watch=false` | **8 archivos, 48 pruebas pasadas** (inicio 5, detalle 7, formulario 5) |

El tiempo total de `npm test` no bajó porque está dominado por la carga de módulos en esta máquina (37 s de `import`), que bcrypt no afecta; sí bajó el tiempo de ejecución de las pruebas y de Cucumber.

Verificación completa al cierre de la iteración:

| Comando | Resultado |
|---|---|
| backend `npm run typecheck` / `lint` / `build` | sin errores |
| backend `npm test` | 12 archivos, **97 pruebas pasadas** |
| backend `npm run test:bdd` | **34 escenarios / 224 pasos pasados** |
| frontend `npx ng test --watch=false` | 8 archivos, **48 pruebas pasadas** |
| frontend `npx ng build` | sin errores (chunks diferidos: inicio 4,2 kB, detalle 4,8 kB, formulario 6,8 kB) |

Prueba manual en el navegador (`npm run dev` + `ng serve`, base `foro_dev`, ancho 360 px), con la cuenta de prueba de HU-02:
- El inicio muestra "Todavía no hay publicaciones" y el filtro con las categorías.
- "Nueva publicación" → crear "Ayuda con límites" en Matemática → lleva al detalle, con "Editar" y "Eliminar".
- Editar el título → el detalle muestra el título nuevo y la marca "editada".
- Con otra cuenta de estudiante: el detalle no muestra acciones, `/publicaciones/1/editar` muestra "Solo el autor puede editar esta publicación." y la API responde `403` a `PUT` y `DELETE`.
- De vuelta con el autor: el inicio lista la publicación; "Eliminar" pide confirmación y, al confirmar, vuelve al inicio vacío.
- Sin sesión, `/publicaciones/1` muestra "La publicación no existe o fue eliminada.".

**Configuración:** `.env.test` necesita `BCRYPT_COSTO=4` para la mejora de tiempo (opcional; sin la variable se usa 10).

### Fase 3 · Iteración 5 — HU-04 Comentarios (2026-11-01)

Rama `feature/HU-04-comentarios` (creada desde `feature/HU-03-publicaciones`). Mismo entorno.

| Paso | Comando | Resultado real |
|---|---|---|
| Gherkin | `npm run test:bdd` | **falla:** 40 escenarios (6 *undefined*), 10 pasos sin definir |
| RED servicio | `npx vitest run tests/integration/comentarios.service.test.ts` | **falla:** `Cannot find module '../../src/modules/comentarios/comentarios.service'` |
| GREEN servicio | ídem | **6 pruebas pasadas** (incluye la cascada al borrar la publicación); migración `20261101193456_crear_comentarios` aplicada |
| RED endpoints | `npx vitest run tests/integration/comentarios.routes.test.ts` | **9 de 14 fallan** (`expected 404 to be 201/400/401/200`). Pasan los 4 casos de "404" (coinciden con el 404 genérico de ruta inexistente) y el que comprueba que el detalle de la publicación sigue respondiendo |
| GREEN endpoints | ídem | primera ejecución: **13 de 14**; falló "sin token → 401" por un error de la prueba (pasar `undefined` activaba el token por defecto). Corregida la prueba → **14 pasadas** |
| Pasos BDD | `npm run test:bdd` | **40 escenarios / 274 pasos pasados** |
| REFACTOR | suite completa | ver tabla siguiente |
| Pantalla | `npx ng test --watch=false` | **9 archivos, 54 pruebas pasadas** (comentarios 6; el detalle ahora también atiende el pedido de comentarios) |

Verificación completa al cierre de la iteración:

| Comando | Resultado |
|---|---|
| backend `npm run typecheck` / `lint` / `build` | sin errores |
| backend `npm test` | 14 archivos, **117 pruebas pasadas** |
| backend `npm run test:bdd` | **40 escenarios / 274 pasos pasados** |
| frontend `npx ng test --watch=false` | 9 archivos, **54 pruebas pasadas** |
| frontend `npx ng build` | sin errores (chunk diferido `publicacion-detalle` 10,6 kB con comentarios) |

Prueba manual en el navegador (`npm run dev` + `ng serve`, base `foro_dev`), sobre una publicación de prueba creada por API:
- Sin sesión, el detalle muestra "Comentarios (0)", "Todavía no hay comentarios." y "Iniciá sesión para comentar." (enlace a `/login?volver=%2Fpublicaciones%2F2`).
- Al iniciar sesión desde ese enlace vuelve al detalle y aparece el formulario.
- "Comentar" con el campo vacío muestra "El comentario no puede estar vacío" sin llamar a la API.
- Un comentario válido aparece al final con el nombre del autor ("Comentarios (1)") y sigue ahí al recargar.
- Al eliminar la publicación por API (`204`), `GET .../comentarios` responde `404` y en `foro_dev` quedan **0** comentarios de esa publicación (cascada).

### Fase 3 · Iteración 6 — HU-05 Denuncia de publicaciones (2026-11-01)

Rama `feature/HU-05-denuncias`, creada desde `feature/HU-04-comentarios` porque al empezar `develop` solo tenía HU-01 (los PR #2 a #5 se mergearon contra la rama de la historia anterior y no contra `develop`). Mismo entorno.

| Paso | Comando | Resultado real |
|---|---|---|
| Gherkin | `npm run test:bdd` | **falla:** 45 escenarios (5 *undefined*), 8 pasos sin definir |
| RED servicio | `npx vitest run tests/integration/reportes.service.test.ts` | **falla:** `Cannot find module '../../src/modules/reportes/reportes.service'` |
| GREEN servicio | ídem | **5 pruebas pasadas** (incluye duplicado y cascada); migración `20261101210246_crear_reportes` aplicada |
| RED endpoint | `npx vitest run tests/integration/reportes.routes.test.ts` | **8 de 10 fallan** (`expected 404 to be 201/400/401/409`); pasan los 2 casos de "404", que coinciden con el 404 genérico de ruta inexistente |
| GREEN endpoint | ídem | **10 pruebas pasadas** |
| Pasos BDD | `npm run test:bdd` | **45 escenarios / 317 pasos pasados** |
| REFACTOR | suite completa (con la nueva `tests/unit/errores.test.ts`, 4 pruebas) | ver tabla siguiente |
| Pantalla | `npx ng test --watch=false` | **10 archivos, 62 pruebas pasadas** (denuncia 6; detalle +2 sobre quién ve la opción) |

Verificación completa al cierre de la iteración:

| Comando | Resultado |
|---|---|
| backend `npm run typecheck` / `lint` / `build` | sin errores |
| backend `npm test` | 17 archivos, **136 pruebas pasadas** |
| backend `npm run test:bdd` | **45 escenarios / 317 pasos pasados** |
| frontend `npx ng test --watch=false` | 10 archivos, **62 pruebas pasadas** |
| frontend `npx ng build` | sin errores (chunk diferido `publicacion-detalle` 15,2 kB) |

Prueba manual en el navegador (`npm run dev` + `ng serve`, base `foro_dev`), sobre una publicación de prueba creada por API por otra cuenta:
- Al iniciar sesión con `?volver=/publicaciones/3` vuelve al detalle, que muestra "Denunciar publicación".
- Motivo "Malo" → "El motivo debe tener entre 5 y 500 caracteres", sin llamar a la API.
- Motivo válido → "Gracias. Tu denuncia quedó registrada y la revisará un administrador."
- Recargar y denunciar de nuevo → "Ya denunciaste esta publicación. Un administrador la va a revisar." (sin mensaje de error).
- Con la cuenta del autor: se ven "Editar" y "Eliminar" pero no la opción de denunciar.
- En `foro_dev` queda **una** denuncia `PENDIENTE` de esa publicación, del usuario que denunció. Se dejó a propósito para probar la moderación en HU-06b.

### Fase 3 · Iteración 7 — HU-06b Moderación de reportes (2026-11-01)

Rama `feature/HU-06b-moderacion`, creada desde `develop` después de integrar HU-02 a HU-05 (PR #7 y #8; se comprobó que el contenido de `develop` es idéntico al de `feature/HU-05-denuncias` ya verificado). Mismo entorno.

| Paso | Comando | Resultado real |
|---|---|---|
| Gherkin | `npm run test:bdd` | **falla:** 52 escenarios (7 *undefined*), 17 pasos sin definir |
| RED servicio | `npx vitest run tests/integration/moderacion.service.test.ts` | **5 de 5 fallan:** `listarReportes is not a function` / `cambiarEstado is not a function` |
| GREEN servicio | ídem + `reportes.service.test.ts` | **10 pruebas pasadas** |
| RED endpoints | `npx vitest run tests/integration/moderacion.routes.test.ts` | **11 de 13 fallan** (`expected 404 to be 200/400/403`, `expected undefined to deeply equal []`); pasan los 2 casos de "404", que coinciden con el 404 genérico de ruta inexistente |
| GREEN endpoints | ídem + `reportes.routes.test.ts` | **23 pruebas pasadas** |
| Pasos BDD | `npm run test:bdd` | **52 escenarios / 393 pasos pasados** |
| REFACTOR | suite completa (`cambiarEstado` en una consulta; `errores.test.ts` +1 caso P2025) | ver tabla siguiente |
| Pantalla | `npx ng test --watch=false` | **11 archivos, 69 pruebas pasadas** (panel de reportes 7) |

Verificación completa al cierre de la iteración:

| Comando | Resultado |
|---|---|
| backend `npm run typecheck` / `lint` / `build` | sin errores |
| backend `npm test` | 19 archivos, **155 pruebas pasadas** |
| backend `npm run test:bdd` | **52 escenarios / 393 pasos pasados** |
| frontend `npx ng test --watch=false` | 11 archivos, **69 pruebas pasadas** |
| frontend `npx ng build` | sin errores (chunk diferido `admin-reportes` 7,1 kB) |

Prueba manual en el navegador (`npm run dev` + `ng serve`, base `foro_dev`), con la denuncia que quedó de HU-05 y otra creada por API; sesión de administrador cargada con un token obtenido por API (el login ya se probó en HU-02):
- `/admin/reportes` lista los 2 reportes pendientes con publicación, motivo y quién denunció.
- "Descartar" en el primero → "Reporte sobre «Prueba de denuncias» descartado." y desaparece de pendientes.
- "Eliminar publicación" en el segundo pide confirmación; al confirmar → "Se eliminó la publicación «Spam de prueba» y sus reportes." y "No hay reportes pendientes.".
- El filtro "Descartados" muestra el reporte descartado, sin acciones.
- Como estudiante: la cabecera no muestra "Reportes", `/admin/reportes` redirige al inicio y la API responde `403` a `GET /api/reportes` y `PATCH /api/reportes/1`.
- En `foro_dev`: el reporte 1 quedó `DESCARTADO`, la publicación 4 ya no existe y no quedó ningún reporte suyo (cascada).

**Con esta iteración quedan implementadas las siete historias de la fase 3.**
