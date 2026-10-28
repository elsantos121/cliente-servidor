import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['dist/', 'node_modules/', 'coverage/'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    // cucumber.js es un archivo de configuración CommonJS
    files: ['cucumber.js'],
    languageOptions: { sourceType: 'commonjs', globals: { module: 'writable' } },
  },
  {
    rules: {
      // Los parámetros que empiezan con "_" se usan a propósito como "no utilizado"
      // (por ejemplo, el cuarto parámetro obligatorio del manejador de errores de Express).
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    },
  },
);
