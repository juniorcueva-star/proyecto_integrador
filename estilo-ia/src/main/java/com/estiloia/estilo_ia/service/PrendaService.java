package com.estiloia.estilo_ia.service;

import com.estiloia.estilo_ia.dto.PrendaRequest;
import com.estiloia.estilo_ia.dto.PrendaResponse;
import com.estiloia.estilo_ia.dto.PrendaResumenResponse;
import com.estiloia.estilo_ia.entity.Prenda;
import com.estiloia.estilo_ia.entity.Usuario;
import com.estiloia.estilo_ia.enums.CategoriaPrenda;
import com.estiloia.estilo_ia.enums.EstadoPublicacion;
import com.estiloia.estilo_ia.enums.*;
import com.estiloia.estilo_ia.repository.PrendaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.util.Comparator;
import java.util.List;

@Service
@RequiredArgsConstructor
public class PrendaService {

    private final PrendaRepository prendaRepository;
    private final ImagenService imagenService;

    public PrendaResponse crearPrenda(PrendaRequest request, Usuario usuario) {
        validarPrecio(request.precio());
        Prenda prenda = construirPrenda(request, usuario, request.imagenUrl());
        return PrendaResponse.desdeEntidad(prendaRepository.save(prenda));
    }

    public PrendaResponse crearPrendaConImagen(
            String nombre,
            String descripcion,
            String marca,
            String color,
            TallaPrenda talla,
            CategoriaPrenda categoria,
            EstadoFisicoPrenda estadoFisico,
            BigDecimal precio,
            TipoPublicacion tipoPublicacion,
            String contacto,
            MultipartFile imagen,
            Usuario usuario
    ) {
        validarPrecio(precio);
        String imagenUrl = imagenService.guardarImagen(imagen);

        PrendaRequest request = new PrendaRequest(
                nombre,
                descripcion,
                marca,
                color,
                talla,
                categoria,
                estadoFisico,
                precio,
                tipoPublicacion,
                contacto,
                imagenUrl
        );

        Prenda prenda = construirPrenda(request, usuario, imagenUrl);
        return PrendaResponse.desdeEntidad(prendaRepository.save(prenda));
    }

    public List<PrendaResumenResponse> listarMisPrendas(Usuario usuario) {
        return prendaRepository.findByUsuarioAndEliminadoFalse(usuario)
                .stream()
                .sorted(Comparator.comparing(Prenda::getFechaPublicacion).reversed())
                .map(PrendaResumenResponse::desdeEntidad)
                .toList();
    }

    public PrendaResponse obtenerMiPrenda(Long id, Usuario usuario) {
        return PrendaResponse.desdeEntidad(obtenerPrendaPropia(id, usuario));
    }

    public PrendaResponse editarPrenda(Long id, PrendaRequest request, Usuario usuario) {
        Prenda prenda = obtenerPrendaPropia(id, usuario);
        validarPrecio(request.precio());

        prenda.setNombre(request.nombre());
        prenda.setDescripcion(request.descripcion());
        prenda.setMarca(request.marca());
        prenda.setColor(request.color());
        prenda.setTalla(request.talla());
        prenda.setCategoria(request.categoria());
        prenda.setEstadoFisico(request.estadoFisico());
        prenda.setPrecio(request.precio());
        prenda.setTipoPublicacion(request.tipoPublicacion());
        prenda.setContacto(request.contacto());

        if (request.imagenUrl() != null && !request.imagenUrl().isBlank()) {
            prenda.setImagenUrl(request.imagenUrl());
        }

        return PrendaResponse.desdeEntidad(prendaRepository.save(prenda));
    }

    public PrendaResponse actualizarImagen(Long id, MultipartFile imagen, Usuario usuario) {
        Prenda prenda = obtenerPrendaPropia(id, usuario);
        String imagenUrl = imagenService.guardarImagen(imagen);

        prenda.setImagenUrl(imagenUrl);

        return PrendaResponse.desdeEntidad(prendaRepository.save(prenda));
    }

    public void eliminarPrenda(Long id, Usuario usuario) {
        Prenda prenda = obtenerPrendaPropia(id, usuario);
        prenda.setEliminado(true);
        prenda.setEstadoPublicacion(EstadoPublicacion.ELIMINADA);
        prendaRepository.save(prenda);
    }

    public PrendaResponse marcarComoVendida(Long id, Usuario usuario) {
        Prenda prenda = obtenerPrendaPropia(id, usuario);
        prenda.setEstadoPublicacion(EstadoPublicacion.VENDIDA);
        return PrendaResponse.desdeEntidad(prendaRepository.save(prenda));
    }

    public PrendaResponse marcarComoIntercambiada(Long id, Usuario usuario) {
        Prenda prenda = obtenerPrendaPropia(id, usuario);
        prenda.setEstadoPublicacion(EstadoPublicacion.INTERCAMBIADA);
        return PrendaResponse.desdeEntidad(prendaRepository.save(prenda));
    }

    public PrendaResponse pausarPrenda(Long id, Usuario usuario) {
        Prenda prenda = obtenerPrendaPropia(id, usuario);
        prenda.setEstadoPublicacion(EstadoPublicacion.PAUSADA);
        return PrendaResponse.desdeEntidad(prendaRepository.save(prenda));
    }

    public PrendaResponse volverAPublicar(Long id, Usuario usuario) {
        Prenda prenda = obtenerPrendaPropia(id, usuario);
        prenda.setEstadoPublicacion(EstadoPublicacion.PUBLICADA);
        return PrendaResponse.desdeEntidad(prendaRepository.save(prenda));
    }

    public List<PrendaResumenResponse> listarPrendasPublicadas() {
        return prendaRepository.findByEstadoPublicacionAndEliminadoFalse(EstadoPublicacion.PUBLICADA)
                .stream()
                .sorted(Comparator.comparing(Prenda::getFechaPublicacion).reversed())
                .map(PrendaResumenResponse::desdeEntidad)
                .toList();
    }

    public List<PrendaResumenResponse> buscarCatalogo(
            String texto,
            CategoriaPrenda categoria,
            BigDecimal precioMinimo,
            BigDecimal precioMaximo
    ) {
        validarRangoPrecios(precioMinimo, precioMaximo);
        BigDecimal min = precioMinimo != null ? precioMinimo : BigDecimal.ZERO;
        BigDecimal max = precioMaximo != null ? precioMaximo : new BigDecimal("999999.99");

        List<Prenda> prendas;

        if (categoria != null) {
            prendas = prendaRepository.findByCategoriaAndPrecioBetweenAndEstadoPublicacionAndEliminadoFalse(
                    categoria,
                    min,
                    max,
                    EstadoPublicacion.PUBLICADA
            );
        } else {
            prendas = prendaRepository.findByPrecioBetweenAndEstadoPublicacionAndEliminadoFalse(
                    min,
                    max,
                    EstadoPublicacion.PUBLICADA
            );
        }

        if (texto != null && !texto.isBlank()) {
            String busqueda = texto.toLowerCase();

            prendas = prendas.stream()
                    .filter(prenda ->
                            prenda.getNombre().toLowerCase().contains(busqueda)
                                    || prenda.getMarca().toLowerCase().contains(busqueda)
                                    || prenda.getDescripcion().toLowerCase().contains(busqueda)
                    )
                    .toList();
        }

        return prendas.stream()
                .sorted(Comparator.comparing(Prenda::getFechaPublicacion).reversed())
                .map(PrendaResumenResponse::desdeEntidad)
                .toList();
    }

    public PrendaResponse obtenerDetalle(Long id) {
        Prenda prenda = prendaRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Prenda no encontrada"));

        if (Boolean.TRUE.equals(prenda.getEliminado())) {
            throw new IllegalStateException("La prenda fue eliminada");
        }

        return PrendaResponse.desdeEntidad(prenda);
    }

    private Prenda construirPrenda(PrendaRequest request, Usuario usuario, String imagenUrl) {
        return Prenda.builder()
                .nombre(request.nombre())
                .descripcion(request.descripcion())
                .marca(request.marca())
                .color(request.color())
                .talla(request.talla())
                .categoria(request.categoria())
                .estadoFisico(request.estadoFisico())
                .precio(request.precio())
                .tipoPublicacion(request.tipoPublicacion())
                .estadoPublicacion(EstadoPublicacion.PUBLICADA)
                .contacto(request.contacto())
                .imagenUrl(imagenUrl)
                .usuario(usuario)
                .eliminado(false)
                .build();
    }

    private void validarPrecio(BigDecimal precio) {
        if (precio == null) {
            throw new IllegalArgumentException("El precio es obligatorio");
        }

        if (precio.compareTo(BigDecimal.ZERO) < 0) {
            throw new IllegalArgumentException("El precio no puede ser negativo");
        }
    }

    private void validarRangoPrecios(BigDecimal precioMinimo, BigDecimal precioMaximo) {
        if (precioMinimo != null && precioMinimo.compareTo(BigDecimal.ZERO) < 0) {
            throw new IllegalArgumentException("El precio minimo no puede ser negativo");
        }

        if (precioMaximo != null && precioMaximo.compareTo(BigDecimal.ZERO) < 0) {
            throw new IllegalArgumentException("El precio maximo no puede ser negativo");
        }

        if (precioMinimo != null && precioMaximo != null && precioMinimo.compareTo(precioMaximo) > 0) {
            throw new IllegalArgumentException("El precio minimo no puede ser mayor que el precio maximo");
        }
    }

    private Prenda obtenerPrendaPropia(Long id, Usuario usuario) {
        Prenda prenda = prendaRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Prenda no encontrada"));

        if (Boolean.TRUE.equals(prenda.getEliminado())) {
            throw new IllegalStateException("La prenda fue eliminada");
        }

        if (!prenda.getUsuario().getId().equals(usuario.getId())) {
            throw new SecurityException("No puedes modificar una prenda que no te pertenece");
        }

        return prenda;
    }
}
