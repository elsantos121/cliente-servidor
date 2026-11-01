# Instalación y configuración en Windows (PowerShell)

> Todos los comandos se ejecutan en la terminal de PowerShell de VS Code, desde la carpeta del repositorio.

## 1. Requisitos previos

```powershell
node -v      # Node.js 22 (el equipo y el CI usan 22.18.0; mínimo 20.19)
npm -v
git --version
```

PostgreSQL: **pgAdmin** es el programa visual de administración; el **servidor** PostgreSQL se instala junto a él con el instalador oficial. Para comprobar que el servidor está corriendo:

```powershell
Get-Service *postgres*     # debe aparecer con Status "Running"
```

## 2. Crear las bases de datos

En pgAdmin: *Servers → PostgreSQL → Databases → clic derecho → Create → Database…* y crear dos bases:

| Base | Uso |
|---|---|
| `foro_dev` | desarrollo (datos de prueba manuales y seed) |
| `foro_test` | pruebas automáticas (se vacía en cada ejecución) |

## 3. Variables de entorno del backend

```powershell
cd backend
Copy-Item .env.example .env
Copy-Item .env.example .env.test
```

En **`.env`** (desarrollo):

| Variable | Qué poner |
|---|---|
| `DATABASE_URL` | reemplazar `TU_PASSWORD` por la contraseña del usuario `postgres`; base `foro_dev` |
| `JWT_SECRET` | un texto aleatorio de **al menos 16 caracteres** (la API no arranca con uno más corto) |
| `ADMIN_NOMBRE`, `ADMIN_EMAIL`, `ADMIN_PASSWORD` | datos del administrador inicial que crea el seed (contraseña de 8 a 72 caracteres) |

En **`.env.test`** (pruebas):

| Variable | Qué poner |
|---|---|
| `DATABASE_URL` | igual que en `.env`, pero con la base **`foro_test`**. Las pruebas se niegan a correr si el nombre no termina en `_test` |
| `JWT_SECRET` | otro texto aleatorio de al menos 16 caracteres |
| `BCRYPT_COSTO` | `4` (opcional): hace que las pruebas tarden menos de la mitad. Sin la variable se usa 10 |

Para generar un secreto aleatorio:

```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Si la contraseña de PostgreSQL tiene caracteres especiales (`@`, `#`, `/`, `:`), deben codificarse en la URL (por ejemplo `@` → `%40`). Ninguno de estos archivos se sube a Git (están en `.gitignore`).

## 4. Backend: instalar, migrar y crear el administrador

```powershell
cd backend
npm install
npx prisma migrate deploy     # crea las tablas en foro_dev
npm run prisma:seed           # crea (o actualiza) el administrador del .env
```

Verificación completa (usa la base `foro_test`):

```powershell
npm run typecheck
npm run lint
npm test
npm run test:bdd
npm run build
```

## 5. Frontend: instalar y verificar

```powershell
cd ..\frontend
npm install
npx ng test --watch=false
npx ng build
```

## 6. Ejecutar la aplicación

Dos terminales:

```powershell
# Terminal 1
cd backend
npm run dev                   # API en http://localhost:3000

# Terminal 2
cd frontend
npm start                     # frontend en http://localhost:4200
```

Comprobaciones:

```powershell
Invoke-RestMethod http://localhost:3000/api/salud    # -> estado: ok
```

En http://localhost:4200: crear una cuenta en "Crear cuenta", o iniciar sesión con el administrador del `.env` para ver los enlaces "Categorías" y "Reportes". Antes de que un estudiante pueda publicar, el administrador tiene que crear al menos una categoría.

## Problemas frecuentes

| Síntoma | Causa y solución |
|---|---|
| `Se canceló la ejecución: la base "…" no termina en "_test"` | `.env.test` apunta a otra base: corregir `DATABASE_URL` |
| `Configuración inválida: JWT_SECRET: debe tener al menos 16 caracteres` | `JWT_SECRET` falta o es corto en `.env` o `.env.test` |
| `Configurar en .env para el seed: ADMIN_EMAIL, ADMIN_PASSWORD` | faltan las variables del administrador en `.env` |
| El frontend muestra "No se pudo conectar con el servidor" | la API no está corriendo (`npm run dev` en `backend`) |
| `Can't reach database server` | el servicio de PostgreSQL está detenido (`Get-Service *postgres*`) |
| Errores de memoria al compilar o al correr Prisma | cerrar programas que no se usen; el equipo lo encontró con menos de 1 GB de memoria virtual libre |
