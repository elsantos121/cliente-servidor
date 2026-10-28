// Configuración de Cucumber.js (pruebas de aceptación BDD).
// Los .feature están en español (# language: es) y los pasos en TypeScript, ejecutados con tsx.
module.exports = {
  default: {
    paths: ['features/**/*.feature'],
    requireModule: ['tsx/cjs'],
    require: ['features/support/**/*.ts', 'features/step_definitions/**/*.ts'],
    format: ['progress-bar', 'summary'],
  },
};
