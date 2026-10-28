# Instalación y configuración en Windows (PowerShell)

> Todos los comandos se ejecutan en la terminal de PowerShell de VS Code, desde la carpeta del repositorio.

## 1. Requisitos previos

```powershell
node -v      # se requiere Node.js 20.19 o superior (recomendado 22 LTS)
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

- En **`.env`**: reemplazar `TU_PASSWORD` por la contraseña del usuario `postgres` (la que se eligió al instalar PostgreSQL).
- En **`.env.test`**: lo mismo, y cambiar `foro_dev` por **`foro_test`** en `DATABASE_URL`. Las pruebas se niegan a correr si la base no termina en `_test`.
- Si la contraseña tiene caracteres especiales (`@`, `#`, `/`, `:`), deben codificarse en la URL (por ejemplo `@` → `%40`).

Ninguno de estos archivos se sube a Git (están en `.gitignore`).

## 4. Instalar dependencias y verificar

```powershell
npm install
npx prisma generate
npm run typecheck
npm run lint
npm test
npm run test:bdd
npm run build
```

## 5. Ejecutar la API en desarrollo

```powershell
npm run dev
# En otra terminal:
Invoke-RestMethod http://localhost:3000/api/salud    # -> estado: ok
```
