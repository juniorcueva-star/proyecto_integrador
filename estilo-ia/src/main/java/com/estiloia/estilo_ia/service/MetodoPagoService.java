package com.estiloia.estilo_ia.service;

import com.estiloia.estilo_ia.dto.MetodoPagoRequest;
import com.estiloia.estilo_ia.dto.MetodoPagoResponse;
import com.estiloia.estilo_ia.entity.MetodoPago;
import com.estiloia.estilo_ia.entity.Usuario;
import com.estiloia.estilo_ia.repository.MetodoPagoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@Service
@RequiredArgsConstructor
public class MetodoPagoService {

    private final MetodoPagoRepository metodoPagoRepository;
    private final ImagenService imagenService;

    public MetodoPagoResponse crearMetodoPago(MetodoPagoRequest request, Usuario usuario) {
        MetodoPago metodoPago = MetodoPago.builder()
                .tipoMetodoPago(request.tipoMetodoPago())
                .numero(request.numero())
                .titular(request.titular())
                .imagenQrUrl(request.imagenQrUrl())
                .instrucciones(request.instrucciones())
                .usuario(usuario)
                .activo(true)
                .build();

        return MetodoPagoResponse.desdeEntidad(metodoPagoRepository.save(metodoPago));
    }

    public MetodoPagoResponse crearMetodoPagoConQr(
            MetodoPagoRequest request,
            MultipartFile imagenQr,
            Usuario usuario
    ) {
        String imagenQrUrl = null;

        if (imagenQr != null && !imagenQr.isEmpty()) {
            imagenQrUrl = imagenService.guardarImagen(imagenQr);
        }

        MetodoPago metodoPago = MetodoPago.builder()
                .tipoMetodoPago(request.tipoMetodoPago())
                .numero(request.numero())
                .titular(request.titular())
                .imagenQrUrl(imagenQrUrl)
                .instrucciones(request.instrucciones())
                .usuario(usuario)
                .activo(true)
                .build();

        return MetodoPagoResponse.desdeEntidad(metodoPagoRepository.save(metodoPago));
    }

    public List<MetodoPagoResponse> listarMisMetodos(Usuario usuario) {
        return metodoPagoRepository.findByUsuario(usuario)
                .stream()
                .map(MetodoPagoResponse::desdeEntidad)
                .toList();
    }

    public List<MetodoPagoResponse> listarMetodosActivosDeUsuario(Usuario usuario) {
        return metodoPagoRepository.findByUsuarioAndActivoTrue(usuario)
                .stream()
                .map(MetodoPagoResponse::desdeEntidad)
                .toList();
    }

    public MetodoPagoResponse desactivarMetodo(Long id, Usuario usuario) {
        MetodoPago metodoPago = obtenerMetodoPropio(id, usuario);
        metodoPago.setActivo(false);

        return MetodoPagoResponse.desdeEntidad(metodoPagoRepository.save(metodoPago));
    }

    public MetodoPagoResponse activarMetodo(Long id, Usuario usuario) {
        MetodoPago metodoPago = obtenerMetodoPropio(id, usuario);
        metodoPago.setActivo(true);

        return MetodoPagoResponse.desdeEntidad(metodoPagoRepository.save(metodoPago));
    }

    public void eliminarMetodo(Long id, Usuario usuario) {
        MetodoPago metodoPago = obtenerMetodoPropio(id, usuario);
        metodoPagoRepository.delete(metodoPago);
    }

    private MetodoPago obtenerMetodoPropio(Long id, Usuario usuario) {
        MetodoPago metodoPago = metodoPagoRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Metodo de pago no encontrado"));

        if (!metodoPago.getUsuario().getId().equals(usuario.getId())) {
            throw new SecurityException("No puedes modificar un metodo que no te pertenece");
        }

        return metodoPago;
    }
}