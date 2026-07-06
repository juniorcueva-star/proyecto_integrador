package com.estiloia.estilo_ia.service;

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
import com.estiloia.estilo_ia.dto.IaPruebaVirtualResponse;
import com.estiloia.estilo_ia.dto.PrendaResumenResponse;
import com.estiloia.estilo_ia.entity.Prenda;
import com.estiloia.estilo_ia.enums.EstadoPublicacion;
import com.estiloia.estilo_ia.repository.PrendaRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Base64;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class IaService {

    private final PrendaRepository prendaRepository;
    private final RestClient.Builder restClientBuilder;
    private final ObjectMapper objectMapper;

    @Value("${app.ai.url}")
    private String aiUrl;

    @Value("${app.ai.provider}")
    private String provider;

    @Value("${app.ai.api-key:}")
    private String apiKey;

    @Value("${app.ai.model}")
    private String model;

    public IaLookResponse recomendarLookConFoto(
            String estilo,
            String ocasion,
            String clima,
            Integer estaturaCm,
            String contextura,
            MultipartFile foto
    ) {
        validarFotoAnalisis(foto);
        validarPerfilCorporal(estaturaCm, contextura);

        List<PrendaResumenResponse> referencias = obtenerReferenciasParaLook(estilo, ocasion, clima, estaturaCm, contextura, 6);

        if (apiKey == null || apiKey.isBlank()) {
            return construirRespuestaLocal(estilo, ocasion, clima, estaturaCm, contextura, referencias);
        }

        try {
            return analizarLookConModelo(estilo, ocasion, clima, estaturaCm, contextura, foto, referencias);
        } catch (ResponseStatusException ex) {
            return construirRespuestaLocal(estilo, ocasion, clima, estaturaCm, contextura, referencias);
        }
    }

    public IaAdaptacionResponse adaptarCombinacion(IaAdaptacionRequest request) {
        validarPerfilCorporal(request.estaturaCm(), request.contextura());

        Prenda superior = obtenerPrendaActiva(request.prendaSuperiorId(), "La prenda superior no esta disponible");
        Prenda inferior = obtenerPrendaActiva(request.prendaInferiorId(), "La prenda inferior no esta disponible");

        if (!esCategoriaSuperior(superior.getCategoria().name())) {
            throw new IllegalArgumentException("Debes elegir una prenda superior valida");
        }

        if (!esCategoriaInferior(inferior.getCategoria().name())) {
            throw new IllegalArgumentException("Debes elegir una prenda inferior valida");
        }

        String tallaSuperiorSugerida = tallaTextoSuperior(request.estaturaCm(), request.contextura());
        String tallaInferiorSugerida = tallaTextoInferior(request.estaturaCm(), request.contextura());

        return new IaAdaptacionResponse(
                "ANALISIS_GUIADO",
                construirResumenPerfil(request.estaturaCm(), request.contextura()),
                "La combinacion seleccionada puede adaptarse a una salida de " + request.ocasion().toLowerCase()
                        + " priorizando equilibrio entre proporciones, largo visual y comodidad.",
                construirComentarioPrenda(superior, request.estaturaCm(), request.contextura(), true),
                construirComentarioPrenda(inferior, request.estaturaCm(), request.contextura(), false),
                construirEquilibrioVisual(superior, inferior, request.estaturaCm(), request.contextura()),
                tallaSuperiorSugerida,
                tallaInferiorSugerida,
                "Esta adaptacion es una guia de estilo y talla referencial. La caida exacta depende del patron real, tejido y medidas concretas de cada prenda.",
                PrendaResumenResponse.desdeEntidad(superior),
                PrendaResumenResponse.desdeEntidad(inferior)
        );
    }

    public IaPrendaSugeridaResponse analizarPrendaFoto(MultipartFile foto) {
        validarFotoAnalisis(foto);

        if (apiKey == null || apiKey.isBlank()) {
            throw new ResponseStatusException(
                    org.springframework.http.HttpStatus.SERVICE_UNAVAILABLE,
                    "Falta configurar la API key de IA en el backend"
            );
        }

        try {
            JsonNode json = llamarModeloPrendaFoto(foto);
            return new IaPrendaSugeridaResponse(
                    textoO(json, "nombre", "Prenda sin nombre"),
                    textoO(json, "descripcion", "Describe la prenda antes de publicar."),
                    textoO(json, "marca", "Sin marca visible"),
                    textoO(json, "color", "No definido"),
                    normalizarTalla(textoO(json, "talla", "M")),
                    normalizarCategoria(textoO(json, "categoria", "OTRO")),
                    normalizarEstadoFisico(textoO(json, "estadoFisico", "BUEN_ESTADO")),
                    leerBigDecimal(json.path("precio"), new BigDecimal("49.90")),
                    normalizarTipoPublicacion(textoO(json, "tipoPublicacion", "VENTA")),
                    leerArrayTexto(json.path("observaciones"))
            );
        } catch (ResponseStatusException ex) {
            throw ex;
        }
    }

    public IaOutfitResponse recomendarOutfit(IaOutfitRequest request) {
        validarPerfilCorporal(request.estaturaCm(), request.contextura());
        List<PrendaResumenResponse> referencias = obtenerReferenciasParaLook(
                request.estilo(),
                request.ocasion(),
                request.clima(),
                request.estaturaCm(),
                request.contextura(),
                8
        );

        if (apiKey == null || apiKey.isBlank()) {
            return construirRespuestaLocalOutfit(
                    request.estilo(),
                    request.ocasion(),
                    request.clima(),
                    request.estaturaCm(),
                    request.contextura(),
                    referencias
            );
        }

        String prompt = """
                Eres un asesor de moda sostenible para un marketplace de ropa usada.
                Devuelve SOLO JSON valido con esta estructura:
                {
                  "recomendacionGeneral": "texto breve",
                  "prendasSugeridas": ["item 1", "item 2", "item 3"],
                  "razones": ["razon 1", "razon 2", "razon 3"]
                }

                Datos del usuario:
                - Estilo: %s
                - Ocasion: %s
                - Clima: %s
                - Estatura: %s cm
                - Contextura: %s

                Usa referencias reales del catalogo para inspirarte:
                %s
                """.formatted(
                request.estilo(),
                request.ocasion(),
                request.clima(),
                request.estaturaCm(),
                describirContextura(request.contextura()),
                serializarReferencias(referencias)
        );

        try {
            JsonNode json = llamarModeloComoJson(prompt, 450);

            return new IaOutfitResponse(
                    json.path("recomendacionGeneral").asText("No se pudo generar una recomendacion"),
                    leerArrayTexto(json.path("prendasSugeridas")),
                    leerArrayTexto(json.path("razones")),
                    referencias
            );
        } catch (Exception ex) {
            return construirRespuestaLocalOutfit(
                    request.estilo(),
                    request.ocasion(),
                    request.clima(),
                    request.estaturaCm(),
                    request.contextura(),
                    referencias
            );
        }
    }

    public IaPruebaVirtualResponse generarPruebaVirtual(
            MultipartFile fotoRostro,
            Integer estaturaCm,
            String contextura,
            List<Long> prendaIds
    ) {
        validarFotoAnalisis(fotoRostro);
        validarPerfilCorporal(estaturaCm, contextura);

        if (prendaIds == null || prendaIds.size() != 2) {
            throw new IllegalArgumentException("Debes seleccionar exactamente 2 prendas para la prueba virtual");
        }

        List<PrendaResumenResponse> prendas = prendaIds.stream()
                .map(id -> obtenerPrendaActiva(id, "Una de las prendas seleccionadas no esta disponible"))
                .map(PrendaResumenResponse::desdeEntidad)
                .toList();

        return new IaPruebaVirtualResponse(
                "PENDIENTE_API",
                "Flujo listo para conectar una API de virtual try-on. Se recibio la foto del usuario, perfil corporal y las 2 prendas seleccionadas.",
                null,
                construirResumenPerfil(estaturaCm, contextura),
                prendas,
                List.of(
                        "Usa una foto frontal con buena iluminacion para conservar proporciones.",
                        "Selecciona una prenda superior y una inferior para obtener un resultado mas realista.",
                        "Al conectar la API, aqui se devolvera la imagen generada con el outfit aplicado."
                )
        );
    }

    public IaPrecioResponse sugerirPrecio(IaPrecioRequest request) {
        int limite = request.limiteReferencias() != null && request.limiteReferencias() > 0
                ? Math.min(request.limiteReferencias(), 10)
                : 6;

        List<PrendaResumenResponse> referencias = obtenerReferenciasSimilares(request.categoria(), request.marca(), limite);
        BigDecimal rangoMinimo = calcularRangoMinimo(referencias);
        BigDecimal rangoMaximo = calcularRangoMaximo(referencias);

        String prompt = """
                Eres un analista de precios para moda sostenible en Peru.
                Devuelve SOLO JSON valido con esta estructura:
                {
                  "precioSugerido": 0.00,
                  "rangoMinimo": 0.00,
                  "rangoMaximo": 0.00,
                  "explicacion": "texto breve"
                }

                Prenda a evaluar:
                - Nombre: %s
                - Marca: %s
                - Color: %s
                - Categoria: %s
                - Estado fisico: %s
                - Tipo de publicacion: %s
                - Talla: %s

                Referencias reales del catalogo:
                %s

                Rango estadistico observado:
                - Minimo: %s
                - Maximo: %s
                """.formatted(
                request.nombre(),
                request.marca(),
                request.color(),
                request.categoria(),
                request.estadoFisico(),
                request.tipoPublicacion(),
                request.talla(),
                serializarReferencias(referencias),
                rangoMinimo,
                rangoMaximo
        );

        JsonNode json = llamarModeloComoJson(prompt, 350);

        return new IaPrecioResponse(
                leerBigDecimal(json.path("precioSugerido"), promedio(rangoMinimo, rangoMaximo)),
                leerBigDecimal(json.path("rangoMinimo"), rangoMinimo),
                leerBigDecimal(json.path("rangoMaximo"), rangoMaximo),
                json.path("explicacion").asText("Precio sugerido usando referencias del catalogo"),
                referencias
        );
    }

    public IaDescripcionResponse generarDescripcion(IaDescripcionRequest request) {
        String prompt = """
                Eres un redactor para publicaciones de ropa de segunda mano.
                Devuelve SOLO JSON valido con esta estructura:
                {
                  "tituloSugerido": "titulo breve",
                  "descripcion": "descripcion persuasiva y concreta",
                  "etiquetas": ["tag1", "tag2", "tag3"]
                }

                Datos de la prenda:
                - Nombre: %s
                - Marca: %s
                - Color: %s
                - Talla: %s
                - Categoria: %s
                - Estado fisico: %s
                - Tipo de publicacion: %s

                La descripcion debe ser honesta, clara y breve. No inventes datos.
                """.formatted(
                request.nombre(),
                request.marca(),
                request.color(),
                request.talla(),
                request.categoria(),
                request.estadoFisico(),
                request.tipoPublicacion()
        );

        JsonNode json = llamarModeloComoJson(prompt, 350);

        return new IaDescripcionResponse(
                json.path("tituloSugerido").asText(request.nombre()),
                json.path("descripcion").asText("No se pudo generar una descripcion"),
                leerArrayTexto(json.path("etiquetas"))
        );
    }

    private JsonNode llamarModeloComoJson(String prompt, int maxOutputTokens) {
        if (apiKey == null || apiKey.isBlank()) {
            throw new ResponseStatusException(
                    org.springframework.http.HttpStatus.SERVICE_UNAVAILABLE,
                    "Falta configurar la API key de IA en el backend"
            );
        }

        if ("gemini".equalsIgnoreCase(provider)) {
            return llamarGemini(prompt, maxOutputTokens);
        }

        if ("groq".equalsIgnoreCase(provider)) {
            return llamarGroq(prompt, maxOutputTokens);
        }

        return llamarOpenAi(prompt, maxOutputTokens);
    }

    private IaLookResponse analizarLookConModelo(
            String estilo,
            String ocasion,
            String clima,
            Integer estaturaCm,
            String contextura,
            MultipartFile foto,
            List<PrendaResumenResponse> referencias
    ) {
        JsonNode json = llamarModeloVisionComoJson(estilo, ocasion, clima, estaturaCm, contextura, foto, referencias);

        return new IaLookResponse(
                "IA_MULTIMODAL",
                construirResumenPerfil(estaturaCm, contextura),
                json.path("perfilVisual").asText("La foto sugiere un look que puede estilizarse con prendas equilibradas del catalogo."),
                json.path("recomendacionGeneral").asText("Se genero una recomendacion a partir de tu foto y del catalogo."),
                "",
                leerArrayTexto(json.path("prendasSugeridas")),
                leerArrayTexto(json.path("razones")),
                leerArrayTexto(json.path("pasosSugeridos")),
                referencias
        );
    }

    private JsonNode llamarModeloVisionComoJson(
            String estilo,
            String ocasion,
            String clima,
            Integer estaturaCm,
            String contextura,
            MultipartFile foto,
            List<PrendaResumenResponse> referencias
    ) {
        if (!("groq".equalsIgnoreCase(provider) || "openai".equalsIgnoreCase(provider))) {
            if ("gemini".equalsIgnoreCase(provider)) {
                return llamarGeminiVision(estilo, ocasion, clima, estaturaCm, contextura, foto, referencias);
            }

            throw new ResponseStatusException(
                    org.springframework.http.HttpStatus.BAD_REQUEST,
                    "El proveedor configurado todavia no soporta este flujo multimodal"
            );
        }

        RestClient restClient = restClientBuilder.build();
        String prompt = """
                Eres un asesor de imagen para un marketplace de ropa usada.
                Analiza la foto del usuario con cautela: no infieras identidad ni atributos sensibles.
                Enfocate solo en armonia visual general, ocasion, estilo y combinaciones de prendas.

                Devuelve SOLO JSON valido con esta estructura:
                {
                  "perfilVisual": "texto breve",
                  "recomendacionGeneral": "texto breve",
                  "notaPruebaVisual": "texto breve",
                  "prendasSugeridas": ["item 1", "item 2", "item 3"],
                  "razones": ["razon 1", "razon 2", "razon 3"],
                  "pasosSugeridos": ["paso 1", "paso 2", "paso 3"]
                }

                Solicitud:
                - Estilo: %s
                - Ocasion: %s
                - Clima: %s
                - Estatura aproximada: %s cm
                - Contextura: %s

                Usa estas prendas del catalogo como base real:
                %s

                Importante:
                - No prometas un try-on realista.
                - Habla de combinacion visual, balance, capas y uso sugerido.
                - Si la foto solo muestra rostro, indicalo de forma neutral y adapta la recomendacion.
                - Ten en cuenta el rango corporal al sugerir tallas y largo visual.
                """.formatted(estilo, ocasion, clima, estaturaCm, describirContextura(contextura), serializarReferencias(referencias));

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("model", model);
        body.put("messages", List.of(
                Map.of(
                        "role", "user",
                        "content", List.of(
                                Map.of("type", "text", "text", prompt),
                                Map.of(
                                        "type", "image_url",
                                        "image_url", Map.of("url", construirDataUrl(foto))
                                )
                        )
                )
        ));
        body.put("max_tokens", 500);
        body.put("temperature", 0.4);
        body.put("response_format", Map.of("type", "json_object"));

        JsonNode response = restClient.post()
                .uri(aiUrl)
                .header("Authorization", "Bearer " + apiKey)
                .header("Content-Type", "application/json")
                .body(body)
                .exchange((request, clientResponse) -> {
                    String rawBody;
                    try {
                        rawBody = new String(clientResponse.getBody().readAllBytes(), StandardCharsets.UTF_8);
                    } catch (Exception e) {
                        throw new ResponseStatusException(
                                org.springframework.http.HttpStatus.BAD_GATEWAY,
                                "No se pudo leer la respuesta de la API de IA"
                        );
                    }

                    if (clientResponse.getStatusCode().isError()) {
                        throw new ResponseStatusException(
                                clientResponse.getStatusCode(),
                                extraerMensajeErrorApi(rawBody)
                        );
                    }

                    try {
                        return objectMapper.readTree(rawBody);
                    } catch (Exception e) {
                        throw new ResponseStatusException(
                                org.springframework.http.HttpStatus.BAD_GATEWAY,
                                "La API de IA devolvio una respuesta no valida"
                        );
                    }
                });

        String contenido = extraerTextoRespuesta(response);
        try {
            return objectMapper.readTree(extraerJson(contenido));
        } catch (Exception e) {
            throw new ResponseStatusException(
                    org.springframework.http.HttpStatus.BAD_GATEWAY,
                    "La respuesta multimodal no devolvio JSON valido"
            );
        }
    }

    private IaLookResponse construirRespuestaLocal(
            String estilo,
            String ocasion,
            String clima,
            Integer estaturaCm,
            String contextura,
            List<PrendaResumenResponse> referencias
    ) {
        List<String> prendas = referencias.stream()
                .limit(3)
                .map(prenda -> prenda.nombre() + " (" + prenda.categoria() + ", talla " + prenda.talla() + ")")
                .toList();

        if (prendas.isEmpty()) {
            prendas = List.of(
                    "Busca una prenda superior neutra",
                    "Agrega una base comoda para la ocasion",
                    "Cierra el look con calzado acorde al clima"
            );
        }

        return new IaLookResponse(
                "MODO_PREPARADO",
                construirResumenPerfil(estaturaCm, contextura),
                "La foto fue recibida y se construyo una recomendacion visual con base en tu perfil y en las prendas activas del catalogo.",
                "Se priorizaron combinaciones que encajan con tu ocasion, clima, estatura y contextura.",
                "",
                prendas,
                construirRazonesLocal(estilo, ocasion, clima, estaturaCm, contextura, referencias),
                List.of(
                        "Sube una foto frontal con buena luz, de preferencia de rostro y medio cuerpo.",
                        "Elige una ocasion concreta para ajustar mejor la combinacion.",
                        "Usa tu estatura y contextura como referencia para escoger largo, ancho visual y talla orientativa."
                ),
                referencias
        );
    }

    private IaOutfitResponse construirRespuestaLocalOutfit(
            String estilo,
            String ocasion,
            String clima,
            Integer estaturaCm,
            String contextura,
            List<PrendaResumenResponse> referencias
    ) {
        List<String> prendas = referencias.stream()
                .limit(3)
                .map(prenda -> prenda.nombre() + " (" + prenda.categoria() + ", talla " + prenda.talla() + ")")
                .toList();

        if (prendas.isEmpty()) {
            prendas = List.of(
                    "Busca una prenda superior neutra",
                    "Agrega una base comoda para la ocasion",
                    "Cierra el look con calzado acorde al clima"
            );
        }

        return new IaOutfitResponse(
                "Se priorizaron combinaciones del catalogo segun tu ocasion, clima, estatura y contextura.",
                prendas,
                construirRazonesLocal(estilo, ocasion, clima, estaturaCm, contextura, referencias),
                referencias
        );
    }

    private JsonNode llamarOpenAi(String prompt, int maxOutputTokens) {
        RestClient restClient = restClientBuilder.build();

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("model", model);
        body.put("messages", List.of(
                Map.of(
                        "role", "user",
                        "content", prompt
                )
        ));
        body.put("max_tokens", maxOutputTokens);
        body.put("temperature", 0.2);
        body.put("response_format", Map.of("type", "json_object"));

        JsonNode response = restClient.post()
                .uri(aiUrl)
                .header("Authorization", "Bearer " + apiKey)
                .header("Content-Type", "application/json")
                .body(body)
                .exchange((request, clientResponse) -> {
                    String rawBody;
                    try {
                        rawBody = new String(clientResponse.getBody().readAllBytes(), StandardCharsets.UTF_8);
                    } catch (Exception e) {
                        throw new ResponseStatusException(
                                org.springframework.http.HttpStatus.BAD_GATEWAY,
                                "No se pudo leer la respuesta de la API de IA"
                        );
                    }

                    if (clientResponse.getStatusCode().isError()) {
                        throw new ResponseStatusException(
                                clientResponse.getStatusCode(),
                                extraerMensajeErrorApi(rawBody)
                        );
                    }

                    try {
                        return objectMapper.readTree(rawBody);
                    } catch (Exception e) {
                        throw new ResponseStatusException(
                            org.springframework.http.HttpStatus.BAD_GATEWAY,
                                "La API de IA devolvio una respuesta no valida"
                        );
                    }
                });

        if (response == null) {
            throw new ResponseStatusException(
                    org.springframework.http.HttpStatus.BAD_GATEWAY,
                    "La API de IA no devolvio contenido"
            );
        }

        String contenido = extraerTextoRespuesta(response);

        try {
            return objectMapper.readTree(extraerJson(contenido));
        } catch (Exception e) {
            throw new ResponseStatusException(
                    org.springframework.http.HttpStatus.BAD_GATEWAY,
                    "La respuesta de IA no tuvo un JSON valido"
            );
        }
    }

    private JsonNode llamarGroq(String prompt, int maxOutputTokens) {
        RestClient restClient = restClientBuilder.build();

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("model", model);
        body.put("messages", List.of(
                Map.of(
                        "role", "user",
                        "content", prompt
                )
        ));
        body.put("max_tokens", maxOutputTokens);
        body.put("temperature", 0.3);
        body.put("response_format", Map.of("type", "json_object"));

        JsonNode response = restClient.post()
                .uri(aiUrl)
                .header("Authorization", "Bearer " + apiKey)
                .header("Content-Type", "application/json")
                .body(body)
                .exchange((request, clientResponse) -> {
                    String rawBody;
                    try {
                        rawBody = new String(clientResponse.getBody().readAllBytes(), StandardCharsets.UTF_8);
                    } catch (Exception e) {
                        throw new ResponseStatusException(
                                org.springframework.http.HttpStatus.BAD_GATEWAY,
                                "No se pudo leer la respuesta de la API de IA"
                        );
                    }

                    if (clientResponse.getStatusCode().isError()) {
                        throw new ResponseStatusException(
                                clientResponse.getStatusCode(),
                                extraerMensajeErrorApi(rawBody)
                        );
                    }

                    try {
                        return objectMapper.readTree(rawBody);
                    } catch (Exception e) {
                        throw new ResponseStatusException(
                                org.springframework.http.HttpStatus.BAD_GATEWAY,
                                "La API de IA devolvio una respuesta no valida"
                        );
                    }
                });

        if (response == null) {
            throw new ResponseStatusException(
                    org.springframework.http.HttpStatus.BAD_GATEWAY,
                    "La API de IA no devolvio contenido"
            );
        }

        String contenido = extraerTextoRespuesta(response);

        try {
            return objectMapper.readTree(extraerJson(contenido));
        } catch (Exception e) {
            throw new ResponseStatusException(
                    org.springframework.http.HttpStatus.BAD_GATEWAY,
                    "La respuesta de IA no tuvo un JSON valido"
            );
        }
    }

    private JsonNode llamarGemini(String prompt) {
        return llamarGemini(prompt, 450);
    }

    private JsonNode llamarGemini(String prompt, int maxOutputTokens) {
        RestClient restClient = restClientBuilder.build();

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("contents", List.of(
                Map.of(
                        "parts", List.of(
                                Map.of("text", prompt)
                        )
                )
        ));
        body.put("generationConfig", Map.of(
                "temperature", 0.3,
                "maxOutputTokens", maxOutputTokens,
                "responseMimeType", "application/json"
        ));

        JsonNode response = restClient.post()
                .uri(geminiGenerateContentUri())
                .header("x-goog-api-key", apiKey)
                .header("Content-Type", "application/json")
                .body(body)
                .exchange((request, clientResponse) -> {
                    String rawBody;
                    try {
                        rawBody = new String(clientResponse.getBody().readAllBytes(), StandardCharsets.UTF_8);
                    } catch (Exception e) {
                        throw new ResponseStatusException(
                                org.springframework.http.HttpStatus.BAD_GATEWAY,
                                "No se pudo leer la respuesta de la API de IA"
                        );
                    }

                    if (clientResponse.getStatusCode().isError()) {
                        throw new ResponseStatusException(
                                clientResponse.getStatusCode(),
                                extraerMensajeErrorApi(rawBody)
                        );
                    }

                    try {
                        return objectMapper.readTree(rawBody);
                    } catch (Exception e) {
                        throw new ResponseStatusException(
                                org.springframework.http.HttpStatus.BAD_GATEWAY,
                                "La API de IA devolvio una respuesta no valida"
                        );
                    }
                });

        if (response == null) {
            throw new ResponseStatusException(
                    org.springframework.http.HttpStatus.BAD_GATEWAY,
                    "La API de IA no devolvio contenido"
            );
        }

        String contenido = extraerTextoRespuesta(response);

        try {
            return objectMapper.readTree(extraerJson(contenido));
        } catch (Exception e) {
            throw new ResponseStatusException(
                    org.springframework.http.HttpStatus.BAD_GATEWAY,
                    "La respuesta de IA no tuvo un JSON valido"
            );
        }
    }

    private JsonNode llamarModeloPrendaFoto(MultipartFile foto) {
        if ("gemini".equalsIgnoreCase(provider)) {
            return llamarGeminiPrenda(foto);
        }

        if ("openai".equalsIgnoreCase(provider) || "groq".equalsIgnoreCase(provider)) {
            return llamarOpenAiPrenda(foto);
        }

        throw new ResponseStatusException(
                org.springframework.http.HttpStatus.BAD_REQUEST,
                "El proveedor configurado no soporta analisis de imagen de prenda"
        );
    }

    private String promptAnalisisPrenda() {
        return """
                Analiza la foto de una prenda para un marketplace de ropa usada.
                Identifica la prenda principal de la imagen. No uses respuestas genericas.
                Devuelve SOLO JSON valido con esta estructura exacta:
                {
                  "nombre": "titulo corto de 2 a 5 palabras",
                  "descripcion": "descripcion comercial de 1 a 2 oraciones",
                  "marca": "texto",
                  "color": "texto",
                  "talla": "XS|S|M|L|XL|XXL|TALLA_28|TALLA_30|TALLA_32|TALLA_34|TALLA_36|TALLA_38|TALLA_40|TALLA_42|UNICA",
                  "categoria": "POLO|CAMISA|PANTALON|SHORT|CASACA|CHOMPA|VESTIDO|FALDA|ZAPATOS|ZAPATILLAS|ACCESORIO|OTRO",
                  "estadoFisico": "NUEVA|BUEN_ESTADO|USADA|DESGASTADA",
                  "precio": 0.00,
                  "tipoPublicacion": "VENTA|INTERCAMBIO|VENTA_E_INTERCAMBIO",
                  "observaciones": ["obs1", "obs2"]
                }

                Reglas de clasificacion:
                - El nombre debe ser corto, comercial y directo. Ejemplos: "Short veranero", "Camisa blanca", "Casaca marron", "Polo deportivo".
                - No pongas detalles largos en el nombre; esos detalles van en la descripcion.
                - La descripcion debe explayarse con detalles visibles: color, corte, textura, cierre, botones, hebilla, estilo, ocasion sugerida y estado aparente.
                - Ejemplo de descripcion: "Short blanco con hebilla dorada y corte fresco, ideal para tardes de verano o looks casuales. Se aprecia en buen estado y listo para combinar con polos o camisas ligeras."
                - Si la prenda llega por encima de la rodilla o es corta, clasificala como SHORT, no como PANTALON.
                - Si se ve como bermuda, short, shorts, pantaloncillo o pantalon corto, usa categoria SHORT.
                - Si es pantalon largo hasta tobillos, usa PANTALON.
                - Si no se ve la marca, usa "Sin marca visible".
                - Si la talla no se puede inferir con claridad, usa "M" para prendas superiores, "TALLA_32" para pantalones o shorts y "UNICA" para accesorios.
                - El precio debe ser razonable para segunda mano en Peru.
                - La descripcion debe sonar natural, atractiva y honesta para marketplace.
                - No inventes detalles especificos que no se ven.
                """;
    }

    private JsonNode llamarOpenAiPrenda(MultipartFile foto) {
        RestClient restClient = restClientBuilder.build();

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("model", model);
        body.put("messages", List.of(
                Map.of(
                        "role", "user",
                        "content", List.of(
                                Map.of("type", "text", "text", promptAnalisisPrenda()),
                                Map.of(
                                        "type", "image_url",
                                        "image_url", Map.of("url", construirDataUrl(foto))
                                )
                        )
                )
        ));
        body.put("max_tokens", 650);
        body.put("temperature", 0.1);
        body.put("response_format", Map.of("type", "json_object"));

        JsonNode response = restClient.post()
                .uri(aiUrl)
                .header("Authorization", "Bearer " + apiKey)
                .header("Content-Type", "application/json")
                .body(body)
                .exchange((request, clientResponse) -> {
                    String rawBody;
                    try {
                        rawBody = new String(clientResponse.getBody().readAllBytes(), StandardCharsets.UTF_8);
                    } catch (Exception e) {
                        throw new ResponseStatusException(
                                org.springframework.http.HttpStatus.BAD_GATEWAY,
                                "No se pudo leer la respuesta de la API de IA"
                        );
                    }

                    if (clientResponse.getStatusCode().isError()) {
                        throw new ResponseStatusException(
                                clientResponse.getStatusCode(),
                                extraerMensajeErrorApi(rawBody)
                        );
                    }

                    try {
                        return objectMapper.readTree(rawBody);
                    } catch (Exception e) {
                        throw new ResponseStatusException(
                                org.springframework.http.HttpStatus.BAD_GATEWAY,
                                "La API de IA devolvio una respuesta no valida"
                        );
                    }
                });

        String contenido = extraerTextoRespuesta(response);
        try {
            return objectMapper.readTree(extraerJson(contenido));
        } catch (Exception e) {
            throw new ResponseStatusException(
                    org.springframework.http.HttpStatus.BAD_GATEWAY,
                    "La respuesta de IA no tuvo un JSON valido"
            );
        }
    }

    private JsonNode llamarGeminiPrenda(MultipartFile foto) {
        RestClient restClient = restClientBuilder.build();
        String prompt = promptAnalisisPrenda();

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("contents", List.of(
                Map.of(
                        "parts", List.of(
                                Map.of("text", prompt),
                                Map.of(
                                        "inlineData", Map.of(
                                                "mimeType", foto.getContentType() == null ? "image/png" : foto.getContentType(),
                                                "data", Base64.getEncoder().encodeToString(leerBytesFoto(foto))
                                        )
                                )
                        )
                )
        ));
        body.put("generationConfig", Map.of(
                "temperature", 0.2,
                "maxOutputTokens", 450,
                "responseMimeType", "application/json"
        ));

        JsonNode response = restClient.post()
                .uri(geminiGenerateContentUri())
                .header("x-goog-api-key", apiKey)
                .header("Content-Type", "application/json")
                .body(body)
                .exchange((request, clientResponse) -> {
                    String rawBody;
                    try {
                        rawBody = new String(clientResponse.getBody().readAllBytes(), StandardCharsets.UTF_8);
                    } catch (Exception e) {
                        throw new ResponseStatusException(
                                org.springframework.http.HttpStatus.BAD_GATEWAY,
                                "No se pudo leer la respuesta de la API de IA"
                        );
                    }

                    if (clientResponse.getStatusCode().isError()) {
                        throw new ResponseStatusException(
                                clientResponse.getStatusCode(),
                                extraerMensajeErrorApi(rawBody)
                        );
                    }

                    try {
                        return objectMapper.readTree(rawBody);
                    } catch (Exception e) {
                        throw new ResponseStatusException(
                                org.springframework.http.HttpStatus.BAD_GATEWAY,
                                "La API de IA devolvio una respuesta no valida"
                        );
                    }
                });

        String contenido = extraerTextoRespuesta(response);
        try {
            return objectMapper.readTree(extraerJson(contenido));
        } catch (Exception e) {
            throw new ResponseStatusException(
                    org.springframework.http.HttpStatus.BAD_GATEWAY,
                    "La respuesta de IA no tuvo un JSON valido"
            );
        }
    }

    private JsonNode llamarGeminiVision(
            String estilo,
            String ocasion,
            String clima,
            Integer estaturaCm,
            String contextura,
            MultipartFile foto,
            List<PrendaResumenResponse> referencias
    ) {
        RestClient restClient = restClientBuilder.build();

        String prompt = """
                Eres un asesor de imagen para un marketplace de ropa usada.
                Analiza la foto del usuario con cautela: no infieras identidad ni atributos sensibles.
                Enfocate solo en armonia visual general, ocasion, estilo y combinaciones de prendas.

                Devuelve SOLO JSON valido con esta estructura:
                {
                  "perfilVisual": "texto breve",
                  "recomendacionGeneral": "texto breve",
                  "notaPruebaVisual": "texto breve",
                  "prendasSugeridas": ["item 1", "item 2", "item 3"],
                  "razones": ["razon 1", "razon 2", "razon 3"],
                  "pasosSugeridos": ["paso 1", "paso 2", "paso 3"]
                }

                Solicitud:
                - Estilo: %s
                - Ocasion: %s
                - Clima: %s
                - Estatura aproximada: %s cm
                - Contextura: %s

                Usa estas prendas del catalogo como base real:
                %s

                Importante:
                - No prometas un try-on realista.
                - Habla de combinacion visual, balance, capas y uso sugerido.
                - Si la foto solo muestra rostro, indicalo de forma neutral y adapta la recomendacion.
                - Ten en cuenta el rango corporal al sugerir tallas y largo visual.
                """.formatted(estilo, ocasion, clima, estaturaCm, describirContextura(contextura), serializarReferencias(referencias));

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("contents", List.of(
                Map.of(
                        "parts", List.of(
                                Map.of("text", prompt),
                                Map.of(
                                        "inlineData", Map.of(
                                                "mimeType", foto.getContentType() == null ? "image/png" : foto.getContentType(),
                                                "data", Base64.getEncoder().encodeToString(leerBytesFoto(foto))
                                        )
                                )
                        )
                )
        ));
        body.put("generationConfig", Map.of(
                "temperature", 0.4,
                "maxOutputTokens", 500,
                "responseMimeType", "application/json"
        ));

        JsonNode response = restClient.post()
                .uri(geminiGenerateContentUri())
                .header("x-goog-api-key", apiKey)
                .header("Content-Type", "application/json")
                .body(body)
                .exchange((request, clientResponse) -> {
                    String rawBody;
                    try {
                        rawBody = new String(clientResponse.getBody().readAllBytes(), StandardCharsets.UTF_8);
                    } catch (Exception e) {
                        throw new ResponseStatusException(
                                org.springframework.http.HttpStatus.BAD_GATEWAY,
                                "No se pudo leer la respuesta de la API de IA"
                        );
                    }

                    if (clientResponse.getStatusCode().isError()) {
                        throw new ResponseStatusException(
                                clientResponse.getStatusCode(),
                                extraerMensajeErrorApi(rawBody)
                        );
                    }

                    try {
                        return objectMapper.readTree(rawBody);
                    } catch (Exception e) {
                        throw new ResponseStatusException(
                                org.springframework.http.HttpStatus.BAD_GATEWAY,
                                "La API de IA devolvio una respuesta no valida"
                        );
                    }
                });

        String contenido = extraerTextoRespuesta(response);
        try {
            return objectMapper.readTree(extraerJson(contenido));
        } catch (Exception e) {
            throw new ResponseStatusException(
                    org.springframework.http.HttpStatus.BAD_GATEWAY,
                    "La respuesta multimodal no devolvio JSON valido"
            );
        }
    }

    private List<PrendaResumenResponse> obtenerReferenciasCatalogo(int limite) {
        return prendaRepository.findByEstadoPublicacionAndEliminadoFalse(EstadoPublicacion.PUBLICADA)
                .stream()
                .sorted(Comparator.comparing(Prenda::getFechaPublicacion).reversed())
                .limit(limite)
                .map(PrendaResumenResponse::desdeEntidad)
                .toList();
    }

    private List<PrendaResumenResponse> obtenerReferenciasSimilares(String categoria, String marca, int limite) {
        return prendaRepository.findByEstadoPublicacionAndEliminadoFalse(EstadoPublicacion.PUBLICADA)
                .stream()
                .filter(prenda -> prenda.getCategoria() != null && prenda.getCategoria().name().equalsIgnoreCase(categoria))
                .sorted(Comparator
                        .comparing((Prenda prenda) -> !marcaCoincide(prenda, marca))
                        .thenComparing(Prenda::getFechaPublicacion, Comparator.reverseOrder()))
                .limit(limite)
                .map(PrendaResumenResponse::desdeEntidad)
                .toList();
    }

    private List<PrendaResumenResponse> obtenerReferenciasParaLook(
            String estilo,
            String ocasion,
            String clima,
            Integer estaturaCm,
            String contextura,
            int limite
    ) {
        return prendaRepository.findByEstadoPublicacionAndEliminadoFalse(EstadoPublicacion.PUBLICADA)
                .stream()
                .sorted(Comparator
                        .comparingInt((Prenda prenda) -> puntuarPrendaParaLook(prenda, estilo, ocasion, clima, estaturaCm, contextura))
                        .reversed()
                        .thenComparing(Prenda::getFechaPublicacion, Comparator.reverseOrder()))
                .limit(limite)
                .map(PrendaResumenResponse::desdeEntidad)
                .toList();
    }

    private int puntuarPrendaParaLook(
            Prenda prenda,
            String estilo,
            String ocasion,
            String clima,
            Integer estaturaCm,
            String contextura
    ) {
        int puntaje = 0;
        String categoria = prenda.getCategoria().name();
        String tipoPublicacion = prenda.getTipoPublicacion().name();

        if ("FORMAL".equalsIgnoreCase(estilo) || "ELEGANTE".equalsIgnoreCase(estilo)) {
            if (List.of("CAMISA", "PANTALON", "ZAPATOS", "VESTIDO", "FALDA", "CASACA", "ACCESORIO").contains(categoria)) {
                puntaje += 5;
            }
        }

        if ("CASUAL".equalsIgnoreCase(estilo) || "URBANO".equalsIgnoreCase(estilo)) {
            if (List.of("POLO", "PANTALON", "SHORT", "ZAPATILLAS", "CASACA", "CHOMPA", "ACCESORIO").contains(categoria)) {
                puntaje += 5;
            }
        }

        if ("DEPORTIVO".equalsIgnoreCase(estilo)) {
            if (List.of("POLO", "SHORT", "ZAPATILLAS", "CASACA").contains(categoria)) {
                puntaje += 5;
            }
        }

        if ("TRABAJO".equalsIgnoreCase(ocasion) || "EVENTO".equalsIgnoreCase(ocasion)) {
            if (List.of("CAMISA", "PANTALON", "ZAPATOS", "VESTIDO", "FALDA", "CASACA").contains(categoria)) {
                puntaje += 4;
            }
        }

        if ("SALIDA".equalsIgnoreCase(ocasion) || "CLASES".equalsIgnoreCase(ocasion)) {
            if (List.of("POLO", "PANTALON", "SHORT", "ZAPATILLAS", "CHOMPA", "CASACA", "ACCESORIO").contains(categoria)) {
                puntaje += 4;
            }
        }

        if ("FRIO".equalsIgnoreCase(clima) && List.of("CASACA", "CHOMPA", "PANTALON").contains(categoria)) {
            puntaje += 3;
        }

        if ("CALOR".equalsIgnoreCase(clima) && List.of("POLO", "SHORT", "VESTIDO", "FALDA").contains(categoria)) {
            puntaje += 3;
        }

        if ("TEMPLADO".equalsIgnoreCase(clima) && List.of("CAMISA", "POLO", "PANTALON", "ZAPATILLAS").contains(categoria)) {
            puntaje += 2;
        }

        if ("VENTA_E_INTERCAMBIO".equalsIgnoreCase(tipoPublicacion) || "VENTA".equalsIgnoreCase(tipoPublicacion)) {
            puntaje += 1;
        }

        puntaje += puntajePorCompatibilidadTalla(prenda.getTalla().name(), categoria, estaturaCm, contextura);

        return puntaje;
    }

    private List<String> construirRazonesLocal(
            String estilo,
            String ocasion,
            String clima,
            Integer estaturaCm,
            String contextura,
            List<PrendaResumenResponse> referencias
    ) {
        List<String> razones = new ArrayList<>();
        razones.add("Se priorizaron prendas del catalogo que encajan con un look " + estilo.toLowerCase() + " para " + ocasion.toLowerCase() + ".");
        razones.add("El clima " + clima.toLowerCase() + " ajusta la recomendacion hacia capas, tejidos o piezas mas ligeras.");
        razones.add("La seleccion considera una estatura de " + estaturaCm + " cm y una contextura " + describirContextura(contextura).toLowerCase() + " para acercarse mejor a tallas y proporciones.");
        if (!referencias.isEmpty()) {
            razones.add("Las referencias se eligieron desde publicaciones activas para que el look propuesto se pueda comprar o coordinar ahora.");
        }
        return razones;
    }

    private void validarPerfilCorporal(Integer estaturaCm, String contextura) {
        if (estaturaCm == null || estaturaCm < 140 || estaturaCm > 205) {
            throw new IllegalArgumentException("La estatura debe estar entre 140 y 205 cm");
        }

        if (!esContexturaValida(contextura)) {
            throw new IllegalArgumentException("La contextura debe ser DELGADA, NORMAL o CONTEXTURA_GRUESA");
        }
    }

    private void validarFotoAnalisis(MultipartFile foto) {
        if (foto == null || foto.isEmpty()) {
            throw new IllegalArgumentException("Debes subir una foto para la recomendacion IA");
        }

        String contentType = foto.getContentType();
        if (contentType == null || !(contentType.equalsIgnoreCase("image/png")
                || contentType.equalsIgnoreCase("image/jpeg")
                || contentType.equalsIgnoreCase("image/jpg")
                || contentType.equalsIgnoreCase("image/webp"))) {
            throw new IllegalArgumentException("La foto debe ser PNG, JPG, JPEG o WEBP");
        }
    }

    private String construirDataUrl(MultipartFile foto) {
        try {
            String contentType = foto.getContentType() == null ? "image/png" : foto.getContentType();
            return "data:" + contentType + ";base64," + Base64.getEncoder().encodeToString(foto.getBytes());
        } catch (Exception e) {
            throw new ResponseStatusException(
                    org.springframework.http.HttpStatus.BAD_REQUEST,
                    "No se pudo procesar la foto enviada"
            );
        }
    }

    private byte[] leerBytesFoto(MultipartFile foto) {
        try {
            return foto.getBytes();
        } catch (Exception e) {
            throw new ResponseStatusException(
                    org.springframework.http.HttpStatus.BAD_REQUEST,
                    "No se pudo procesar la foto enviada"
            );
        }
    }

    private String geminiGenerateContentUri() {
        return aiUrl + "/" + model + ":generateContent";
    }

    private IaPrendaSugeridaResponse construirSugerenciaPrendaBasica() {
        return new IaPrendaSugeridaResponse(
                "Prenda sugerida",
                "Prenda lista para publicarse en el catalogo de segunda mano.",
                "Sin marca visible",
                "Negro",
                "M",
                "OTRO",
                "BUEN_ESTADO",
                new BigDecimal("49.90"),
                "VENTA",
                List.of("Revisa talla, color y precio antes de publicar.")
        );
    }

    private boolean esContexturaValida(String contextura) {
        return List.of("DELGADA", "NORMAL", "CONTEXTURA_GRUESA").contains(contextura == null ? "" : contextura.toUpperCase());
    }

    private String describirContextura(String contextura) {
        return switch ((contextura == null ? "" : contextura.toUpperCase())) {
            case "DELGADA" -> "delgada";
            case "CONTEXTURA_GRUESA" -> "de contextura gruesa";
            default -> "normal";
        };
    }

    private String textoO(JsonNode json, String campo, String fallback) {
        String valor = json.path(campo).asText(fallback);
        return valor == null || valor.isBlank() ? fallback : valor.trim();
    }

    private String normalizarCategoria(String valor) {
        return switch ((valor == null ? "" : valor.trim().toUpperCase())) {
            case "POLERA", "SUDADERA", "HOODIE" -> "CHOMPA";
            case "SHORTS", "BERMUDA", "BERMUDAS", "PANTALON_CORTO", "PANTALON CORTO",
                    "PANTALONCILLO" -> "SHORT";
            case "POLO", "CAMISA", "PANTALON", "SHORT", "CASACA", "CHOMPA", "VESTIDO", "FALDA",
                    "ZAPATOS", "ZAPATILLAS", "ACCESORIO", "OTRO" -> valor.trim().toUpperCase();
            default -> "OTRO";
        };
    }

    private String normalizarEstadoFisico(String valor) {
        return switch ((valor == null ? "" : valor.trim().toUpperCase())) {
            case "NUEVA", "BUEN_ESTADO", "USADA", "DESGASTADA" -> valor.trim().toUpperCase();
            default -> "BUEN_ESTADO";
        };
    }

    private String normalizarTipoPublicacion(String valor) {
        return switch ((valor == null ? "" : valor.trim().toUpperCase())) {
            case "VENTA", "INTERCAMBIO", "VENTA_E_INTERCAMBIO" -> valor.trim().toUpperCase();
            default -> "VENTA";
        };
    }

    private String normalizarTalla(String valor) {
        return switch ((valor == null ? "" : valor.trim().toUpperCase())) {
            case "XS", "S", "M", "L", "XL", "XXL", "TALLA_28", "TALLA_30", "TALLA_32",
                    "TALLA_34", "TALLA_36", "TALLA_38", "TALLA_40", "TALLA_42", "UNICA" -> valor.trim().toUpperCase();
            default -> "M";
        };
    }

    private String construirResumenPerfil(Integer estaturaCm, String contextura) {
        return "Perfil usado: " + estaturaCm + " cm y contextura " + describirContextura(contextura) + ".";
    }

    private int puntajePorCompatibilidadTalla(String talla, String categoria, Integer estaturaCm, String contextura) {
        if (talla == null) {
            return 0;
        }

        List<String> ideales = esCategoriaInferior(categoria)
                ? tallasInferioresIdeales(estaturaCm, contextura)
                : tallasSuperioresIdeales(estaturaCm, contextura);

        if (ideales.contains(talla)) {
            return 6;
        }

        if ("UNICA".equalsIgnoreCase(talla)) {
            return 2;
        }

        return 0;
    }

    private List<String> tallasSuperioresIdeales(Integer estaturaCm, String contextura) {
        String c = contextura.toUpperCase();
        if ("DELGADA".equals(c)) {
            if (estaturaCm <= 155) return List.of("XS", "S");
            if (estaturaCm <= 165) return List.of("S", "M");
            return List.of("M", "L");
        }

        if ("CONTEXTURA_GRUESA".equals(c)) {
            if (estaturaCm <= 160) return List.of("L", "XL");
            if (estaturaCm <= 175) return List.of("XL", "XXL");
            return List.of("XXL", "XL");
        }

        if (estaturaCm <= 155) return List.of("S", "M");
        if (estaturaCm <= 170) return List.of("M", "L");
        return List.of("L", "XL");
    }

    private List<String> tallasInferioresIdeales(Integer estaturaCm, String contextura) {
        String c = contextura.toUpperCase();
        if ("DELGADA".equals(c)) {
            if (estaturaCm <= 155) return List.of("S", "TALLA_28", "TALLA_30");
            if (estaturaCm <= 165) return List.of("M", "TALLA_30", "TALLA_32");
            return List.of("M", "L", "TALLA_32", "TALLA_34");
        }

        if ("CONTEXTURA_GRUESA".equals(c)) {
            if (estaturaCm <= 160) return List.of("L", "XL", "TALLA_34", "TALLA_36");
            if (estaturaCm <= 175) return List.of("XL", "XXL", "TALLA_36", "TALLA_38", "TALLA_40");
            return List.of("XL", "XXL", "TALLA_38", "TALLA_40", "TALLA_42");
        }

        if (estaturaCm <= 155) return List.of("S", "M", "TALLA_30", "TALLA_32");
        if (estaturaCm <= 170) return List.of("M", "L", "TALLA_32", "TALLA_34");
        return List.of("L", "XL", "TALLA_34", "TALLA_36");
    }

    private String tallaTextoSuperior(Integer estaturaCm, String contextura) {
        return String.join(" o ", tallasSuperioresIdeales(estaturaCm, contextura));
    }

    private String tallaTextoInferior(Integer estaturaCm, String contextura) {
        return String.join(" o ", tallasInferioresIdeales(estaturaCm, contextura));
    }

    private boolean esCategoriaSuperior(String categoria) {
        return List.of("POLO", "CAMISA", "CASACA", "CHOMPA").contains(categoria);
    }

    private boolean esCategoriaInferior(String categoria) {
        return List.of("PANTALON", "SHORT", "FALDA").contains(categoria);
    }

    private Prenda obtenerPrendaActiva(Long id, String mensaje) {
        Prenda prenda = prendaRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException(mensaje));

        if (Boolean.TRUE.equals(prenda.getEliminado()) || prenda.getEstadoPublicacion() != EstadoPublicacion.PUBLICADA) {
            throw new IllegalArgumentException(mensaje);
        }

        return prenda;
    }

    private String construirComentarioPrenda(Prenda prenda, Integer estaturaCm, String contextura, boolean superior) {
        String categoria = prenda.getCategoria().name();
        String talla = prenda.getTalla().name();
        String base = superior
                ? "Como prenda superior, " + prenda.getNombre() + " puede funcionar bien si buscas un encaje cercano a " + tallaTextoSuperior(estaturaCm, contextura) + "."
                : "Como prenda inferior, " + prenda.getNombre() + " puede verse equilibrada si apuntas a un rango cercano a " + tallaTextoInferior(estaturaCm, contextura) + ".";

        if (puntajePorCompatibilidadTalla(talla, categoria, estaturaCm, contextura) > 0) {
            return base + " La talla publicada (" + talla + ") cae dentro de un rango compatible con tu perfil.";
        }

        return base + " La talla publicada (" + talla + ") podria requerir revisar medidas antes de concretar la compra.";
    }

    private String construirEquilibrioVisual(Prenda superior, Prenda inferior, Integer estaturaCm, String contextura) {
        StringBuilder texto = new StringBuilder("La combinacion de ");
        texto.append(superior.getCategoria().name().toLowerCase()).append(" con ");
        texto.append(inferior.getCategoria().name().toLowerCase()).append(" favorece un balance ");

        if (estaturaCm <= 160) {
            texto.append("mas compacto, por lo que conviene cuidar largos y evitar exceso de volumen simultaneo.");
        } else if (estaturaCm >= 175) {
            texto.append("alargado, asi que puedes aprovechar capas o contrastes sin perder proporcion.");
        } else {
            texto.append("estable, permitiendo jugar con contraste entre parte superior e inferior.");
        }

        if ("CONTEXTURA_GRUESA".equalsIgnoreCase(contextura)) {
            texto.append(" Para una contextura de mayor presencia visual, suele ayudar que una de las dos piezas mantenga una linea mas limpia.");
        } else if ("DELGADA".equalsIgnoreCase(contextura)) {
            texto.append(" Para una contextura delgada, sumar una prenda con algo de estructura puede dar mas presencia al look.");
        } else {
            texto.append(" En una contextura normal, la prioridad pasa por el ajuste y la armonia del largo.");
        }

        return texto.toString();
    }

    private boolean marcaCoincide(Prenda prenda, String marca) {
        return prenda.getMarca() != null && marca != null && prenda.getMarca().equalsIgnoreCase(marca);
    }

    private String serializarReferencias(List<PrendaResumenResponse> referencias) {
        if (referencias.isEmpty()) {
            return "Sin referencias disponibles";
        }

        List<Map<String, Object>> data = new ArrayList<>();
        for (PrendaResumenResponse referencia : referencias) {
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("nombre", referencia.nombre());
            item.put("marca", referencia.marca());
            item.put("categoria", referencia.categoria());
            item.put("talla", referencia.talla());
            item.put("precio", referencia.precio());
            item.put("estadoPublicacion", referencia.estadoPublicacion());
            item.put("vendedor", referencia.nombreVendedor());
            data.add(item);
        }

        try {
            return objectMapper.writerWithDefaultPrettyPrinter().writeValueAsString(data);
        } catch (Exception e) {
            return "Sin referencias serializables";
        }
    }

    private String extraerTextoRespuesta(JsonNode response) {
        if ("gemini".equalsIgnoreCase(provider)) {
            if (response.hasNonNull("output_text") && response.get("output_text").isTextual()) {
                return response.get("output_text").asText();
            }

            JsonNode parts = response.path("candidates").path(0).path("content").path("parts");
            if (parts.isArray() && !parts.isEmpty()) {
                JsonNode first = parts.get(0);
                if (first.hasNonNull("text")) {
                    return first.get("text").asText();
                }
            }
        }

        if ("groq".equalsIgnoreCase(provider)) {
            JsonNode content = response.path("choices").path(0).path("message").path("content");
            if (content.isTextual()) {
                return content.asText();
            }
        }

        JsonNode chatContent = response.path("choices").path(0).path("message").path("content");
        if (chatContent.isTextual()) {
            return chatContent.asText();
        }

        if (response.hasNonNull("output_text") && response.get("output_text").isTextual()) {
            return response.get("output_text").asText();
        }

        StringBuilder texto = new StringBuilder();

        JsonNode output = response.path("output");
        if (output.isArray()) {
            for (JsonNode item : output) {
                JsonNode content = item.path("content");
                if (content.isArray()) {
                    for (JsonNode bloque : content) {
                        if (bloque.hasNonNull("text")) {
                            texto.append(bloque.get("text").asText()).append('\n');
                        } else if (bloque.hasNonNull("output_text")) {
                            texto.append(bloque.get("output_text").asText()).append('\n');
                        }
                    }
                }
            }
        }

        if (!texto.isEmpty()) {
            return texto.toString().trim();
        }

        throw new ResponseStatusException(
                org.springframework.http.HttpStatus.BAD_GATEWAY,
                "La respuesta de IA no incluyo texto util"
        );
    }

    private String extraerMensajeErrorApi(String rawBody) {
        try {
            JsonNode json = objectMapper.readTree(rawBody);
            String message = json.path("error").path("message").asText();

            if (message != null && !message.isBlank()) {
                return "Error IA: " + message;
            }
        } catch (Exception ignored) {
        }

        if (rawBody == null || rawBody.isBlank()) {
            return "La API de IA devolvio un error sin detalle";
        }

        return "Error IA: " + rawBody;
    }

    private String extraerJson(String contenido) {
        int inicio = contenido.indexOf('{');
        int fin = contenido.lastIndexOf('}');

        if (inicio < 0 || fin < 0 || fin <= inicio) {
            throw new IllegalArgumentException("No se encontro JSON en la respuesta");
        }

        return contenido.substring(inicio, fin + 1);
    }

    private List<String> leerArrayTexto(JsonNode node) {
        if (!node.isArray()) {
            return List.of();
        }

        List<String> valores = new ArrayList<>();
        for (JsonNode item : node) {
            valores.add(item.asText());
        }
        return valores;
    }

    private BigDecimal leerBigDecimal(JsonNode node, BigDecimal fallback) {
        if (node == null || node.isMissingNode() || node.isNull()) {
            return fallback;
        }

        try {
            return new BigDecimal(node.asText()).setScale(2, RoundingMode.HALF_UP);
        } catch (Exception e) {
            return fallback;
        }
    }

    private BigDecimal calcularRangoMinimo(List<PrendaResumenResponse> referencias) {
        return referencias.stream()
                .map(PrendaResumenResponse::precio)
                .min(BigDecimal::compareTo)
                .orElse(new BigDecimal("20.00"));
    }

    private BigDecimal calcularRangoMaximo(List<PrendaResumenResponse> referencias) {
        return referencias.stream()
                .map(PrendaResumenResponse::precio)
                .max(BigDecimal::compareTo)
                .orElse(new BigDecimal("120.00"));
    }

    private BigDecimal promedio(BigDecimal a, BigDecimal b) {
        return a.add(b).divide(new BigDecimal("2"), 2, RoundingMode.HALF_UP);
    }
}
