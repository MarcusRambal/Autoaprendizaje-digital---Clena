# Datos de prueba del panel

Desde `frontend`, ejecuta `npm run dev` y abre `/tests/control-panel.html` en el servidor de desarrollo.
Esta página aislada carga 26 categorías, 208 guías y 104 lecciones con cinco preguntas cada una.
Las guías reutilizan los PDF de ejemplo existentes.

Los cambios solo viven en la memoria de la página de prueba: recargar restablece los datos y no afecta
al panel normal ni a una base de datos. Los datos no se incluyen en la compilación de producción.

La gestión muestra hasta seis elementos por página; la búsqueda se aplica en todas las vistas.
Las lecciones admiten de una a ocho preguntas, cada una con cuatro opciones y una respuesta correcta.
Los cambios del editor se aplican al confirmar y se descartan al cancelar.

Ejecuta `npm test` desde `frontend` para comprobar los datos y las reglas de búsqueda. Se requiere
Node.js 22.6 o posterior para ejecutar TypeScript con `--experimental-strip-types`.

## Administración y privacidad

Las categorías y la creación de usuarios del panel son demostraciones locales; las contraseñas
del formulario de usuarios no se almacenan y no se crean cuentas reales. El registro comprueba
la aceptación en el navegador, pero todavía no conserva evidencia de consentimiento en el servidor.
La eliminación de la cuenta propia permanece deshabilitada hasta que exista una integración real.
Estos elementos no constituyen por sí solos cumplimiento de la Ley 1581 de 2012.
