# Foro universitario — cliente-servidor

[![CI](https://github.com/elsantos121/cliente-servidor/actions/workflows/ci.yml/badge.svg?branch=develop)](https://github.com/elsantos121/cliente-servidor/actions/workflows/ci.yml)

Foro para estudiantes universitarios: publicaciones por categoría, comentarios, denuncias y un panel de moderación para administradores. Aplicación cliente-servidor (Angular + API REST en Express + PostgreSQL) construida con **Programación Extrema (XP)**, TDD y BDD.

## Consigna

> 2 grupos, uno trabaja como cliente.
>
> El cliente hace un requerimiento de backend con persistencia, autenticación y autorización y gestión de sesión. El proyecto debe utilizar procesamiento paralelo o multihilos y alta concurrencia.
>
> El producto desarrollado debe estar en contenedor y tener una interface frontend para probar una entidad via api rest.
>
> Aplicar programación extrema.

Qué cubre esta versión y qué no está en [Limitaciones](#limitaciones).

## Funcionalidades

| Historia | Qué permite | Quién |
|---|---|---|
| HU-01 Registro | crear una cuenta (siempre con rol `ESTUDIANTE`) | visitante |
| HU-02 Inicio de sesión | entrar con correo y contraseña; la sesión es un JWT con vencimiento | usuario registrado |
| HU-06a Categorías | listar categorías; crearlas | todos / `ADMIN` |
| HU-03 Publicaciones | listar con filtro por categoría y ver el detalle; crear; editar las propias; eliminar las propias (o cualquiera si es `ADMIN`) | todos / autenticado / autor |
| HU-04 Comentarios | leer y escribir comentarios en una publicación | todos / autenticado |
| HU-05 Denuncias | denunciar una publicación una sola vez | autenticado |
| HU-06b Moderación | revisar reportes, marcarlos resueltos o descartados, eliminar la publicación denunciada | `ADMIN` |

El primer administrador se crea con el seed (`npm run prisma:seed`); nadie puede volverse administrador desde la aplicación. Detalle y criterios de aceptación: [docs/historias-usuario.md](docs/historias-usuario.md).

## Arquitectura

```
Navegador (Angular 21)  ──HTTP/JSON + JWT──▶  API REST (Express 5 + TypeScript)  ──Prisma──▶  PostgreSQL
```

- El **frontend** presenta datos y envía solicitudes; ocultar un botón es solo comodidad.
- El **backend** concentra reglas de negocio, validación (Zod) y autorización por rol y por autor.
- **PostgreSQL** asegura integridad con claves foráneas y restricciones `UNIQUE` (los duplicados se detectan en la base, incluso con solicitudes simultáneas).

Cada recurso es un módulo en `backend/src/modules/<nombre>/` (rutas, controlador, servicio, esquemas) registrado en un único lugar: `backend/src/app.ts`. Más detalle: [docs/arquitectura.md](docs/arquitectura.md).

## Tecnologías

| Capa | Tecnología |
|---|---|
| Frontend | Angular 21 (componentes standalone, signals, formularios reactivos), CSS propio, Vitest |
| Backend | Node.js 22, Express 5, TypeScript, Zod, bcryptjs, jsonwebtoken |
| Datos | PostgreSQL 16, Prisma 6 (migraciones versionadas) |
| Pruebas | Vitest + Supertest (unitarias e integración), Cucumber.js en español (BDD) |
| CI | GitHub Actions con PostgreSQL efímero |

## Instalación en Windows

Guía completa paso a paso: [docs/instalacion-windows.md](docs/instalacion-windows.md). Resumen:

1. Instalar Node.js 22 y PostgreSQL; crear las bases `foro_dev` y `foro_test`.
2. En `backend/`, copiar `.env.example` a `.env` y a `.env.test` y completar los valores.
3. Instalar y preparar:

```powershell
cd backend
npm install
npx prisma migrate deploy
npm run prisma:seed      # crea el administrador inicial
cd ..\frontend
npm install
```

## Comandos (PowerShell)

| Dónde | Comando | Para qué |
|---|---|---|
| `backend` | `npm run dev` | API en http://localhost:3000 |
| `frontend` | `npm start` | frontend en http://localhost:4200 |
| `backend` | `npm test` | pruebas unitarias y de integración (base `foro_test`) |
| `backend` | `npm run test:bdd` | escenarios de aceptación (Cucumber) |
| `backend` | `npm run typecheck` · `npm run lint` · `npm run build` | tipos, estilo y compilación |
| `backend` | `npx prisma migrate dev --name <descripcion>` | nueva migración (desarrollo) |
| `backend` | `npm run prisma:seed` | crear o actualizar el administrador |
| `frontend` | `npx ng test --watch=false` · `npx ng build` | pruebas y compilación del frontend |

Las pruebas **se niegan a correr** si la base no termina en `_test`, para no borrar datos de desarrollo.

## API REST

Prefijo `/api`. Errores con formato uniforme: `{ "error": { "codigo", "mensaje", "detalles"? } }`.

| Método | Ruta | Acceso |
|---|---|---|
| POST | `/auth/registro` | público |
| POST | `/auth/login` | público |
| GET | `/usuarios/me` | autenticado |
| GET · POST | `/categorias` | público · `ADMIN` |
| GET | `/publicaciones?categoriaId=` · `/publicaciones/:id` | público |
| POST | `/publicaciones` | autenticado |
| PUT | `/publicaciones/:id` | autor |
| DELETE | `/publicaciones/:id` | autor o `ADMIN` |
| GET · POST | `/publicaciones/:id/comentarios` | público · autenticado |
| POST | `/publicaciones/:id/reportes` | autenticado |
| GET | `/reportes?estado=` | `ADMIN` |
| PATCH | `/reportes/:id` | `ADMIN` |

Cuerpos, respuestas y códigos de error de cada endpoint: [docs/arquitectura.md](docs/arquitectura.md#endpoints-implementados).

## Pruebas y calidad

| Suite | Cantidad | Dónde |
|---|---|---|
| Backend: unitarias e integración | 19 archivos, 155 pruebas | `backend/tests/` |
| Backend: aceptación (BDD) | 53 escenarios, 423 pasos (incluye el flujo completo de punta a punta) | `backend/features/` |
| Frontend: componentes y servicios | 11 archivos, 72 pruebas | `frontend/src/**/*.spec.ts` |

Todas corren en cada push y pull request a `develop` y `main` ([workflow](.github/workflows/ci.yml)). Estrategia y evidencia de cada ciclo RED → GREEN → REFACTOR: [docs/testing.md](docs/testing.md).

## Programación Extrema

Historias de usuario priorizadas, iteraciones cortas (una historia por pull request), TDD con commits separados de RED, GREEN y REFACTOR, BDD con escenarios en español, integración continua y diseño simple. Cada práctica con la evidencia del repositorio que la demuestra: [docs/metodologia-xp.md](docs/metodologia-xp.md).

## Heurísticas

[docs/heuristicas.md](docs/heuristicas.md) — **pendiente**: falta el material de la cátedra con las diez heurísticas.

## Integrar nuevas features

La otra parte del equipo envía features como historias de usuario; el procedimiento (módulos, migraciones, pruebas, ramas y revisión) está en [docs/contribucion.md](docs/contribucion.md).

## Limitaciones

Decisiones tomadas por el equipo para mantener la v1 simple, y lo que queda pendiente:

| Tema | Estado en la v1 |
|---|---|
| Contenedor (Docker) | **No incluido**, por decisión del equipo. La aplicación se instala con Node.js y PostgreSQL locales. |
| Procesamiento paralelo / multihilos / cluster | **No incluido**, por decisión del equipo. La API atiende solicitudes concurrentes con el modelo asincrónico de Node.js (un proceso, E/S no bloqueante) y el pool de conexiones de Prisma; la integridad ante solicitudes simultáneas la aseguran las restricciones de la base (probado en `duplicados.concurrentes.test.ts`). No hay workers ni cluster. |
| Gestión de sesión | Un único JWT con vencimiento (2 h por defecto). Sin refresh tokens ni revocación: al vencer, se vuelve a iniciar sesión. |
| Moderación | Eliminar una publicación borra en cascada sus comentarios y reportes; no queda historial (borrado lógico: posible feature futura). |
| Fuera de alcance | Chat, mensajes privados, notificaciones, archivos adjuntos, votos y reputación. |
| Producción | Faltaría HTTPS, rate limiting en el login, cabeceras de seguridad y rotación de secretos. |
| Versiones | Angular 21 (Angular 22 exige Node 22.22.3+) y Prisma 6 (Prisma 7 trae cambios incompatibles); la CLI de Prisma 6 tiene 3 avisos de `deepmerge-ts` que no afectan a la API. |

## Equipo y flujo de trabajo

- Ramas: `feature/<historia>` desde `develop`; integración a `develop` por pull request con el CI en verde; `develop` llega a `main` al cierre de cada entrega.
- Repositorio: [elsantos121/cliente-servidor](https://github.com/elsantos121/cliente-servidor).
