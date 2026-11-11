# CLENA frontend

## Organización por responsabilidad

```text
src/
  auth/                         Inicio de sesión y registro.
  roles/
    public/pages/               Bienvenida, guías, práctica, ayuda y progreso.
    staff/                      Panel del personal, solicitudes y estadísticas.
    admin/pages/                Panel y pantallas administrativas.
  features/content-management/  Prototipo de edición compartido entre categorías y contenido.
  components/                   Navegación y protección de rutas compartidas.
  shared/styles/                Estilos compartidos por los paneles operativos.
```

`services/` contiene los clientes HTTP de autenticación y categorías, además de
la interfaz de aprendizaje público y sus
contratos; `config/`
define la navegación por rol y `types/` los contratos del frontend. Las URL
existentes se mantienen para no romper enlaces. El editor compartido se usa en
modo categorías para `ADMIN` y en modo contenido para `STAFF`.

## Autenticación local

El backend debe estar ejecutándose antes de probar el registro o el inicio de
sesión. Desde `frontend/`, ejecuta `npm run dev`. El servidor de Vite envía
las solicitudes `/api` a `http://127.0.0.1:3000`; para cambiar ese destino,
define `VITE_API_PROXY_TARGET` antes de iniciar Vite.

El cliente usa `/api/v1` por defecto. Opcionalmente, `VITE_API_BASE_URL`
puede indicar otra URL base de la API. En producción, el servidor web debe
redirigir `/api` al backend o se debe configurar esa variable al compilar y
permitir el origen del frontend en CORS.

El registro tiene tres pasos: datos, guía visual para iniciar sesión y
creación de la cuenta. El backend actual no envía correos de verificación.
El registro devuelve una sesión y el usuario entra automáticamente. El backend
asigna `PUBLIC_USER` a los registros públicos. Los roles `PUBLIC_USER`, `STAFF`
y `ADMIN` llevan a sus respectivos paneles. `STAFF` accede a guías y lecciones,
y `ADMIN` a categorías y funciones administrativas. Los visitantes pueden
consultar ejemplos de guías y un cuestionario sin iniciar sesión; el progreso
requiere una cuenta de usuario público. Los temas de seguridad digital se
incluyen en las guías.

El catálogo público de guías y lecciones, el progreso y la solicitud de ayuda
usan datos de demostración en `services/publicLearning.ts`, tras una interfaz
tipada que se puede implementar con el cliente HTTP cuando estén disponibles
los endpoints. No guardan progreso ni envían solicitudes. El aviso de
demostración aparece en cada vista para dejarlo claro. En el panel
del personal, las solicitudes, estadísticas, edición y publicación también
son demostraciones en memoria. El formulario para preparar usuarios y las
acciones de privacidad son demostraciones de frontend; el formulario no crea
cuentas reales ni se persiste el consentimiento. Auditoría y respaldos siguen
sin implementarse.

La administración de categorías consulta y modifica el endpoint `/api/v1/categories`
del backend; listar es público y las operaciones de creación, edición y borrado
requieren una sesión de `ADMIN`. El panel de guías y lecciones permanece en modo
demostración y no persiste cambios.

La administración de usuarios consulta `/api/v1/users` y permite buscar por
correo, filtrar por rol y eliminar cuentas; estas operaciones requieren una
sesión de `ADMIN`. La eliminación de cuentas administradoras está protegida por
el backend.

Las restricciones del frontend no sustituyen la autorización del backend. Los
endpoints de categorías y usuarios aplican sus propios controles de roles.

El token de acceso se mantiene en memoria y el refresh token en `sessionStorage`
para recuperar la sesión al recargar la misma pestaña. La renovación rota el
token; evita duplicar una pestaña con sesión activa porque puede copiar el
token y provocar una detección de reutilización. Cerrar sesión elimina los
datos locales y envía el refresh token al backend para revocar la familia de
sesiones del dispositivo; si ya estaba revocado, igualmente se cierra la sesión
local. Los access tokens ya emitidos son stateless y pueden seguir utilizándose
hasta vencer (15 minutos por defecto). El almacenamiento accesible desde
JavaScript también es vulnerable a XSS; antes de producción se recomienda
evaluar cookies HttpOnly y protección CSRF.

Para comprobar los cambios: `npm test` y `npm run build`.

## Plantilla React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is enabled on this template. See [this documentation](https://react.dev/learn/react-compiler) for more information.

Note: This will impact Vite dev & build performances.
You can also try [the experimental native React Compiler support in plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react/README.md#rust-react-compiler) by using `compiler: true` in the plugin options instead of using the Babel plugin.

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])

```

You can also install [eslint-plugin-react-x](https://npmx.dev/package/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://npmx.dev/package/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])

```
