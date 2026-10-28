import 'dotenv/config';
import { crearApp } from './app';
import { leerEnv } from './config/env';

const { PORT } = leerEnv();

crearApp().listen(PORT, () => {
  console.log(`API del foro escuchando en http://localhost:${PORT}`);
});
