# Historias de usuario — Foro universitario

> Fase 1 (Análisis). Formato: *Como [rol], quiero [acción], para [beneficio].*
> Prioridad: **Alta** = necesaria para que el foro funcione · **Media** = completa la v1.
> Las pruebas listadas se crearán siguiendo TDD/BDD en la Fase 3; los nombres de archivo son los previstos.

## Resumen y orden de implementación

| Orden | ID | Historia | Prioridad | Depende de | Estado |
|---|---|---|---|---|---|
| 1 | HU-01 | Registro de estudiantes | Alta | — | Implementada (pendiente PR a develop) |
| 2 | HU-02 | Inicio de sesión | Alta | HU-01 | Implementada (pendiente PR a develop) |
| 3 | HU-06a | Gestión de categorías (admin) | Alta | HU-02 | Pendiente |
| 4 | HU-03 | Publicaciones (crear, consultar, editar, eliminar) | Alta | HU-02, HU-06a | Pendiente |
| 5 | HU-04 | Comentarios | Media | HU-03 | Pendiente |
| 6 | HU-05 | Denuncia de publicaciones | Media | HU-03 | Pendiente |
| 7 | HU-06b | Moderación de reportes (admin) | Media | HU-05 | Pendiente |

HU-06 original ("gestionar categorías y revisar reportes") se dividió en HU-06a y HU-06b por ser demasiado grande: son dos módulos independientes y la segunda depende de HU-05.

## Definición de terminado (común a todas las historias)

Una historia está terminada cuando:

1. Sus criterios de aceptación están cubiertos por escenarios Gherkin que pasan.
2. Existen pruebas unitarias del servicio y pruebas de integración del endpoint (Supertest + PostgreSQL de pruebas) que pasan.
3. El ciclo RED → GREEN → REFACTOR quedó registrado en commits separados.
4. `npm run typecheck`, `npm run lint` y `npm test` pasan en local y en GitHub Actions.
5. Los endpoints están documentados (método, ruta, cuerpo, respuestas, errores).
6. La pantalla correspondiente del frontend funciona contra la API real (cuando aplica).
7. La rama se integró a `develop` mediante pull request.

---

## HU-01 — Registro de estudiantes

- **Prioridad:** Alta
- **Estado:** implementada en `feature/HU-01-registro` (API + pantalla `/registro`); falta integrarla a `develop`.
- **Descripción:** Como estudiante, quiero registrarme con mi nombre, correo y contraseña para participar en el foro.

**Criterios de aceptación**
1. Con datos válidos, el sistema crea la cuenta con rol `ESTUDIANTE`, responde `201` y la respuesta **no** incluye la contraseña ni su hash.
2. Si el correo ya está registrado (sin distinguir mayúsculas), responde `409` y no crea otra cuenta.
3. Si falta un campo, el correo es inválido o la contraseña tiene menos de 8 caracteres, responde `400` con el detalle por campo. Un campo `rol` enviado por el cliente se ignora.

**Escenarios**
- ✅ Registro exitoso con datos válidos.
- ❌ Correo duplicado (`Ana@uni.edu` vs `ana@uni.edu`).
- ❌ Campos vacíos / correo mal formado / contraseña corta.
- ❌ Intento de escalar privilegios enviando `"rol": "ADMIN"` → se crea como `ESTUDIANTE`.

**Pruebas relacionadas:** `tests/integration/auth.service.test.ts` (hash, minúsculas, duplicado), `tests/integration/auth.routes.test.ts` (201/400/409, rol ignorado), `features/registro.feature` (6 escenarios), `frontend/src/app/pages/registro/registro.spec.ts`.

**Dependencias:** ninguna.

---

## HU-02 — Inicio de sesión

- **Prioridad:** Alta
- **Descripción:** Como usuario registrado, quiero iniciar sesión para acceder a las funciones autorizadas según mi rol.

**Criterios de aceptación**
1. Con credenciales válidas responde `200` con un token JWT y los datos públicos del usuario (id, nombre, correo, rol).
2. Con correo inexistente o contraseña incorrecta responde `401` con el **mismo** mensaje genérico (no revela cuál falló).
3. Un endpoint protegido responde `401` sin token o con token inválido/expirado, y `403` si el rol no tiene permiso.

**Escenarios**
- ✅ Login de estudiante; ✅ login del administrador creado por el seed.
- ❌ Contraseña incorrecta; ❌ correo inexistente; ❌ token alterado.

**Pruebas relacionadas:** `auth.service.test.ts`, `auth.routes.test.ts`, `middlewares/autenticar.test.ts`, `features/login.feature`.

**Dependencias:** HU-01.

---

## HU-06a — Gestión de categorías

- **Prioridad:** Alta (las publicaciones requieren categoría)
- **Descripción:** Como administrador, quiero crear categorías para mantener organizado el foro.

**Criterios de aceptación**
1. Cualquier visitante puede listar las categorías (`200`).
2. Un administrador crea una categoría con nombre válido (2–50 caracteres) → `201`; nombre duplicado (sin distinguir mayúsculas) → `409`; nombre inválido → `400`.
3. Un estudiante que intenta crear una categoría recibe `403`; sin token, `401`.

**Escenarios:** ✅ admin crea "Matemática"; ✅ listado; ❌ duplicado; ❌ estudiante intenta crear; ❌ nombre vacío.

**Pruebas relacionadas:** `categorias.service.test.ts`, `categorias.routes.test.ts`, `features/categorias.feature`.

**Dependencias:** HU-02.

---

## HU-03 — Publicaciones

- **Prioridad:** Alta
- **Descripción:** Como estudiante, quiero crear, consultar, editar y eliminar mis publicaciones para compartir información con la comunidad.

Se divide en tareas: **(a)** listar y ver detalle · **(b)** crear · **(c)** editar/eliminar propias.

**Criterios de aceptación**
1. Cualquier visitante lista publicaciones (más recientes primero, filtro opcional por categoría) y ve el detalle; un id inexistente → `404`.
2. Un usuario autenticado crea una publicación con título (3–150), contenido (10–5000) y una categoría existente → `201`. Datos inválidos → `400`; categoría inexistente → `400`; sin token → `401`.
3. Solo el autor puede editar su publicación; el autor o un administrador pueden eliminarla. Otro estudiante recibe `403`; publicación inexistente → `404`.

**Escenarios:** ✅ crear, listar, ver detalle, editar propia, eliminar propia · ❌ título vacío · ❌ categoría inexistente · ❌ editar ajena · ❌ eliminar ajena · ❌ id inexistente.

**Pruebas relacionadas:** `publicaciones.service.test.ts`, `publicaciones.routes.test.ts`, `features/publicaciones.feature`.

**Dependencias:** HU-02, HU-06a.

---

## HU-04 — Comentarios

- **Prioridad:** Media
- **Descripción:** Como estudiante, quiero comentar publicaciones para participar en las conversaciones.

**Criterios de aceptación**
1. Cualquier visitante lista los comentarios de una publicación (más antiguos primero), con el nombre del autor.
2. Un usuario autenticado comenta con contenido de 1–2000 caracteres → `201`, asociado a su usuario y a la publicación. Contenido vacío → `400`; sin token → `401`.
3. Comentar o listar comentarios de una publicación inexistente → `404`.

**Escenarios:** ✅ comentar · ✅ listar · ❌ vacío · ❌ publicación inexistente · ❌ sin sesión.

**Pruebas relacionadas:** `comentarios.service.test.ts`, `comentarios.routes.test.ts`, `features/comentarios.feature`.

**Dependencias:** HU-03.

---

## HU-05 — Denuncia de publicaciones

- **Prioridad:** Media
- **Descripción:** Como estudiante, quiero denunciar una publicación para informar contenido inapropiado.

**Criterios de aceptación**
1. Un usuario autenticado denuncia una publicación con un motivo (5–500 caracteres) → `201`, con estado `PENDIENTE`, autor y publicación registrados.
2. Denunciar dos veces la misma publicación → `409`; publicación inexistente → `404`.
3. Motivo vacío → `400`; sin token → `401`.

**Escenarios:** ✅ denuncia · ❌ duplicada · ❌ publicación inexistente · ❌ motivo vacío.

**Pruebas relacionadas:** `reportes.service.test.ts`, `reportes.routes.test.ts`, `features/reportes.feature`.

**Dependencias:** HU-03.

---

## HU-06b — Moderación de reportes

- **Prioridad:** Media
- **Descripción:** Como administrador, quiero revisar los reportes pendientes y eliminar publicaciones denunciadas para mantener el foro en orden.

**Criterios de aceptación**
1. Un administrador lista los reportes (por defecto `PENDIENTE`) con publicación, autor y motivo → `200`.
2. Un administrador cambia el estado de un reporte a `RESUELTO` o `DESCARTADO` → `200`; reporte inexistente → `404`; estado inválido → `400`.
3. Un administrador elimina la publicación denunciada (`DELETE /api/publicaciones/:id`). Un estudiante que intenta listar o cambiar reportes recibe `403`.

**Escenarios:** ✅ listar pendientes · ✅ descartar · ✅ eliminar publicación denunciada · ❌ estudiante accede a reportes · ❌ reporte inexistente.

**Pruebas relacionadas:** `reportes.routes.test.ts`, `features/moderacion.feature`.

**Dependencias:** HU-05, HU-03.
