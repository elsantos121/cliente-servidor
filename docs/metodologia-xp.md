# Programación Extrema (XP) en el proyecto

Cada práctica de XP con cómo se aplicó y la **evidencia verificable** en el repositorio. Los hashes son de `develop`; se pueden revisar con `git show <hash>`.

## Resumen

| Práctica | Evidencia principal |
|---|---|
| Juego de planificación | [historias-usuario.md](historias-usuario.md): 7 historias priorizadas y ordenadas por dependencias |
| Cliente presente | La consigna: el otro grupo actúa como cliente; criterios de aceptación como contrato |
| Entregas pequeñas | 7 iteraciones, una historia por pull request (#1, #7, #8, #9 y anteriores) |
| Desarrollo guiado por pruebas | 31 commits `test(...)`, siempre antes que su `feat(...)` |
| Pruebas de aceptación (BDD) | 9 archivos `.feature` en español, 53 escenarios |
| Refactorización | 7 commits `refactor(...)`, uno por historia, con la suite en verde |
| Diseño simple | Sin capa repository; un único punto de registro de módulos |
| Integración continua | `.github/workflows/ci.yml` en cada push y pull request |
| Estándares de código | TypeScript estricto, ESLint, convención de commits y nombres en español |
| Propiedad colectiva | Módulos con la misma estructura; guía de contribución para el otro grupo |
| Programación en pareja | Trabajo en pareja persona + asistente, con revisión en cada pull request |
| Ritmo sostenible | Iteraciones cortas con un criterio de terminado común |

## Juego de planificación

- Las funcionalidades se escribieron como **historias de usuario** (*Como…, quiero…, para…*) con criterios de aceptación medibles (códigos HTTP, validaciones, permisos): [historias-usuario.md](historias-usuario.md).
- Se priorizaron (Alta / Media) y se **ordenaron por dependencias**. HU-06 era demasiado grande y se dividió en HU-06a (categorías, necesaria antes de publicar) y HU-06b (moderación, después de las denuncias).
- Una **definición de terminado** común para todas las historias (escenarios Gherkin, pruebas de servicio y endpoint, ciclo RED → GREEN → REFACTOR en commits, CI, endpoints documentados, pantalla funcionando, pull request).

## Cliente presente

- La consigna organiza dos grupos: uno es el **cliente** que hace los requerimientos.
- Los criterios de aceptación son el contrato con el cliente; cada uno tiene su escenario en `backend/features/`, legible sin saber programar.
- Las features nuevas del cliente entran por el procedimiento de [contribucion.md](contribucion.md).

## Entregas pequeñas

- Siete iteraciones, **una historia por iteración**, cada una terminada con API, pantalla y pruebas en verde (fase 3 en [testing.md](testing.md)).
- Una rama `feature/HU-xx-…` y un pull request por historia; cada PR se podía probar por separado.
- `develop` recibe cada historia; `main` recibe solo lo integrado y verificado.

## Desarrollo guiado por pruebas (TDD)

El ciclo quedó **visible en el historial de Git**: cada paso es un commit.

| Paso | Ejemplo (HU-01) | Qué demuestra |
|---|---|---|
| Gherkin que falla | `4213c7a` test(HU-01): escenarios BDD de registro | el criterio se escribe antes del código |
| RED | `4b0df5d` test(HU-01): servicio de registro… (RED) | la prueba falla: `Cannot find module …auth.service` |
| GREEN | `2e51ce4` feat(HU-01): modelo Usuario, migracion y servicio (GREEN) | código mínimo para pasar |
| REFACTOR | `6ba1b29` refactor(HU-01): tipar el registro desde el esquema Zod… | mejora sin cambiar el comportamiento |

- En las 7 historias el orden de los commits es el mismo: `test` (Gherkin) → `test` (RED servicio) → `feat` (GREEN) → `test` (RED endpoint) → `feat` (GREEN) → `test` (pasos de Cucumber) → `refactor` → `feat` (pantalla) → `docs`. Se puede ver con `git log --reverse --format=%s | grep "(HU-03)"`. La salida real de cada fallo y de cada paso a verde está registrada en [testing.md](testing.md).
- Las pantallas de Angular se entregaron en un commit junto con su prueba de componente, sin un commit RED separado; en la fase 4 sí se hizo RED → GREEN también en el frontend (`8343f4c` → `a6444ca`).
- Las pruebas también encontraron errores reales: en HU-06a, una prueba de concurrencia falló contra el código anterior (dos registros iguales simultáneos daban 500) y el refactor `6180a3f` lo corrigió. En la fase 4, dos hallazgos de integración se reprodujeron primero con pruebas (`8343f4c`, RED) y luego se corrigieron (`a6444ca`, GREEN).

## Pruebas de aceptación (BDD)

- 9 archivos `.feature` escritos en español con Cucumber (`# language: es`), uno por historia más `salud.feature` e `integracion.feature`.
- Corren contra la API real y la base de pruebas, no contra simulaciones.
- `integracion.feature` (`23e84ef`) recorre las siete historias de punta a punta reutilizando los pasos existentes: si un cambio en una historia rompe otra, falla.

## Refactorización

Un refactor por historia, siempre con toda la suite en verde antes y después:

| Commit | Qué mejoró |
|---|---|
| `6ba1b29` HU-01 | tipos del registro derivados del esquema Zod; campos públicos del usuario en un solo lugar |
| `95716e3` HU-02 | `firmarToken` extraído; login tipado desde el esquema |
| `6180a3f` HU-06a | duplicados detectados por la restricción `UNIQUE` (corrige una condición de carrera) |
| `618909b` HU-03 | costo de bcrypt configurable: pruebas de 64 s a 27 s |
| `e09c6f7` HU-04 | helper de los pasos de Cucumber que estaba copiado en tres archivos |
| `6ec7b26` HU-05 | `traducirErrorPrisma()` reemplaza el mismo `try/catch` repetido en cinco servicios |
| `191dcc3` HU-06b | cambio de estado de un reporte en una sola consulta |

## Diseño simple

- Sin capa *repository*: Prisma ya es la capa de datos y los servicios la usan directamente ([arquitectura.md](arquitectura.md)).
- Todos los módulos tienen la misma estructura (rutas, controlador, servicio, esquemas) y se registran en un único lugar: `backend/src/app.ts`.
- Se descartó lo que la v1 no necesitaba (Docker, refresh tokens, cluster), documentado en las [limitaciones del README](../README.md#limitaciones).
- Los modelos de datos se agregaron **uno por historia**, cada uno con su migración (5 migraciones en `backend/prisma/migrations/`).

## Integración continua

- `.github/workflows/ci.yml` (`9922042`) corre en cada push y pull request a `develop` y `main`: backend con PostgreSQL efímero (migraciones, typecheck, lint, Vitest, Cucumber, build) y frontend (pruebas y build).
- La primera ejecución en GitHub dio los mismos números que en local (155 + 53 escenarios + 72).
- Regla del equipo: no se integra a `main` con el CI en rojo (cómo hacerla cumplir: [testing.md](testing.md#integración-continua-github-actions)).

## Estándares de código

- TypeScript en modo estricto en backend y frontend; ESLint en el backend (`npm run lint`, también en el CI).
- Convención de commits: `test(HU-xx)`, `feat(HU-xx)`, `refactor(HU-xx)`, `docs(HU-xx)`, `fix`, `ci`, `chore`.
- Nombres de dominio en español en todo el código (`publicaciones`, `crearCategoria`, `requiereSesion`), igual que la documentación.
- Formato de error uniforme en toda la API: `{ "error": { "codigo", "mensaje", "detalles"? } }`.

## Propiedad colectiva del código

- La misma estructura en cada módulo hace que cualquiera pueda cambiar cualquiera; las piezas comunes (`autenticar`, `autorizar`, `validar`, `traducirErrorPrisma`, `requiereSesion`) están listadas en [contribucion.md](contribucion.md).
- La suite completa protege los módulos ajenos: un cambio que rompe otro módulo no pasa el CI.

## Programación en pareja

- El desarrollo se hizo en pareja entre una persona del equipo y un asistente de programación: uno escribía pruebas y código, el otro decidía el alcance, ejecutaba, revisaba y aprobaba cada integración.
- Cada historia se revisó en su pull request antes de integrarse.

## Ritmo sostenible

- Iteraciones cortas y de tamaño parecido, con el mismo criterio de terminado, en lugar de una entrega grande al final.
- Lo que no entraba en la v1 se anotó como feature futura ([contribucion.md](contribucion.md#features-futuras-ya-anotadas)) en lugar de forzarlo.
