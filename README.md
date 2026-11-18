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
| Concurrencia | PM2 en modo cluster (procesos worker) |
| Contenedor | Docker + Docker Compose |

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