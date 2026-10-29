# Arquitectura — Foro universitario

> Fase 1 (Análisis). Las versiones exactas de las dependencias se fijan y verifican en la Fase 2.

## 1. Visión general

Aplicación **cliente-servidor** en un monorepositorio:

```
Navegador (Angular)  ──HTTP/JSON──▶  API REST (Express + TypeScript)  ──Prisma──▶  PostgreSQL
```

- El **frontend** solo presenta datos y envía solicitudes. Ocultar un botón nunca reemplaza un control de permisos.
- El **backend** concentra reglas de negocio, validaciones y autorización.
- **PostgreSQL** garantiza la integridad con claves foráneas y restricciones `UNIQUE`.

## 2. Estructura del repositorio

```
cliente-servidor/
├── backend/
│   ├── prisma/            schema.prisma · migrations/ · seed.ts
│   ├── src/
│   │   ├── config/        lectura y validación de variables de entorno
│   │   ├── errors/        AppError + manejador centralizado
│   │   ├── middlewares/   autenticar, autorizar(rol), validar(esquema)
│   │   ├── modules/
│   │   │   ├── auth/            registro, login
│   │   │   ├── usuarios/        datos públicos del usuario (/me)
│   │   │   ├── categorias/
│   │   │   ├── publicaciones/
│   │   │   ├── comentarios/
│   │   │   └── reportes/
│   │   ├── app.ts         crea la app y registra los módulos (único punto de registro)
│   │   └── server.ts      arranca el servidor HTTP
│   ├── tests/             unit/ · integration/ · helpers/
│   └── features/          *.feature (Gherkin) · step_definitions/
├── frontend/              Angular (componentes standalone, sin librería de UI)
├── docs/
└── .github/workflows/ci.yml
```

### Estructura interna de un módulo

```
modules/publicaciones/
├── publicaciones.routes.ts      rutas Express y middlewares aplicados
├── publicaciones.controller.ts  traduce HTTP ⇄ servicio (sin reglas de negocio)
├── publicaciones.service.ts     reglas de negocio + acceso a datos con Prisma
├── publicaciones.schemas.ts     esquemas Zod de entrada
└── index.ts                     exporta el router del módulo
```

**Diseño simple:** no se crea una capa "repository" separada; Prisma ya es la capa de acceso a datos y el servicio lo usa directamente. Si un módulo crece, se puede extraer después (refactorización).

## 3. Decisiones tecnológicas

| Tecnología | Motivo |
|---|---|
| Node.js + Express + TypeScript | Pedido por la cátedra; Express es minimalista y fácil de leer para el equipo. |
| Prisma | ORM tipado, migraciones versionadas, consultas parametrizadas (evita inyección SQL). |
| Zod | Un mismo esquema valida la entrada y genera el tipo TypeScript. |
| bcryptjs | Hash de contraseñas; implementación en JavaScript puro, sin compilación nativa en Windows. |
| jsonwebtoken | Token JWT enviado en el header `Authorization: Bearer`. Sencillo con Angular y CORS. |
| Vitest + Supertest | Runner rápido con soporte nativo de TypeScript; Supertest prueba endpoints sin levantar un puerto. |
| Cucumber.js | Escenarios BDD en Gherkin (en español) conectados a la API real y a la base de pruebas. |
| Angular | Pedido por la cátedra; formularios reactivos y `HttpClient` sin librerías extra. |
| GitHub Actions | Integración continua con un servicio PostgreSQL aislado. |

**Excluido por decisión del equipo:** Docker, gestión de sesión con refresh tokens y modo cluster/concurrencia. La autenticación usa un único JWT con expiración.

## 4. Modelo de datos (PostgreSQL)

```
Usuario 1──* Publicacion *──1 Categoria
   │             │
   │ 1           │ 1
   *             *
Comentario ──────┘          (Comentario: autor + publicación)
   
Usuario 1──* Reporte *──1 Publicacion
```

| Tabla | Campos principales | Restricciones |
|---|---|---|
| `usuarios` | id, nombre, email, password_hash, rol, creado_en | PK id · `UNIQUE(email)` (guardado en minúsculas) · rol ∈ {ESTUDIANTE, ADMIN} |
| `categorias` | id, nombre, creado_en | PK id · `UNIQUE(nombre)` |
| `publicaciones` | id, titulo, contenido, autor_id, categoria_id, creado_en, actualizado_en | FK autor → usuarios · FK categoría → categorias (`RESTRICT`) |
| `comentarios` | id, contenido, autor_id, publicacion_id, creado_en | FK autor · FK publicación (`CASCADE`) |
| `reportes` | id, motivo, estado, autor_id, publicacion_id, creado_en, actualizado_en | estado ∈ {PENDIENTE, RESUELTO, DESCARTADO} · `UNIQUE(autor_id, publicacion_id)` · FK publicación (`CASCADE`) |

**Decisión a revisar:** al eliminar una publicación se eliminan en cascada sus comentarios y reportes. Es lo más simple para la v1; conservar el historial de moderación (borrado lógico) queda como posible feature futura.

## 5. API REST (prevista)

Prefijo `/api`. Formato de error uniforme:

```json
{ "error": { "codigo": "VALIDACION", "mensaje": "Datos inválidos", "detalles": { "email": "Correo inválido" } } }
```

| Método | Ruta | Acceso | HU |
|---|---|---|---|
| POST | `/api/auth/registro` | público | HU-01 |
| POST | `/api/auth/login` | público | HU-02 |
| GET | `/api/usuarios/me` | autenticado | HU-02 |
| GET | `/api/categorias` | público | HU-06a |
| POST | `/api/categorias` | ADMIN | HU-06a |
| GET | `/api/publicaciones?categoriaId=` | público | HU-03 |
| GET | `/api/publicaciones/:id` | público | HU-03 |
| POST | `/api/publicaciones` | autenticado | HU-03 |
| PUT | `/api/publicaciones/:id` | autor | HU-03 |
| DELETE | `/api/publicaciones/:id` | autor o ADMIN | HU-03 / HU-06b |
| GET | `/api/publicaciones/:id/comentarios` | público | HU-04 |
| POST | `/api/publicaciones/:id/comentarios` | autenticado | HU-04 |
| POST | `/api/publicaciones/:id/reportes` | autenticado | HU-05 |
| GET | `/api/reportes?estado=PENDIENTE` | ADMIN | HU-06b |
| PATCH | `/api/reportes/:id` | ADMIN | HU-06b |

Códigos usados: `200`, `201`, `204`, `400` validación, `401` no autenticado, `403` sin permiso, `404` inexistente, `409` conflicto (duplicado), `500` error inesperado (sin detalles internos).

La documentación detallada de cada endpoint (cuerpo, respuestas, errores) se completa a medida que se implementa cada historia.

### Endpoints implementados

#### `POST /api/auth/registro` (HU-01) · público

Crea una cuenta de estudiante. Los campos desconocidos se descartan: un `rol` enviado por el cliente se ignora y la cuenta siempre se crea con rol `ESTUDIANTE`.

Cuerpo:

```json
{ "nombre": "Ana Pérez", "email": "ana@uni.edu", "password": "secreta123" }
```

| Campo | Regla |
|---|---|
| `nombre` | obligatorio, 2–100 caracteres (se recortan espacios) |
| `email` | obligatorio, correo válido, máx. 254; se guarda en minúsculas |
| `password` | obligatorio, 8–72 caracteres (límite de bcrypt); se guarda solo el hash |

Respuestas:

| Código | Cuándo | Cuerpo |
|---|---|---|
| `201` | cuenta creada | `{ "usuario": { "id", "nombre", "email", "rol": "ESTUDIANTE", "creadoEn" } }` (sin contraseña ni hash) |
| `400` | falta un campo o no cumple la regla | `{ "error": { "codigo": "VALIDACION", "mensaje": "Datos inválidos", "detalles": { "<campo>": "<mensaje>" } } }` |
| `409` | el correo ya existe (sin distinguir mayúsculas) | `{ "error": { "codigo": "CONFLICTO", "mensaje": "El correo ya está registrado" } }` |

#### `POST /api/auth/login` (HU-02) · público

Cuerpo: `{ "email": "ana@uni.edu", "password": "secreta123" }` (el correo no distingue mayúsculas).

| Código | Cuándo | Cuerpo |
|---|---|---|
| `200` | credenciales válidas | `{ "token": "<JWT>", "usuario": { "id", "nombre", "email", "rol", "creadoEn" } }` |
| `400` | falta el correo o la contraseña | `VALIDACION` con `detalles` por campo |
| `401` | correo inexistente **o** contraseña incorrecta (mismo mensaje y mismo tiempo de respuesta) | `{ "error": { "codigo": "NO_AUTENTICADO", "mensaje": "Correo o contraseña incorrectos" } }` |

El token es un JWT HS256 firmado con `JWT_SECRET`, con `sub` = id del usuario, `rol` y vencimiento `JWT_EXPIRES_IN` (por defecto `2h`). Se envía en cada solicitud protegida como `Authorization: Bearer <token>`. No hay refresh tokens: al vencer, se vuelve a iniciar sesión.

#### `GET /api/usuarios/me` (HU-02) · autenticado

Devuelve `{ "usuario": { "id", "nombre", "email", "rol", "creadoEn" } }` con `200`. Responde `401` sin token, con token alterado, vencido o firmado con otro secreto, y si la cuenta del token ya no existe.

#### Middlewares de autorización (HU-02)

| Middleware | Uso | Error |
|---|---|---|
| `autenticar` | exige un `Bearer` válido y deja `req.usuario = { id, rol }` | `401 NO_AUTENTICADO` |
| `autorizar(...roles)` | después de `autenticar`; exige uno de los roles | `403 PROHIBIDO` (`401` si no hay sesión) |

Ejemplo para HU-06a: `router.post('/', autenticar, autorizar('ADMIN'), validar(esquema), controlador)`.

#### Administrador inicial (seed)

`npm run prisma:seed` crea o actualiza el administrador con `ADMIN_NOMBRE`, `ADMIN_EMAIL` y `ADMIN_PASSWORD` del `.env`. Es idempotente y es el único camino para tener un `ADMIN`.

## 6. Seguridad (alcance académico)

**Se implementa:** hash bcrypt · JWT con expiración · autorización por rol y por dueño en el backend · validación de entrada con Zod · manejo centralizado de errores · consultas mediante Prisma · CORS limitado al origen del frontend · `.env` excluido de Git · el registro siempre asigna `ESTUDIANTE` · primer admin creado por seed.

**Quedaría pendiente para producción:** HTTPS, rate limiting en login, revocación de tokens/refresh tokens, rotación de secretos, logs de auditoría, cabeceras de seguridad (helmet), recuperación de contraseña.

## 7. Puntos de extensión

- Nuevo módulo → carpeta en `src/modules/<nombre>/` + una línea en `app.ts`.
- Nuevo modelo → `schema.prisma` + `npx prisma migrate dev --name <descripcion>` (migraciones aditivas).
- Nuevas reglas de permisos → reutilizar `autenticar` y `autorizar(rol)`.

El procedimiento completo para integrar features de la otra parte del equipo estará en `docs/contribucion.md`.
