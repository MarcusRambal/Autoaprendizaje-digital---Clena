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

`services/` contiene el cliente y el contexto de autenticación; `config/`
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
y `ADMIN` llevan a sus respectivos paneles. `STAFF` accede a guías y quizzes,
y `ADMIN` a categorías y funciones administrativas. Los visitantes pueden
consultar ejemplos de guías y un cuestionario sin iniciar sesión; el progreso
requiere una cuenta de usuario público. Los temas de seguridad digital se
incluyen en las guías.

El catálogo y cuestionario públicos son ejemplos locales, no contenido del
servidor, y no guardan progreso. El botón de ayuda dirige a una página que
explica que la solicitud digital todavía no envía ningún aviso. En el panel
del personal, las solicitudes, estadísticas, edición y publicación también
son demostraciones en memoria. Las pantallas de administración de usuarios,
auditoría, privacidad y respaldos indican que aún no están disponibles. No hay
todavía registro de consentimiento ni gestión real de solicitudes de datos.

Las restricciones del frontend no sustituyen la autorización del backend:
los futuros endpoints deben aplicar sus propios controles de roles.

El token de acceso se mantiene en memoria y el refresh token en `sessionStorage`
para recuperar la sesión al recargar la misma pestaña. La renovación rota el
token; evita duplicar una pestaña con sesión activa porque puede copiar el
token y provocar una detección de reutilización. Cerrar sesión elimina los
datos locales, pero **no revoca la sesión en el servidor**, pues el backend
no ofrece todavía un endpoint de cierre de sesión. El almacenamiento accesible
desde JavaScript también es vulnerable a XSS; antes de producción se recomienda
implementar cookies HttpOnly y revocación en el backend.

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
