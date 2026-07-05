# Estilo IA

Estilo IA es una plataforma web para publicar, explorar y vender prendas de vestir. El proyecto incluye categorías para prendas de **hombre**, **mujer** y **unisex**, además de una sección de **recomendación con IA**. Actualmente, la pasarela de pago está pendiente de integración y será manejada como una demo.

## Tecnologías utilizadas

**Backend:**

* Java
* Spring Boot
* Maven

**Frontend:**

* React
* Vite
* npm

## Funcionalidades principales

* Panel informativo inicial de la aplicación.
* Registro de usuario.
* Inicio de sesión.
* Navegación por prendas de hombre, mujer y unisex.
* Sección de recomendación IA.
* Perfil de usuario.
* Publicación de prendas desde el perfil.
* Visualización de prendas vendidas.
* Demo de flujo de compra, sin pasarela de pago real.

## Flujo de la aplicación

1. El usuario ingresa a la plataforma.
2. Visualiza un panel informativo con opciones para iniciar sesión o crear una cuenta.
3. Al ingresar, encuentra una cabecera con las categorías principales.
4. Desde la esquina del perfil puede publicar sus prendas y revisar sus prendas vendidas.
5. La pasarela de pago todavía no está integrada, por lo que el proyecto funciona como demo.

## Cómo levantar el proyecto

Para ejecutar el proyecto, se debe levantar primero el backend y luego el frontend.

### 1. Levantar el backend

Abrir una terminal en la carpeta principal del proyecto:

```bash
cd estilo-ia
```

Ejecutar Spring Boot:

```bash
.\mvnw.cmd spring-boot:run
```

### 2. Levantar el frontend

Abrir otra terminal e ingresar a la carpeta del frontend:

```bash
cd estilo-ia/frontend
```

Instalar dependencias si es la primera vez:

```bash
npm install
```

Ejecutar el frontend:

```bash
npm run dev
```

### 3. Abrir la aplicación

Ingresar desde el navegador al siguiente enlace:

```bash
http://localhost:5173/
```

## Estado del proyecto

El proyecto se encuentra en etapa de desarrollo y demostración.
La parte principal de navegación, autenticación, perfil y publicación de prendas está enfocada en mostrar el funcionamiento de la plataforma. La integración de pagos queda pendiente para una versión futura.

## Autor

**Junior Cueva Fabian**

