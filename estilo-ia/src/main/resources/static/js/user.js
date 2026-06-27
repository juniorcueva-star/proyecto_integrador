const API = "/api";
const token = localStorage.getItem("token");
const rol = localStorage.getItem("rol");
let currentUserId = Number(localStorage.getItem("usuarioId"));
const DEFAULT_PRENDA_IMAGE = "/img/prenda-default.png";
let fotoIaPreviewUrl = null;
let ultimaRecomendacionIa = null;

if (!token || rol !== "ROLE_USER") {
    window.location.href = "/login.html";
}

function authHeaders() {
    return {
        "Authorization": `Bearer ${token}`
    };
}

function authJsonHeaders() {
    return {
        ...authHeaders(),
        "Content-Type": "application/json"
    };
}

function resolvePrendaImage(imagenUrl) {
    return imagenUrl && imagenUrl.trim() ? imagenUrl : DEFAULT_PRENDA_IMAGE;
}

function renderPreviewFotoIa(file) {
    const preview = document.getElementById("previewFotoIa");
    if (!preview) return;

    if (fotoIaPreviewUrl) {
        URL.revokeObjectURL(fotoIaPreviewUrl);
        fotoIaPreviewUrl = null;
    }

    if (!file) {
        preview.innerHTML = "<span>Tu foto aparecera aqui</span>";
        return;
    }

    fotoIaPreviewUrl = URL.createObjectURL(file);
    preview.innerHTML = `<img src="${fotoIaPreviewUrl}" alt="Vista previa de tu foto">`;
}

function inicializarRecomendacionIa() {
    const fotoInput = document.getElementById("fotoIa");
    if (!fotoInput) return;

    fotoInput.addEventListener("change", event => {
        const file = event.target.files && event.target.files[0] ? event.target.files[0] : null;
        renderPreviewFotoIa(file);
    });
}

function esCategoriaSuperiorIa(categoria) {
    return ["POLO", "CAMISA", "CASACA", "CHOMPA"].includes(categoria);
}

function esCategoriaInferiorIa(categoria) {
    return ["PANTALON", "SHORT", "FALDA"].includes(categoria);
}

function renderSelectorCombinacionIa(referencias) {
    const contenedor = document.getElementById("ajusteCombinacionIa");
    if (!contenedor) return;

    const superiores = referencias.filter(prenda => esCategoriaSuperiorIa(prenda.categoria));
    const inferiores = referencias.filter(prenda => esCategoriaInferiorIa(prenda.categoria));

    if (superiores.length === 0 || inferiores.length === 0) {
        contenedor.innerHTML = `
            <div class="notice">
                Aun no hay suficientes prendas superiores e inferiores dentro de esta recomendacion para armar una combinacion guiada.
            </div>
        `;
        return;
    }

    contenedor.innerHTML = `
        <div class="ia-combo-panel">
            <h2>Arma tu combinacion guiada</h2>
            <p>Elige una prenda superior y una inferior de las sugeridas. Te devolvere una lectura de ajuste basada en tu estatura y contextura.</p>
            <div class="form-grid">
                <select id="prendaSuperiorIa" required>
                    <option value="">Selecciona prenda superior</option>
                    ${superiores.map(prenda => `<option value="${prenda.id}">${prenda.nombre} - ${prenda.categoria} - talla ${prenda.talla}</option>`).join("")}
                </select>
                <select id="prendaInferiorIa" required>
                    <option value="">Selecciona prenda inferior</option>
                    ${inferiores.map(prenda => `<option value="${prenda.id}">${prenda.nombre} - ${prenda.categoria} - talla ${prenda.talla}</option>`).join("")}
                </select>
                <button type="button" class="btn btn-primary full" onclick="adaptarCombinacionIa()">Evaluar combinacion</button>
            </div>
            <div id="mensajeAdaptacionIa" class="message"></div>
            <div id="resultadoAdaptacionIa" class="ia-combo-result"></div>
        </div>
    `;
}

async function readError(response, fallback) {
    try {
        const text = await response.text();
        if (!text) return fallback;

        try {
            const json = JSON.parse(text);
            return json.message || json.error || text;
        } catch (_) {
            return text;
        }
    } catch (_) {
        return fallback;
    }
}

function showSection(id) {
    document.querySelectorAll(".section").forEach(section => section.classList.remove("active"));

    const section = document.getElementById(id);
    if (section) {
        section.classList.add("active");
    }

    if (id === "inicio") cargarCatalogo();
    if (id === "pagos") cargarMetodosPago();
    if (id === "soporte") cargarMisReclamos();
    if (id === "perfil") cargarPerfil();
}

function logout() {
    localStorage.clear();
    window.location.href = "/login.html";
}

async function asegurarUsuarioActual() {
    if (Number.isFinite(currentUserId)) {
        return currentUserId;
    }

    try {
        const res = await fetch(`${API}/usuarios/me`, { headers: authHeaders() });
        if (!res.ok) {
            return null;
        }

        const usuario = await res.json();
        currentUserId = Number(usuario.id);

        if (Number.isFinite(currentUserId)) {
            localStorage.setItem("usuarioId", String(currentUserId));
        }

        return currentUserId;
    } catch (_) {
        return null;
    }
}

async function cargarCatalogo() {
    const contenedor = document.getElementById("catalogo");
    if (!contenedor) return;

    contenedor.innerHTML = `<div class="empty-state">Cargando prendas...</div>`;

    try {
        const res = await fetch(`${API}/prendas/catalogo`, { headers: authHeaders() });
        if (!res.ok) {
            throw new Error(await readError(res, "No se pudo cargar el catalogo"));
        }

        renderCatalogo(await res.json());
    } catch (error) {
        contenedor.innerHTML = `<div class="empty-state">${error.message}</div>`;
    }
}

async function buscarCatalogo() {
    const texto = document.getElementById("buscarTexto")?.value || "";
    const categoria = document.getElementById("categoriaFiltro")?.value || "";
    const min = document.getElementById("precioMinimo")?.value || "";
    const max = document.getElementById("precioMaximo")?.value || "";
    const minNumber = min ? Number(min) : null;
    const maxNumber = max ? Number(max) : null;

    if (minNumber !== null && minNumber < 0) {
        document.getElementById("catalogo").innerHTML = `<div class="empty-state">El precio minimo no puede ser negativo.</div>`;
        return;
    }

    if (maxNumber !== null && maxNumber < 0) {
        document.getElementById("catalogo").innerHTML = `<div class="empty-state">El precio maximo no puede ser negativo.</div>`;
        return;
    }

    if (minNumber !== null && maxNumber !== null && minNumber > maxNumber) {
        document.getElementById("catalogo").innerHTML = `<div class="empty-state">El precio minimo no puede ser mayor que el precio maximo.</div>`;
        return;
    }

    const params = new URLSearchParams();
    if (texto) params.append("texto", texto);
    if (categoria) params.append("categoria", categoria);
    if (min) params.append("precioMinimo", min);
    if (max) params.append("precioMaximo", max);

    const contenedor = document.getElementById("catalogo");
    contenedor.innerHTML = `<div class="empty-state">Buscando prendas...</div>`;

    try {
        const res = await fetch(`${API}/prendas/catalogo/buscar?${params.toString()}`, { headers: authHeaders() });
        if (!res.ok) {
            throw new Error(await readError(res, "No se pudo buscar prendas"));
        }

        renderCatalogo(await res.json());
    } catch (error) {
        contenedor.innerHTML = `<div class="empty-state">${error.message}</div>`;
    }
}

function renderCatalogo(prendas) {
    const contenedor = document.getElementById("catalogo");
    if (!contenedor) return;

    if (!Array.isArray(prendas) || prendas.length === 0) {
        contenedor.innerHTML = `<div class="empty-state">No hay prendas disponibles.</div>`;
        return;
    }

    contenedor.innerHTML = prendas.map(prenda => `
        <article class="card ${prenda.disponible ? "" : "card-unavailable"}">
            <div class="card-media">
                <img src="${resolvePrendaImage(prenda.imagenUrl)}" alt="${prenda.nombre}">
                ${prenda.disponible ? "" : `<div class="status-overlay">${prenda.estadoPublicacion}</div>`}
            </div>
            <span class="badge">${prenda.categoria}</span>
            <h3>${prenda.nombre}</h3>
            <p>${prenda.marca} | Talla ${prenda.talla}</p>
            <p>Vendedor: ${prenda.nombreVendedor}</p>
            <p class="price">S/ ${prenda.precio}</p>
            <button class="btn btn-primary" onclick="verDetallePrenda(${prenda.id})">
                Ver detalle
            </button>
        </article>
    `).join("");
}

async function verDetallePrenda(id) {
    const contenedor = document.getElementById("detallePrendaContenido");
    showSection("detallePrenda");
    contenedor.innerHTML = `<div class="empty-state">Cargando detalle de la prenda...</div>`;

    try {
        await asegurarUsuarioActual();

        const res = await fetch(`${API}/prendas/catalogo/${id}`, { headers: authHeaders() });
        if (!res.ok) {
            throw new Error(await readError(res, "No se pudo obtener el detalle de la prenda"));
        }

        const prenda = await res.json();
        const esPrendaPropia = Number.isFinite(currentUserId) && prenda.usuarioId === currentUserId;
        const accionesCompra = esPrendaPropia
            ? `
                <div class="notice" style="margin: 14px 0;">No puedes comprarte prendas a ti mismo.</div>
            `
            : prenda.disponible
            ? `
                <button class="btn btn-primary" onclick="mostrarMetodosPagoVendedor(${prenda.usuarioId})">
                    Comprar prenda
                </button>
            `
            : `
                <div class="notice" style="margin: 14px 0;">Esta prenda ya no esta disponible porque fue marcada como ${prenda.estadoPublicacion}.</div>
            `;

        contenedor.innerHTML = `
            <div class="modern-panel">
                <div class="profile-summary">
                    <div>
                        <img
                            src="${resolvePrendaImage(prenda.imagenUrl)}"
                            alt="${prenda.nombre}"
                            style="width:100%; max-height:430px; object-fit:cover; border-radius:24px;"
                        >
                    </div>

                    <div>
                        <span class="badge">${prenda.categoria}</span>
                        ${prenda.disponible ? "" : `<span class="badge badge-danger" style="margin-left:8px;">${prenda.estadoPublicacion}</span>`}
                        <h2 style="margin-top:14px;">${prenda.nombre}</h2>

                        <p><strong>Marca:</strong> ${prenda.marca}</p>
                        <p><strong>Descripcion:</strong> ${prenda.descripcion}</p>
                        <p><strong>Talla:</strong> ${prenda.talla}</p>
                        <p><strong>Color:</strong> ${prenda.color}</p>
                        <p><strong>Estado fisico:</strong> ${prenda.estadoFisico}</p>
                        <p><strong>Tipo de publicacion:</strong> ${prenda.tipoPublicacion}</p>
                        <p><strong>Estado:</strong> ${prenda.estadoPublicacion}</p>
                        <p><strong>Vendedor:</strong> ${prenda.nombreVendedor}</p>
                        <p><strong>Contacto:</strong> ${prenda.contacto}</p>
                        <p class="price">S/ ${prenda.precio}</p>
                        <p><strong>ID de prenda:</strong> ${prenda.id}</p>
                        <p><strong>ID vendedor:</strong> ${prenda.usuarioId}</p>

                        ${accionesCompra}

                        ${esPrendaPropia ? "" : `
                            <button class="btn btn-outline" onclick="mostrarPerfilVendedor(${prenda.usuarioId})">
                                Ver perfil del vendedor
                            </button>

                            <button class="btn btn-outline" onclick="prepararResena(${prenda.usuarioId})">
                                Dejar reseña
                            </button>
                        `}

                        ${esPrendaPropia ? "" : `
                            <button class="btn btn-outline" onclick="prepararReclamo(${prenda.usuarioId}, ${prenda.id})">
                                Reportar problema
                            </button>
                        `}
                    </div>
                </div>

                <div id="metodosPagoCompra" style="margin-top:28px;"></div>
                <div id="perfilVendedorDetalle" style="margin-top:28px;"></div>
                <div id="resenaVendedorDetalle" style="margin-top:28px;"></div>
            </div>
        `;
    } catch (error) {
        contenedor.innerHTML = `<div class="empty-state">${error.message}</div>`;
    }
}

async function mostrarMetodosPagoVendedor(usuarioId) {
    const contenedor = document.getElementById("metodosPagoCompra");
    await asegurarUsuarioActual();

    if (Number.isFinite(currentUserId) && usuarioId === currentUserId) {
        contenedor.innerHTML = `<div class="notice">No puedes comprarte prendas a ti mismo.</div>`;
        return;
    }

    contenedor.innerHTML = `<div class="empty-state">Cargando metodos de pago del vendedor...</div>`;

    try {
        const res = await fetch(`${API}/usuarios/${usuarioId}/perfil-publico`, { headers: authHeaders() });
        if (!res.ok) {
            throw new Error(await readError(res, "No se pudieron cargar los metodos de pago"));
        }

        const perfil = await res.json();
        const metodos = perfil.metodosPago || [];

        if (metodos.length === 0) {
            contenedor.innerHTML = `
                <div class="notice">
                    Este vendedor todavia no registro metodos de pago. Puedes contactarlo por WhatsApp o telefono.
                </div>
            `;
            return;
        }

        contenedor.innerHTML = `
            <h2>Metodos de pago del vendedor</h2>
            <p>Realiza el pago usando uno de estos metodos y conserva tu comprobante.</p>
            <div class="cards-grid">
                ${metodos.map(m => `
                    <article class="card">
                        ${m.imagenQrUrl ? `<img src="${m.imagenQrUrl}" alt="QR de pago">` : ""}
                        <span class="badge">${m.tipoMetodoPago}</span>
                        <h3>${m.titular || "Titular no registrado"}</h3>
                        <p><strong>Numero / Cuenta:</strong> ${m.numero || "No registrado"}</p>
                        <p>${m.instrucciones || "Coordina el pago con el vendedor."}</p>
                        ${perfil.telefono
                            ? `<a class="btn btn-primary" href="https://wa.me/51${perfil.telefono}" target="_blank" rel="noopener noreferrer" style="display:inline-block; margin-top:10px;">
                                Contactar vendedor
                            </a>`
                            : `<div class="notice" style="margin-top:10px;">El vendedor aun no registro telefono de contacto.</div>`}
                    </article>
                `).join("")}
            </div>
            <div class="notice" style="margin-top:18px;">
                Importante: Estilo IA no procesa pagos automaticamente. El pago es coordinado directamente entre comprador y vendedor.
            </div>
        `;
    } catch (error) {
        contenedor.innerHTML = `<div class="empty-state">${error.message}</div>`;
    }
}

async function cargarPerfil() {
    const contenedor = document.getElementById("perfilContenido");
    if (!contenedor) return;

    contenedor.innerHTML = `<div class="empty-state">Cargando perfil...</div>`;

    try {
        const res = await fetch(`${API}/usuarios/mi-perfil`, { headers: authHeaders() });
        if (!res.ok) {
            throw new Error(await readError(res, "No se pudo cargar el perfil"));
        }

        const perfil = await res.json();
        const prendas = perfil.prendasSubidas || [];
        const resenas = perfil.resenasRecibidas || [];
        const historial = perfil.historialMovimientos || [];

        contenedor.innerHTML = `
            <div class="profile-box">
                <div class="profile-summary">
                    <div>
                        <h2>${perfil.usuario.nombre}</h2>
                        <p><strong>Email:</strong> ${perfil.usuario.email}</p>
                        <p><strong>Telefono:</strong> ${perfil.usuario.telefono || "No registrado"}</p>
                        <p><strong>Calificacion:</strong> ${perfil.promedioCalificacion} estrella(s)</p>
                        <p><strong>Reseñas:</strong> ${perfil.cantidadResenas}</p>
                    </div>

                    <div class="stat-grid">
                        <div class="stat-card">
                            <strong>${perfil.estadisticas.totalPrendas}</strong>
                            <span>Prendas subidas</span>
                        </div>
                        <div class="stat-card">
                            <strong>${perfil.estadisticas.prendasVendidas}</strong>
                            <span>Vendidas</span>
                        </div>
                        <div class="stat-card">
                            <strong>${perfil.estadisticas.prendasIntercambiadas}</strong>
                            <span>Intercambiadas</span>
                        </div>
                        <div class="stat-card">
                            <strong>S/ ${perfil.estadisticas.dineroRecaudado}</strong>
                            <span>Recaudado</span>
                        </div>
                    </div>
                </div>

                <h3>Mis prendas</h3>
                ${renderPerfilPrendas(prendas)}

                <h3>Historial de ventas e intercambios</h3>
                ${renderHistorial(historial)}

                <h3>Reseñas recibidas</h3>
                ${renderResenas(resenas, "No tienes reseñas todavia.")}
            </div>
        `;
    } catch (error) {
        contenedor.innerHTML = `<div class="empty-state">${error.message}</div>`;
    }
}

function renderPerfilPrendas(prendas) {
    if (!Array.isArray(prendas) || prendas.length === 0) {
        return `<div class="empty-state">Todavia no tienes prendas publicadas.</div>`;
    }

    return `
        <div class="cards-grid">
            ${prendas.map(p => `
                <article class="card ${p.disponible ? "" : "card-unavailable"}">
                    <div class="card-media">
                        <img src="${resolvePrendaImage(p.imagenUrl)}" alt="${p.nombre}">
                        ${p.disponible ? "" : `<div class="status-overlay">${p.estadoPublicacion}</div>`}
                    </div>
                    <span class="badge">${p.estadoPublicacion}</span>
                    <h3>${p.nombre}</h3>
                    <p>${p.marca} | ${p.categoria}</p>
                    <p>Talla: ${p.talla}</p>
                    <p class="price">S/ ${p.precio}</p>
                    <button class="btn btn-primary" onclick="abrirEditorPrenda(${p.id})">Editar</button>
                    <button class="btn btn-outline" onclick="marcarPrendaVendida(${p.id})">Vendida</button>
                    <button class="btn btn-outline" onclick="marcarPrendaIntercambiada(${p.id})">Intercambiada</button>
                    <button class="btn btn-outline" onclick="pausarPrenda(${p.id})">Pausar</button>
                    <button class="btn btn-outline" onclick="publicarPrenda(${p.id})">Publicar</button>
                    <button class="btn btn-danger" onclick="eliminarPrenda(${p.id})">Eliminar</button>
                </article>
            `).join("")}
        </div>
    `;
}

function renderHistorial(historial) {
    if (!Array.isArray(historial) || historial.length === 0) {
        return `<div class="empty-state">Todavia no tienes movimientos registrados.</div>`;
    }

    return `
        <div class="cards-grid">
            ${historial.map(item => `
                <article class="card card-unavailable">
                    <div class="card-media">
                        <img src="${resolvePrendaImage(item.imagenUrl)}" alt="${item.nombre}">
                        <div class="status-overlay">${item.estadoPublicacion}</div>
                    </div>
                    <span class="badge badge-danger">${item.estadoPublicacion}</span>
                    <h3>${item.nombre}</h3>
                    <p>${item.marca} | ${item.categoria}</p>
                    <p>Talla: ${item.talla}</p>
                    <p class="price">S/ ${item.precio}</p>
                </article>
            `).join("")}
        </div>
    `;
}

function renderResenas(resenas, emptyMessage) {
    if (!Array.isArray(resenas) || resenas.length === 0) {
        return `<div class="empty-state">${emptyMessage}</div>`;
    }

    return resenas.map(r => `
        <div class="card">
            <p><strong>${r.nombreAutor}</strong> - ${r.calificacion} estrella(s)</p>
            <p>${r.comentario}</p>
        </div>
    `).join("");
}

const prendaForm = document.getElementById("prendaForm");
if (prendaForm) {
    prendaForm.addEventListener("submit", async event => {
        event.preventDefault();

        const mensaje = document.getElementById("mensajePrenda");
        const imagenInput = document.getElementById("imagen");

        if (!imagenInput.files || imagenInput.files.length === 0) {
            mensaje.textContent = "Debes seleccionar una imagen";
            mensaje.style.color = "#b42318";
            return;
        }

        const archivo = imagenInput.files[0];
        if (!["image/png", "image/jpeg", "image/jpg", "image/webp"].includes(archivo.type)) {
            mensaje.textContent = "Solo se permiten imagenes PNG, JPG, JPEG o WEBP";
            mensaje.style.color = "#b42318";
            return;
        }

        const precio = Number(document.getElementById("precio").value);
        if (Number.isNaN(precio) || precio < 0) {
            mensaje.textContent = "El precio no puede ser negativo";
            mensaje.style.color = "#b42318";
            return;
        }

        const formData = new FormData();
        formData.append("nombre", document.getElementById("nombrePrenda").value);
        formData.append("descripcion", document.getElementById("descripcion").value);
        formData.append("marca", document.getElementById("marca").value);
        formData.append("color", document.getElementById("color").value);
        formData.append("talla", document.getElementById("talla").value);
        formData.append("categoria", document.getElementById("categoria").value);
        formData.append("estadoFisico", document.getElementById("estadoFisico").value);
        formData.append("precio", document.getElementById("precio").value);
        formData.append("tipoPublicacion", document.getElementById("tipoPublicacion").value);
        formData.append("contacto", document.getElementById("contacto").value);
        formData.append("imagen", archivo);

        mensaje.textContent = "Guardando prenda...";
        mensaje.style.color = "#1f4d3a";

        try {
            const res = await fetch(`${API}/prendas/con-imagen`, {
                method: "POST",
                headers: authHeaders(),
                body: formData
            });

            if (!res.ok) {
                throw new Error(await readError(res, "No se pudo guardar la prenda"));
            }

            mensaje.textContent = "Prenda agregada correctamente";
            mensaje.style.color = "#1f4d3a";
            prendaForm.reset();
            cargarCatalogo();
        } catch (error) {
            mensaje.textContent = `Error: ${error.message}`;
            mensaje.style.color = "#b42318";
        }
    });
}

async function analizarFotoPrendaIa() {
    const mensaje = document.getElementById("mensajePrenda");
    const imagenInput = document.getElementById("imagen");
    const archivo = imagenInput && imagenInput.files ? imagenInput.files[0] : null;

    if (!archivo) {
        mensaje.textContent = "Primero sube una foto de la prenda";
        mensaje.style.color = "#b42318";
        return;
    }

    if (!["image/png", "image/jpeg", "image/jpg", "image/webp"].includes(archivo.type)) {
        mensaje.textContent = "La foto debe ser PNG, JPG, JPEG o WEBP";
        mensaje.style.color = "#b42318";
        return;
    }

    const formData = new FormData();
    formData.append("foto", archivo);

    mensaje.textContent = "Analizando foto y completando datos...";
    mensaje.style.color = "#1f4d3a";

    try {
        const res = await fetch(`${API}/ia/analizar-prenda-foto`, {
            method: "POST",
            headers: authHeaders(),
            body: formData
        });

        if (!res.ok) {
            throw new Error(await readError(res, "No se pudo analizar la foto"));
        }

        const data = await res.json();
        document.getElementById("nombrePrenda").value = data.nombre || "";
        document.getElementById("descripcion").value = data.descripcion || "";
        document.getElementById("marca").value = data.marca || "";
        document.getElementById("color").value = data.color || "";
        document.getElementById("talla").value = data.talla || "";
        document.getElementById("categoria").value = data.categoria || "";
        document.getElementById("estadoFisico").value = data.estadoFisico || "";
        document.getElementById("precio").value = data.precio || "";
        document.getElementById("tipoPublicacion").value = data.tipoPublicacion || "VENTA";

        const observaciones = Array.isArray(data.observaciones) && data.observaciones.length > 0
            ? ` Observaciones: ${data.observaciones.join(" | ")}`
            : "";

        mensaje.textContent = `Formulario completado con ayuda de IA.${observaciones}`;
        mensaje.style.color = "#1f4d3a";
    } catch (error) {
        mensaje.textContent = `Error: ${error.message}`;
        mensaje.style.color = "#b42318";
    }
}

async function generarDescripcionIa() {
    const mensaje = document.getElementById("mensajePrenda");
    mensaje.textContent = "Generando descripcion con IA...";
    mensaje.style.color = "#1f4d3a";

    const data = {
        nombre: document.getElementById("nombrePrenda").value,
        marca: document.getElementById("marca").value,
        color: document.getElementById("color").value,
        talla: document.getElementById("talla").value,
        categoria: document.getElementById("categoria").value,
        estadoFisico: document.getElementById("estadoFisico").value,
        tipoPublicacion: document.getElementById("tipoPublicacion").value
    };

    if (Object.values(data).some(value => !value)) {
        mensaje.textContent = "Completa nombre, marca, color, talla, categoria, estado y tipo antes de usar IA";
        mensaje.style.color = "#b42318";
        return;
    }

    try {
        const res = await fetch(`${API}/ia/generar-descripcion`, {
            method: "POST",
            headers: authJsonHeaders(),
            body: JSON.stringify(data)
        });

        if (!res.ok) {
            throw new Error(await readError(res, "No se pudo generar la descripcion"));
        }

        const respuesta = await res.json();
        document.getElementById("nombrePrenda").value = respuesta.tituloSugerido || data.nombre;
        document.getElementById("descripcion").value = respuesta.descripcion || "";
        mensaje.textContent = "Descripcion generada correctamente";
        mensaje.style.color = "#1f4d3a";
    } catch (error) {
        mensaje.textContent = `Error: ${error.message}`;
        mensaje.style.color = "#b42318";
    }
}

async function sugerirPrecioIa() {
    const mensaje = document.getElementById("mensajePrenda");
    mensaje.textContent = "Calculando precio sugerido...";
    mensaje.style.color = "#1f4d3a";

    const data = {
        nombre: document.getElementById("nombrePrenda").value,
        marca: document.getElementById("marca").value,
        color: document.getElementById("color").value,
        categoria: document.getElementById("categoria").value,
        estadoFisico: document.getElementById("estadoFisico").value,
        tipoPublicacion: document.getElementById("tipoPublicacion").value,
        talla: document.getElementById("talla").value,
        limiteReferencias: 6
    };

    const precioActual = Number(document.getElementById("precio").value || "0");
    if (precioActual < 0) {
        mensaje.textContent = "El precio no puede ser negativo";
        mensaje.style.color = "#b42318";
        return;
    }

    if (Object.values(data).some(value => value === "" || value === null || value === undefined)) {
        mensaje.textContent = "Completa los campos principales antes de solicitar una sugerencia de precio";
        mensaje.style.color = "#b42318";
        return;
    }

    try {
        const res = await fetch(`${API}/ia/sugerir-precio`, {
            method: "POST",
            headers: authJsonHeaders(),
            body: JSON.stringify(data)
        });

        if (!res.ok) {
            throw new Error(await readError(res, "No se pudo sugerir el precio"));
        }

        const respuesta = await res.json();
        document.getElementById("precio").value = respuesta.precioSugerido;
        mensaje.textContent = `Precio sugerido: S/ ${respuesta.precioSugerido}. ${respuesta.explicacion}`;
        mensaje.style.color = "#1f4d3a";
    } catch (error) {
        mensaje.textContent = `Error: ${error.message}`;
        mensaje.style.color = "#b42318";
    }
}

const metodoPagoForm = document.getElementById("metodoPagoForm");
if (metodoPagoForm) {
    metodoPagoForm.addEventListener("submit", async event => {
        event.preventDefault();

        const mensaje = document.getElementById("mensajePago");
        const formData = new FormData();
        const imagenQr = document.getElementById("imagenQrPago").files[0];

        if (imagenQr && imagenQr.type !== "image/png") {
            mensaje.textContent = "Solo se permiten imagenes PNG para el QR";
            mensaje.style.color = "#b42318";
            return;
        }

        formData.append("tipoMetodoPago", document.getElementById("tipoMetodoPago").value);
        formData.append("numero", document.getElementById("numeroPago").value);
        formData.append("titular", document.getElementById("titularPago").value);
        formData.append("instrucciones", document.getElementById("instruccionesPago").value);
        if (imagenQr) formData.append("imagenQr", imagenQr);

        mensaje.textContent = "Guardando metodo de pago...";
        mensaje.style.color = "#1f4d3a";

        try {
            const res = await fetch(`${API}/metodos-pago/con-qr`, {
                method: "POST",
                headers: authHeaders(),
                body: formData
            });

            if (!res.ok) {
                throw new Error(await readError(res, "No se pudo guardar el metodo de pago"));
            }

            mensaje.textContent = "Metodo de pago guardado correctamente";
            mensaje.style.color = "#1f4d3a";
            metodoPagoForm.reset();
            cargarMetodosPago();
        } catch (error) {
            mensaje.textContent = `Error: ${error.message}`;
            mensaje.style.color = "#b42318";
        }
    });
}

async function cargarMetodosPago() {
    const contenedor = document.getElementById("listaMetodosPago");
    if (!contenedor) return;

    contenedor.innerHTML = `<div class="empty-state">Cargando metodos de pago...</div>`;

    try {
        const res = await fetch(`${API}/metodos-pago/mis-metodos`, { headers: authHeaders() });
        if (!res.ok) {
            throw new Error(await readError(res, "No se pudieron cargar los metodos de pago"));
        }

        const metodos = await res.json();
        if (!Array.isArray(metodos) || metodos.length === 0) {
            contenedor.innerHTML = `<div class="empty-state">Todavia no registraste metodos de pago.</div>`;
            return;
        }

        contenedor.innerHTML = metodos.map(m => `
            <article class="card">
                ${m.imagenQrUrl ? `<img src="${m.imagenQrUrl}" alt="QR de pago">` : ""}
                <span class="badge">${m.tipoMetodoPago}</span>
                <h3>${m.titular || "Sin titular"}</h3>
                <p><strong>Numero/Cuenta:</strong> ${m.numero || "No registrado"}</p>
                <p><strong>Estado:</strong> ${m.activo ? "Activo" : "Inactivo"}</p>
                <p>${m.instrucciones || ""}</p>
                ${m.activo
                    ? `<button class="btn btn-outline" onclick="desactivarMetodoPago(${m.id})">Desactivar</button>`
                    : `<button class="btn btn-primary" onclick="activarMetodoPago(${m.id})">Activar</button>`}
                <button class="btn btn-danger" onclick="eliminarMetodoPago(${m.id})">Eliminar</button>
            </article>
        `).join("");
    } catch (error) {
        contenedor.innerHTML = `<div class="empty-state">${error.message}</div>`;
    }
}

async function activarMetodoPago(id) {
    await fetch(`${API}/metodos-pago/${id}/activar`, { method: "PATCH", headers: authHeaders() });
    cargarMetodosPago();
}

async function desactivarMetodoPago(id) {
    await fetch(`${API}/metodos-pago/${id}/desactivar`, { method: "PATCH", headers: authHeaders() });
    cargarMetodosPago();
}

async function eliminarMetodoPago(id) {
    if (!confirm("¿Eliminar este metodo de pago?")) return;
    await fetch(`${API}/metodos-pago/${id}`, { method: "DELETE", headers: authHeaders() });
    cargarMetodosPago();
}

async function prepararReclamo(usuarioReportadoId, prendaId) {
    await asegurarUsuarioActual();
    if (Number.isFinite(currentUserId) && usuarioReportadoId === currentUserId) {
        alert("No puedes hacerte reclamos a ti mismo");
        return;
    }

    showSection("soporte");
    document.getElementById("usuarioReportadoId").value = usuarioReportadoId;
    document.getElementById("prendaReclamoId").value = prendaId;
    document.getElementById("motivoReclamo").value = "OTRO";
    const descripcionInput = document.getElementById("descripcionReclamo");
    descripcionInput.focus();
    descripcionInput.placeholder = "Describe el problema con esta prenda o vendedor...";
}

const reclamoForm = document.getElementById("reclamoForm");
if (reclamoForm) {
    reclamoForm.addEventListener("submit", async event => {
        event.preventDefault();

        const mensaje = document.getElementById("mensajeReclamo");
        const data = {
            usuarioReportadoId: document.getElementById("usuarioReportadoId").value ? Number(document.getElementById("usuarioReportadoId").value) : null,
            prendaId: document.getElementById("prendaReclamoId").value ? Number(document.getElementById("prendaReclamoId").value) : null,
            motivo: document.getElementById("motivoReclamo").value,
            descripcion: document.getElementById("descripcionReclamo").value
        };

        if (!data.motivo || !data.descripcion.trim()) {
            mensaje.textContent = "Debes seleccionar un motivo y escribir la descripcion";
            mensaje.style.color = "#b42318";
            return;
        }

        mensaje.textContent = "Enviando reclamo...";
        mensaje.style.color = "#1f4d3a";

        try {
            const res = await fetch(`${API}/reclamos`, {
                method: "POST",
                headers: authJsonHeaders(),
                body: JSON.stringify(data)
            });

            if (!res.ok) {
                throw new Error(await readError(res, "No se pudo enviar el reclamo"));
            }

            mensaje.textContent = "Reclamo enviado correctamente";
            mensaje.style.color = "#1f4d3a";
            reclamoForm.reset();
            cargarMisReclamos();
        } catch (error) {
            mensaje.textContent = `Error: ${error.message}`;
            mensaje.style.color = "#b42318";
        }
    });
}

async function cargarMisReclamos() {
    const contenedor = document.getElementById("listaMisReclamos");
    if (!contenedor) return;

    contenedor.innerHTML = `<div class="empty-state">Cargando reclamos...</div>`;

    try {
        const res = await fetch(`${API}/reclamos/mis-reclamos`, { headers: authHeaders() });
        if (!res.ok) {
            throw new Error(await readError(res, "No se pudieron cargar tus reclamos"));
        }

        const reclamos = await res.json();
        if (!Array.isArray(reclamos) || reclamos.length === 0) {
            contenedor.innerHTML = `<div class="empty-state">Todavia no registraste reclamos.</div>`;
            return;
        }

        contenedor.innerHTML = reclamos.map(r => `
            <article class="card">
                <span class="badge">${r.estado}</span>
                <h3>${r.motivo}</h3>
                <p><strong>Reportado:</strong> ${r.nombreUsuarioReportado}</p>
                <p><strong>Prenda:</strong> ${r.nombrePrenda}</p>
                <p><strong>Descripcion:</strong> ${r.descripcion}</p>
                <p><strong>Respuesta admin:</strong> ${r.respuestaAdmin || "Pendiente de revision"}</p>
            </article>
        `).join("");
    } catch (error) {
        contenedor.innerHTML = `<div class="empty-state">${error.message}</div>`;
    }
}

async function abrirEditorPrenda(id) {
    const mensaje = document.getElementById("mensajeEditarPrenda");
    showSection("editarPrenda");

    try {
        const res = await fetch(`${API}/prendas/mis-prendas/${id}`, { headers: authHeaders() });
        if (!res.ok) {
            throw new Error(await readError(res, "No se pudo cargar la prenda"));
        }

        const p = await res.json();
        document.getElementById("editarPrendaId").value = p.id;
        document.getElementById("editarNombrePrenda").value = p.nombre;
        document.getElementById("editarMarca").value = p.marca;
        document.getElementById("editarDescripcion").value = p.descripcion;
        document.getElementById("editarCategoria").value = p.categoria;
        document.getElementById("editarTalla").value = p.talla;
        document.getElementById("editarColor").value = p.color;
        document.getElementById("editarEstadoFisico").value = p.estadoFisico;
        document.getElementById("editarPrecio").value = p.precio;
        document.getElementById("editarTipoPublicacion").value = p.tipoPublicacion;
        document.getElementById("editarContacto").value = p.contacto;
        document.getElementById("editarImagenUrl").value = p.imagenUrl || "";
        mensaje.textContent = "";
    } catch (error) {
        mensaje.textContent = `Error: ${error.message}`;
        mensaje.style.color = "#b42318";
    }
}

const editarPrendaForm = document.getElementById("editarPrendaForm");
if (editarPrendaForm) {
    editarPrendaForm.addEventListener("submit", async event => {
        event.preventDefault();

        const id = document.getElementById("editarPrendaId").value;
        const mensaje = document.getElementById("mensajeEditarPrenda");
        const data = {
            nombre: document.getElementById("editarNombrePrenda").value,
            descripcion: document.getElementById("editarDescripcion").value,
            marca: document.getElementById("editarMarca").value,
            color: document.getElementById("editarColor").value,
            talla: document.getElementById("editarTalla").value,
            categoria: document.getElementById("editarCategoria").value,
            estadoFisico: document.getElementById("editarEstadoFisico").value,
            precio: Number(document.getElementById("editarPrecio").value),
            tipoPublicacion: document.getElementById("editarTipoPublicacion").value,
            contacto: document.getElementById("editarContacto").value,
            imagenUrl: document.getElementById("editarImagenUrl").value
        };

        if (Number.isNaN(data.precio) || data.precio < 0) {
            mensaje.textContent = "El precio no puede ser negativo";
            mensaje.style.color = "#b42318";
            return;
        }

        mensaje.textContent = "Guardando cambios...";
        mensaje.style.color = "#1f4d3a";

        try {
            const res = await fetch(`${API}/prendas/${id}`, {
                method: "PUT",
                headers: authJsonHeaders(),
                body: JSON.stringify(data)
            });

            if (!res.ok) {
                throw new Error(await readError(res, "No se pudo editar la prenda"));
            }

            mensaje.textContent = "Prenda actualizada correctamente";
            mensaje.style.color = "#1f4d3a";
            cargarPerfil();
            setTimeout(() => showSection("perfil"), 700);
        } catch (error) {
            mensaje.textContent = `Error: ${error.message}`;
            mensaje.style.color = "#b42318";
        }
    });
}

async function eliminarPrenda(id) {
    if (!confirm("¿Seguro que deseas eliminar esta prenda?")) return;

    const res = await fetch(`${API}/prendas/${id}`, { method: "DELETE", headers: authHeaders() });
    if (!res.ok) {
        alert("No se pudo eliminar la prenda");
        return;
    }

    alert("Prenda eliminada correctamente");
    cargarPerfil();
}

async function marcarPrendaVendida(id) {
    await cambiarEstadoPrenda(id, "vendida", "Prenda marcada como vendida");
}

async function marcarPrendaIntercambiada(id) {
    await cambiarEstadoPrenda(id, "intercambiada", "Prenda marcada como intercambiada");
}

async function pausarPrenda(id) {
    await cambiarEstadoPrenda(id, "pausar", "Prenda pausada correctamente");
}

async function publicarPrenda(id) {
    await cambiarEstadoPrenda(id, "publicar", "Prenda publicada correctamente");
}

async function cambiarEstadoPrenda(id, accion, mensajeExito) {
    const res = await fetch(`${API}/prendas/${id}/${accion}`, { method: "PATCH", headers: authHeaders() });
    if (!res.ok) {
        alert("No se pudo actualizar la prenda");
        return;
    }

    alert(mensajeExito);
    cargarPerfil();
}

async function mostrarPerfilVendedor(usuarioId) {
    const contenedor = document.getElementById("perfilVendedorDetalle");
    if (!contenedor) return;

    contenedor.innerHTML = `<div class="empty-state">Cargando perfil del vendedor...</div>`;

    try {
        const res = await fetch(`${API}/usuarios/${usuarioId}/perfil-publico`, { headers: authHeaders() });
        if (!res.ok) {
            throw new Error(await readError(res, "No se pudo cargar el perfil del vendedor"));
        }

        const perfil = await res.json();
        contenedor.innerHTML = `
            <div class="modern-panel">
                <h2>Perfil del vendedor</h2>
                <div class="stat-grid">
                    <div class="stat-card">
                        <strong>${perfil.nombre}</strong>
                        <span>Vendedor</span>
                    </div>
                    <div class="stat-card">
                        <strong>${perfil.promedioCalificacion} estrella(s)</strong>
                        <span>Calificacion</span>
                    </div>
                    <div class="stat-card">
                        <strong>${perfil.cantidadResenas}</strong>
                        <span>Reseñas</span>
                    </div>
                    <div class="stat-card">
                        <strong>${perfil.telefono || "No registrado"}</strong>
                        <span>Contacto</span>
                    </div>
                </div>
                <h3>Reseñas recibidas</h3>
                ${renderResenas(perfil.resenasRecibidas || [], "Este vendedor aun no tiene reseñas.")}
            </div>
        `;
    } catch (error) {
        contenedor.innerHTML = `<div class="empty-state">${error.message}</div>`;
    }
}

function prepararResena(receptorId) {
    const contenedor = document.getElementById("resenaVendedorDetalle");
    if (!contenedor) return;

    contenedor.innerHTML = `
        <div class="modern-panel">
            <h2>Dejar reseña al vendedor</h2>
            <p>Califica tu experiencia con este usuario.</p>
            <form id="resenaForm" class="form">
                <input type="hidden" id="resenaReceptorId" value="${receptorId}">
                <select id="calificacionResena" required>
                    <option value="">Selecciona calificacion</option>
                    <option value="5">5 estrellas - Excelente</option>
                    <option value="4">4 estrellas - Muy bueno</option>
                    <option value="3">3 estrellas - Regular</option>
                    <option value="2">2 estrellas - Malo</option>
                    <option value="1">1 estrella - Muy malo</option>
                </select>
                <textarea id="comentarioResena" required placeholder="Escribe tu comentario sobre el vendedor"></textarea>
                <button type="submit" class="btn btn-primary">Enviar reseña</button>
            </form>
            <div id="mensajeResena" class="message"></div>
        </div>
    `;

    document.getElementById("resenaForm").addEventListener("submit", async event => {
        event.preventDefault();
        await enviarResena();
    });
}

async function enviarResena() {
    const mensaje = document.getElementById("mensajeResena");
    const data = {
        receptorId: Number(document.getElementById("resenaReceptorId").value),
        calificacion: Number(document.getElementById("calificacionResena").value),
        comentario: document.getElementById("comentarioResena").value
    };

    mensaje.textContent = "Enviando reseña...";
    mensaje.style.color = "#1f4d3a";

    try {
        const res = await fetch(`${API}/resenas`, {
            method: "POST",
            headers: authJsonHeaders(),
            body: JSON.stringify(data)
        });

        if (!res.ok) {
            throw new Error(await readError(res, "No se pudo enviar la reseña"));
        }

        mensaje.textContent = "Reseña enviada correctamente";
        mensaje.style.color = "#1f4d3a";
        document.getElementById("resenaForm").reset();
    } catch (error) {
        mensaje.textContent = `Error: ${error.message}`;
        mensaje.style.color = "#b42318";
    }
}

async function generarRecomendacionIa(event) {
    event.preventDefault();

    const resultado = document.getElementById("resultadoSimulacionIa");
    const mensaje = document.getElementById("mensajeRecomendacionIa");
    const fotoInput = document.getElementById("fotoIa");
    const foto = fotoInput && fotoInput.files ? fotoInput.files[0] : null;
    const estaturaCm = Number(document.getElementById("estaturaIa").value);
    const contextura = document.getElementById("contexturaIa").value;
    const ajusteCombinacion = document.getElementById("ajusteCombinacionIa");

    if (!foto) {
        mensaje.textContent = "Debes subir una foto para solicitar la recomendacion";
        mensaje.style.color = "#b42318";
        return;
    }

    if (!["image/png", "image/jpeg", "image/jpg", "image/webp"].includes(foto.type)) {
        mensaje.textContent = "La foto debe ser PNG, JPG, JPEG o WEBP";
        mensaje.style.color = "#b42318";
        return;
    }

    if (Number.isNaN(estaturaCm) || estaturaCm < 140 || estaturaCm > 205) {
        mensaje.textContent = "La estatura debe estar entre 140 y 205 cm";
        mensaje.style.color = "#b42318";
        return;
    }

    if (!["DELGADA", "NORMAL", "CONTEXTURA_GRUESA"].includes(contextura)) {
        mensaje.textContent = "Debes seleccionar una contextura valida";
        mensaje.style.color = "#b42318";
        return;
    }

    const estilo = document.getElementById("estiloIa").value;
    const ocasion = document.getElementById("ocasionIa").value;
    const clima = document.getElementById("climaIa").value;
    const formData = new FormData();
    formData.append("foto", foto);
    formData.append("estilo", estilo);
    formData.append("ocasion", ocasion);
    formData.append("clima", clima);
    formData.append("estaturaCm", String(estaturaCm));
    formData.append("contextura", contextura);

    mensaje.textContent = "Analizando foto y cruzando prendas del catalogo...";
    mensaje.style.color = "#1f4d3a";
    resultado.innerHTML = `<div class="empty-state">Generando recomendacion...</div>`;
    if (ajusteCombinacion) ajusteCombinacion.innerHTML = "";

    try {
        const res = await fetch(`${API}/ia/recomendar-look-con-foto`, {
            method: "POST",
            headers: authHeaders(),
            body: formData
        });

        if (!res.ok) {
            throw new Error(await readError(res, "No se pudo generar la recomendacion"));
        }

        const respuesta = await res.json();
        const referencias = respuesta.referenciasCatalogo || [];
        const prendas = respuesta.prendasSugeridas || [];
        const razones = respuesta.razones || [];
        const pasos = respuesta.pasosSugeridos || [];
        ultimaRecomendacionIa = {
            estilo,
            ocasion,
            clima,
            estaturaCm,
            contextura,
            referencias
        };

        resultado.innerHTML = `
            <div class="ia-result-layout">
                <div class="ia-result-main">
                    <div class="ia-meta">
                        <span class="ia-pill">${estilo}</span>
                        <span class="ia-pill">${ocasion}</span>
                        <span class="ia-pill">${clima}</span>
                        <span class="ia-pill">${estaturaCm} cm</span>
                        <span class="ia-pill">${contextura === "CONTEXTURA_GRUESA" ? "Contextura gruesa" : contextura.charAt(0) + contextura.slice(1).toLowerCase()}</span>
                    </div>

                    <h3>Perfil corporal usado</h3>
                    <p>${respuesta.resumenPerfilUsuario || ""}</p>

                    <h3>Lectura visual general</h3>
                    <p>${respuesta.perfilVisual || "Se preparo una recomendacion visual general."}</p>

                    <h3 class="ia-subtitle">Propuesta de look</h3>
                    <p>${respuesta.recomendacionGeneral || ""}</p>

                    <h3 class="ia-subtitle">Prendas sugeridas</h3>
                    <ul class="plain-list">
                        ${prendas.map(item => `<li>${item}</li>`).join("")}
                    </ul>

                    <h3 class="ia-subtitle">Por que pueden funcionarte</h3>
                    <ul class="plain-list">
                        ${razones.map(item => `<li>${item}</li>`).join("")}
                    </ul>

                    <h3 class="ia-subtitle">Siguiente paso</h3>
                    <ul class="plain-list">
                        ${pasos.map(item => `<li>${item}</li>`).join("")}
                    </ul>
                </div>

                <aside class="ia-result-side">
                    <div>
                        <h3>Tu referencia</h3>
                        <div class="ia-inline-preview">
                            <img src="${fotoIaPreviewUrl || ""}" alt="Tu foto cargada">
                        </div>
                    </div>
                    <div>
                        <h3>Resumen rapido</h3>
                        <p>La recomendacion prioriza prendas activas del catalogo y las ajusta a tu ocasion, clima y proporciones.</p>
                    </div>
                </aside>
            </div>
            ${referencias.length === 0 ? "" : `
                <div style="margin-top:18px;">
                    <h3>Prendas reales recomendadas del catalogo</h3>
                    <div class="cards-grid">
                        ${referencias.map(prenda => `
                            <article class="card">
                                <div class="card-media">
                                    <img src="${resolvePrendaImage(prenda.imagenUrl)}" alt="${prenda.nombre}">
                                </div>
                                <span class="badge">${prenda.categoria}</span>
                                <h3>${prenda.nombre}</h3>
                                <p>${prenda.marca} | ${prenda.talla}</p>
                                <p>${prenda.nombreVendedor || "Catalogo activo"}</p>
                                <p class="price">S/ ${prenda.precio}</p>
                                <button class="btn btn-outline" onclick="verDetallePrenda(${prenda.id})">Ver detalle</button>
                            </article>
                        `).join("")}
                    </div>
                </div>
            `}  
        `;
        mensaje.textContent = "Recomendacion generada correctamente";
        mensaje.style.color = "#1f4d3a";
        renderSelectorCombinacionIa(referencias);
    } catch (error) {
        mensaje.textContent = `Error: ${error.message}`;
        mensaje.style.color = "#b42318";
        resultado.innerHTML = `<div class="empty-state">${error.message}</div>`;
        if (ajusteCombinacion) ajusteCombinacion.innerHTML = "";
    }
}

async function adaptarCombinacionIa() {
    const mensaje = document.getElementById("mensajeAdaptacionIa");
    const resultado = document.getElementById("resultadoAdaptacionIa");
    const prendaSuperiorId = Number(document.getElementById("prendaSuperiorIa").value);
    const prendaInferiorId = Number(document.getElementById("prendaInferiorIa").value);
    const estaturaCm = Number(document.getElementById("estaturaIa").value);
    const contextura = document.getElementById("contexturaIa").value;
    const ocasion = document.getElementById("ocasionIa").value;

    if (!prendaSuperiorId || !prendaInferiorId) {
        mensaje.textContent = "Debes elegir una prenda superior y una inferior";
        mensaje.style.color = "#b42318";
        return;
    }

    mensaje.textContent = "Evaluando combinacion con tu perfil...";
    mensaje.style.color = "#1f4d3a";
    resultado.innerHTML = `<div class="empty-state">Procesando combinacion...</div>`;

    try {
        const res = await fetch(`${API}/ia/adaptar-combinacion`, {
            method: "POST",
            headers: authJsonHeaders(),
            body: JSON.stringify({
                prendaSuperiorId,
                prendaInferiorId,
                estaturaCm,
                contextura,
                ocasion
            })
        });

        if (!res.ok) {
            throw new Error(await readError(res, "No se pudo evaluar la combinacion"));
        }

        const data = await res.json();
        resultado.innerHTML = `
            <div class="ia-result-layout">
                <div class="ia-result-main">
                    <div class="ia-meta">
                        <span class="ia-pill">${data.modoRespuesta}</span>
                        <span class="ia-pill">${data.tallaSuperiorSugerida}</span>
                        <span class="ia-pill">${data.tallaInferiorSugerida}</span>
                    </div>

                    <h3>Resumen del perfil</h3>
                    <p>${data.resumenPerfil}</p>

                    <h3 class="ia-subtitle">Lectura general</h3>
                    <p>${data.evaluacionGeneral}</p>

                    <h3 class="ia-subtitle">Prenda superior</h3>
                    <p>${data.recomendacionSuperior}</p>

                    <h3 class="ia-subtitle">Prenda inferior</h3>
                    <p>${data.recomendacionInferior}</p>

                    <h3 class="ia-subtitle">Equilibrio visual</h3>
                    <p>${data.equilibrioVisual}</p>

                    <div class="notice" style="margin-top:18px;">${data.notaAjuste}</div>
                </div>

                <aside class="ia-result-side">
                    <div>
                        <h3>Prenda superior elegida</h3>
                        <div class="card">
                            <div class="card-media">
                                <img src="${resolvePrendaImage(data.prendaSuperior.imagenUrl)}" alt="${data.prendaSuperior.nombre}">
                            </div>
                            <span class="badge">${data.prendaSuperior.categoria}</span>
                            <h3>${data.prendaSuperior.nombre}</h3>
                            <p>Talla ${data.prendaSuperior.talla}</p>
                        </div>
                    </div>
                    <div>
                        <h3>Prenda inferior elegida</h3>
                        <div class="card">
                            <div class="card-media">
                                <img src="${resolvePrendaImage(data.prendaInferior.imagenUrl)}" alt="${data.prendaInferior.nombre}">
                            </div>
                            <span class="badge">${data.prendaInferior.categoria}</span>
                            <h3>${data.prendaInferior.nombre}</h3>
                            <p>Talla ${data.prendaInferior.talla}</p>
                        </div>
                    </div>
                </aside>
            </div>
        `;
        mensaje.textContent = "Combinacion evaluada correctamente";
        mensaje.style.color = "#1f4d3a";
    } catch (error) {
        mensaje.textContent = `Error: ${error.message}`;
        mensaje.style.color = "#b42318";
        resultado.innerHTML = `<div class="empty-state">${error.message}</div>`;
    }
}

window.addEventListener("load", async () => {
    inicializarRecomendacionIa();
    await asegurarUsuarioActual();
    cargarCatalogo();
});
