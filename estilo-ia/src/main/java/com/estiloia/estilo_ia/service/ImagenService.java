package com.estiloia.estilo_ia.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.UUID;

@Service
public class ImagenService {

    @Value("${app.upload.dir}")
    private String uploadDir;

    public String guardarImagen(MultipartFile archivo) {
        if (archivo == null || archivo.isEmpty()) {
            throw new IllegalArgumentException("La imagen es obligatoria");
        }

        String contentType = archivo.getContentType();

        if (!esImagenPermitida(contentType)) {
            throw new IllegalArgumentException("Solo se permiten imagenes PNG, JPG, JPEG o WEBP");
        }

        try {
            Path carpeta = Paths.get(uploadDir).toAbsolutePath().normalize();
            Files.createDirectories(carpeta);

            String nombreOriginal = archivo.getOriginalFilename();
            String extension = obtenerExtension(nombreOriginal);
            String nombreArchivo = UUID.randomUUID() + extension;

            Path destino = carpeta.resolve(nombreArchivo);
            archivo.transferTo(destino.toFile());

            return "/uploads/" + nombreArchivo;

        } catch (IOException e) {
            throw new RuntimeException("Error al guardar la imagen");
        }
    }

    private String obtenerExtension(String nombreArchivo) {
        if (nombreArchivo == null || !nombreArchivo.contains(".")) {
            return ".png";
        }

        String extension = nombreArchivo.substring(nombreArchivo.lastIndexOf(".")).toLowerCase();
        if (List.of(".png", ".jpg", ".jpeg", ".webp").contains(extension)) {
            return extension;
        }

        return ".png";
    }

    private boolean esImagenPermitida(String contentType) {
        return contentType != null && (
                contentType.equalsIgnoreCase("image/png")
                        || contentType.equalsIgnoreCase("image/jpeg")
                        || contentType.equalsIgnoreCase("image/jpg")
                        || contentType.equalsIgnoreCase("image/webp")
        );
    }
}
