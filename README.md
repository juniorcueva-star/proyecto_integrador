# Estilo IA

Marketplace web de moda circular para publicar, vender, intercambiar y comprar prendas. Usa Firebase para usuarios, catalogo, imagenes, comprobantes y reclamos.

## Tecnologias

- React + Vite
- Firebase Auth
- Firestore
- Firebase Storage
- Spring Boot + Java 21
- OpenAI/Gemini opcional para funciones IA desde backend

## Requisitos

- Node.js 20+
- npm
- Java 21
- Git
- Cuenta/proyecto Firebase con Auth, Firestore y Storage activos

## Clonar

```bash
git clone URL_DEL_REPOSITORIO
cd "PROYECTO INTEGRADOR"
```

## Configurar frontend

Crear:

```bash
frontend/.env.local
```

Plantilla:

```env
VITE_PRODUCTS_DATA_SOURCE=firebase
VITE_AUTH_SOURCE=firebase
VITE_FIREBASE_API_KEY=TU_API_KEY
VITE_FIREBASE_AUTH_DOMAIN=TU_PROJECT_ID.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=TU_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET=TU_PROJECT_ID.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=TU_MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID=TU_APP_ID
VITE_BACKEND_URL=http://localhost:8080
```

## Ejecutar frontend

```bash
cd frontend
npm install
npm run dev
```

Abrir:

```bash
http://localhost:5173
```

## Backend IA opcional

Solo es necesario si se probaran funciones IA desde servidor.

Crear:

```bash
estilo-ia/application-secrets.properties
```

OpenAI:

```properties
app.ai.provider=openai
app.ai.api-key=TU_OPENAI_API_KEY
app.ai.model=gpt-4.1-mini
```

Gemini:

```properties
app.ai.provider=gemini
app.ai.api-key=TU_GEMINI_API_KEY
app.ai.model=gemini-2.5-flash
```

Ejecutar:

```bash
cd estilo-ia
.\mvnw.cmd spring-boot:run
```

Backend:

```bash
http://localhost:8080
```

## Firebase reglas

Si se necesita desplegar reglas:

```bash
firebase login
firebase use TU_PROJECT_ID
firebase deploy --only firestore,storage
```

## Admin

Crear una cuenta normal y en Firestore cambiar en `usuarios`:

```txt
rol = ROLE_ADMIN
```

Cerrar sesion y volver a ingresar.

## No subir a GitHub

- `.env.local`
- `application-secrets.properties`
- claves API
- `node_modules`
- `dist`
- `target`
- `uploads`

## Autor

Junior Cueva Fabian
