# Prueba de Concurrencia y Procesamiento Paralelo

Este documento detalla la prueba de carga realizada sobre la API REST para verificar el comportamiento bajo alta concurrencia, cumpliendo con los requerimientos del cliente.

## Entorno de Prueba
- **Backend:** Node.js 22 + Express 5 (ejecutado localmente).
- **Base de Datos:** PostgreSQL 16 (alojada en Neon Serverless).
- **Herramienta de prueba:** Script propio en Node.js (`prueba-concurrencia.js`) utilizando `Promise.all` para disparar peticiones HTTP simultáneas.
- **Concurrencia:** 100 solicitudes simultáneas por escenario.

## Resultados Observados

| Escenario | Endpoint | Solicitudes | Exitosas | Errores | Tiempo Total |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Lectura (GET)** | `/api/publicaciones` | 100 | 100 | 0 | 9439 ms |
| **Escritura (POST)** | `/api/publicaciones` | 100 | 100 | 0 | 9196 ms |

*Nota: El tiempo elevado se debe a la latencia de red hacia la base de datos en la nube (Neon). Aun así, la tasa de éxito fue del 100%.*

## Cómo se escala (Diseño para Producción)
El backend está diseñado bajo el principio **stateless** (sin estado), utilizando JWT para la autenticación. Esto permite escalar horizontalmente sin problemas. 

Para el entorno de producción o contenedores, se incluye el archivo `ecosystem.config.js` para **PM2**, el cual permite levantar la API en modo **cluster** (`instances: "max"`). 
- En modo cluster, PM2 levanta un proceso worker por cada núcleo de CPU disponible.
- Todos los workers comparten el mismo puerto (3000).
- Al no compartir estado en memoria, cualquier worker puede atender cualquier petición de cualquier usuario.
- Las restricciones `UNIQUE` a nivel de base de datos garantizan la integridad incluso si dos workers procesan una inserción simultánea.

## Evidencia de Integridad
El script de prueba también validó que las restricciones de la base de datos funcionan correctamente ante peticiones concurrentes. La suite de pruebas automatizadas (`duplicados.concurrentes.test.ts`) también cubre este escenario.