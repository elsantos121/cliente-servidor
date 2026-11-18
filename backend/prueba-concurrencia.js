// prueba-concurrencia.js
const BASE = 'http://localhost:3000';

async function login() {
  const res = await fetch(`${BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'admin@uni.edu',
      password: 'cambiar-esta-clave'
    })
  });
  const data = await res.json();
  return data.token;
}

async function probarLectura(n = 100) {
  const inicio = Date.now();
  const promesas = Array.from({ length: n }, () =>
    fetch(`${BASE}/api/publicaciones`).then(r => r.status)
  );
  const estados = await Promise.all(promesas);
  const duracion = Date.now() - inicio;
  const ok = estados.filter(s => s === 200).length;
  console.log(`Lectura: ${ok}/${n} exitosas, ${duracion} ms total`);
}

async function probarEscritura(token, n = 100) {
  const inicio = Date.now();
  const promesas = Array.from({ length: n }, (_, i) =>
    fetch(`${BASE}/api/publicaciones`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        titulo: `Prueba ${i}`,
        contenido: `Contenido ${i}`,
        categoriaId: 1
      })
    }).then(r => r.status)
  );
  
  const estados = await Promise.all(promesas);
  const duracion = Date.now() - inicio;
  const ok = estados.filter(s => s === 201).length;
  console.log(`Escritura: ${ok}/${n} exitosas, ${duracion} ms total`);
}

async function main() {
  console.log('Iniciando pruebas de concurrencia...');
  await probarLectura(100);
  const token = await login();
  await probarEscritura(token, 100);
}

main().catch(console.error);