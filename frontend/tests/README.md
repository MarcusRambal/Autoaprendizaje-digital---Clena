# Datos de prueba del panel

Desde `frontend`, ejecuta `npm run dev` y abre `/tests/control-panel.html` en el servidor de desarrollo.
Esta página aislada carga 26 categorías, 208 guías y 104 quizzes con cinco preguntas cada uno.
Las guías reutilizan los PDF de ejemplo existentes.

Los cambios solo viven en la memoria de la página de prueba: recargar restablece los datos y no afecta
al panel normal ni a una base de datos. Los datos no se incluyen en la compilación de producción.

Ejecuta `npm test` desde `frontend` para comprobar los datos y las reglas de búsqueda. Se requiere
Node.js 22.6 o posterior para ejecutar TypeScript con `--experimental-strip-types`.
