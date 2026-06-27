package com.estiloia.estilo_ia.controller;

import com.estiloia.estilo_ia.dto.IaDescripcionRequest;
import com.estiloia.estilo_ia.dto.IaDescripcionResponse;
import com.estiloia.estilo_ia.dto.IaAdaptacionRequest;
import com.estiloia.estilo_ia.dto.IaAdaptacionResponse;
import com.estiloia.estilo_ia.dto.IaLookResponse;
import com.estiloia.estilo_ia.dto.IaPrendaSugeridaResponse;
import com.estiloia.estilo_ia.dto.IaOutfitRequest;
import com.estiloia.estilo_ia.dto.IaOutfitResponse;
import com.estiloia.estilo_ia.dto.IaPrecioRequest;
import com.estiloia.estilo_ia.dto.IaPrecioResponse;
import com.estiloia.estilo_ia.service.IaService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/ia")
@RequiredArgsConstructor
public class IaController {

    private final IaService iaService;

    @PostMapping("/recomendar-outfit")
    public ResponseEntity<IaOutfitResponse> recomendarOutfit(
            @Valid @RequestBody IaOutfitRequest request
    ) {
        return ResponseEntity.ok(iaService.recomendarOutfit(request));
    }

    @PostMapping("/sugerir-precio")
    public ResponseEntity<IaPrecioResponse> sugerirPrecio(
            @Valid @RequestBody IaPrecioRequest request
    ) {
        return ResponseEntity.ok(iaService.sugerirPrecio(request));
    }

    @PostMapping("/generar-descripcion")
    public ResponseEntity<IaDescripcionResponse> generarDescripcion(
            @Valid @RequestBody IaDescripcionRequest request
    ) {
        return ResponseEntity.ok(iaService.generarDescripcion(request));
    }

    @PostMapping(value = "/recomendar-look-con-foto", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<IaLookResponse> recomendarLookConFoto(
            @RequestParam String estilo,
            @RequestParam String ocasion,
            @RequestParam String clima,
            @RequestParam Integer estaturaCm,
            @RequestParam String contextura,
            @RequestParam MultipartFile foto
    ) {
        return ResponseEntity.ok(iaService.recomendarLookConFoto(estilo, ocasion, clima, estaturaCm, contextura, foto));
    }

    @PostMapping("/adaptar-combinacion")
    public ResponseEntity<IaAdaptacionResponse> adaptarCombinacion(
            @Valid @RequestBody IaAdaptacionRequest request
    ) {
        return ResponseEntity.ok(iaService.adaptarCombinacion(request));
    }

    @PostMapping(value = "/analizar-prenda-foto", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<IaPrendaSugeridaResponse> analizarPrendaFoto(
            @RequestParam MultipartFile foto
    ) {
        return ResponseEntity.ok(iaService.analizarPrendaFoto(foto));
    }
}
