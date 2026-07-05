# Estilo IA Backend

Backend auxiliar de Estilo IA construido con Spring Boot.

## Estado actual

- El flujo principal de la aplicación vive en el frontend React.
- La autenticación, la base de datos y el almacenamiento ya funcionan con Firebase.
- Este backend queda como apoyo opcional para pruebas locales y servicios auxiliares.

## Tecnologías

- Java 21+
- Spring Boot
- Spring Security
- Spring Data JPA
- H2
- Maven

## Ejecución local

```bash
.\mvnw.cmd spring-boot:run
```

## Notas

- Ya no requiere XAMPP ni MySQL.
- Usa H2 local por defecto.
- Si no vas a usar servicios Spring, puedes trabajar solo con la carpeta `frontend`.
