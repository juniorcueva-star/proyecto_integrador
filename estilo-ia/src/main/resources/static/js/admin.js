const API = "/api";
const token = localStorage.getItem("token");
const rol = localStorage.getItem("rol");

if (!token || rol !== "ROLE_ADMIN") {
    window.location.href = "/login.html";
}

function authHeaders() {
    return {
        "Authorization": `Bearer ${token}`
    };
}

function showAdminSection(id) {
    document.querySelectorAll(".section").forEach(sec => sec.classList.remove("active"));

    const section = document.getElementById(id);

    if (section) {
        section.classList.add("active");
    }

    if (id === "dashboard") cargarDashboard();
    if (id === "usuarios") cargarUsuarios();
    if (id === "estadisticas") cargarEstadisticas();
    if (id === "reclamos") cargarReclamos();
}

function logout() {
    localStorage.clear();
    window.location.href = "/login.html";
}

async function cargarDashboard() {
    const contenedor = document.getElementById("adminResumen");

    if (!contenedor) return;

    contenedor.innerHTML = `<div class="empty-state">Cargando dashboard...</div>`;

    try {
        const res = await fetch(`${API}/admin/estadisticas`, {
            headers: authHeaders()
        });

        if (!res.ok) {
            throw new Error("No se pudieron cargar las estadísticas");
        }

        const e = await res.json();

        contenedor.innerHTML = `
            <div class="card">
                <h3>Usuarios</h3>
                <p class="price">${e.usuariosTotales}</p>
            </div>

            <div class="card">
                <h3>Usuarios activos</h3>
                <p class="price">${e.usuariosActivos}</p>
            </div>

            <div class="card">
                <h3>Prendas publicadas</h3>
                <p class="price">${e.prendasPublicadas}</p>
            </div>

            <div class="card">
                <h3>Ventas</h3>
                <p class="price">S/ ${e.dineroTotalRecaudado}</p>
            </div>

            <div class="card">
                <h3>Impacto ambiental</h3>
                <p class="price">${e.impactoAmbientalEstimadoKgCo2} kg CO₂</p>
            </div>
        `;

    } catch (error) {
        contenedor.innerHTML = `<div class="empty-state">${error.message}</div>`;
    }
}

async function cargarEstadisticas() {
    const contenedor = document.getElementById("estadisticasContenido");

    if (!contenedor) return;

    contenedor.innerHTML = `<div class="empty-state">Cargando estadísticas...</div>`;

    try {
        const res = await fetch(`${API}/admin/estadisticas`, {
            headers: authHeaders()
        });

        if (!res.ok) {
            throw new Error("No se pudieron cargar las estadísticas");
        }

        const e = await res.json();

        contenedor.innerHTML = `
            <div class="card">
                <h3>Usuarios totales</h3>
                <p class="price">${e.usuariosTotales}</p>
            </div>

            <div class="card">
                <h3>Usuarios activos</h3>
                <p class="price">${e.usuariosActivos}</p>
            </div>

            <div class="card">
                <h3>Usuarios baneados</h3>
                <p class="price">${e.usuariosBaneados}</p>
            </div>

            <div class="card">
                <h3>Prendas publicadas</h3>
                <p class="price">${e.prendasPublicadas}</p>
            </div>

            <div class="card">
                <h3>Prendas vendidas</h3>
                <p class="price">${e.prendasVendidas}</p>
            </div>

            <div class="card">
                <h3>Prendas intercambiadas</h3>
                <p class="price">${e.prendasIntercambiadas}</p>
            </div>

            <div class="card">
                <h3>Dinero recaudado</h3>
                <p class="price">S/ ${e.dineroTotalRecaudado}</p>
            </div>

            <div class="card">
                <h3>Prendas reutilizadas</h3>
                <p class="price">${e.prendasReutilizadas}</p>
            </div>

            <div class="card">
                <h3>Impacto estimado</h3>
                <p class="price">${e.impactoAmbientalEstimadoKgCo2} kg CO₂</p>
            </div>
        `;

    } catch (error) {
        contenedor.innerHTML = `<div class="empty-state">${error.message}</div>`;
    }
}

async function cargarUsuarios() {
    const contenedor = document.getElementById("usuariosLista");

    if (!contenedor) return;

    contenedor.innerHTML = `<div class="empty-state">Cargando usuarios...</div>`;

    try {
        const res = await fetch(`${API}/admin/usuarios`, {
            headers: authHeaders()
        });

        if (!res.ok) {
            throw new Error("No se pudieron cargar los usuarios");
        }

        const usuarios = await res.json();
        renderUsuarios(usuarios);

    } catch (error) {
        contenedor.innerHTML = `<div class="empty-state">${error.message}</div>`;
    }
}

async function buscarUsuarios() {
    const texto = document.getElementById("buscarUsuario").value;

    const contenedor = document.getElementById("usuariosLista");
    contenedor.innerHTML = `<div class="empty-state">Buscando usuarios...</div>`;

    try {
        const res = await fetch(`${API}/admin/usuarios/buscar?texto=${encodeURIComponent(texto)}`, {
            headers: authHeaders()
        });

        if (!res.ok) {
            throw new Error("No se pudieron buscar usuarios");
        }

        const usuarios = await res.json();
        renderUsuarios(usuarios);

    } catch (error) {
        contenedor.innerHTML = `<div class="empty-state">${error.message}</div>`;
    }
}

function renderUsuarios(usuarios) {
    const contenedor = document.getElementById("usuariosLista");

    if (!Array.isArray(usuarios) || usuarios.length === 0) {
        contenedor.innerHTML = `<div class="empty-state">No se encontraron usuarios.</div>`;
        return;
    }

    contenedor.innerHTML = `
        <table class="table">
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Nombre</th>
                    <th>Email</th>
                    <th>Rol</th>
                    <th>Estado</th>
                    <th>Eliminado</th>
                    <th>Acciones</th>
                </tr>
            </thead>

            <tbody>
                ${usuarios.map(u => `
                    <tr>
                        <td>${u.id}</td>
                        <td>${u.nombre}</td>
                        <td>${u.email}</td>
                        <td>${u.rol}</td>
                        <td>${u.estadoUsuario}</td>
                        <td>${u.eliminado ? "Sí" : "No"}</td>
                        <td>
                            <button class="btn btn-primary" onclick="verUsuario(${u.id})">Ver</button>
                            <button class="btn btn-outline" onclick="banearUsuario(${u.id})">Banear</button>
                            <button class="btn btn-outline" onclick="reactivarUsuario(${u.id})">Reactivar</button>
                            <button class="btn btn-danger" onclick="eliminarUsuario(${u.id})">Eliminar</button>
                        </td>
                    </tr>
                `).join("")}
            </tbody>
        </table>
    `;
}

async function verUsuario(id) {
    const contenedor = document.getElementById("usuarioDetalle");

    if (!contenedor) return;

    contenedor.innerHTML = `<div class="empty-state">Cargando detalle del usuario...</div>`;

    try {
        const res = await fetch(`${API}/admin/usuarios/${id}`, {
            headers: authHeaders()
        });

        if (!res.ok) {
            throw new Error("No se pudo cargar el detalle del usuario");
        }

        const d = await res.json();

        const prendas = d.prendas || [];
        const resenas = d.resenasRecibidas || [];

        contenedor.innerHTML = `
            <h2>${d.usuario.nombre}</h2>

            <div class="stat-grid">
                <div class="stat-card">
                    <strong>${d.usuario.id}</strong>
                    <span>ID usuario</span>
                </div>

                <div class="stat-card">
                    <strong>${d.usuario.estadoUsuario}</strong>
                    <span>Estado</span>
                </div>

                <div class="stat-card">
                    <strong>${d.promedioCalificacion}</strong>
                    <span>Calificación</span>
                </div>

                <div class="stat-card">
                    <strong>${d.cantidadResenas}</strong>
                    <span>Reseñas</span>
                </div>
            </div>

            <p><strong>Email:</strong> ${d.usuario.email}</p>
            <p><strong>Teléfono:</strong> ${d.usuario.telefono || "No registrado"}</p>
            <p><strong>Rol:</strong> ${d.usuario.rol}</p>
            <p><strong>Eliminado:</strong> ${d.usuario.eliminado ? "Sí" : "No"}</p>

            <h3>Prendas del usuario</h3>

            ${
                prendas.length === 0
                ? `<div class="empty-state">No tiene prendas registradas.</div>`
                : `<div class="cards-grid">
                    ${prendas.map(p => `
                        <article class="card">
                            ${p.imagenUrl ? `<img src="${p.imagenUrl}" alt="${p.nombre}">` : ""}
                            <span class="badge">${p.estadoPublicacion}</span>
                            <h3>${p.nombre}</h3>
                            <p>${p.marca} | ${p.categoria}</p>
                            <p class="price">S/ ${p.precio}</p>
                        </article>
                    `).join("")}
                </div>`
            }

            <h3>Reseñas recibidas</h3>

            ${
                resenas.length === 0
                ? `<div class="empty-state">No tiene reseñas.</div>`
                : resenas.map(r => `
                    <div class="card">
                        <p><strong>${r.nombreAutor}</strong> - ${r.calificacion} ⭐</p>
                        <p>${r.comentario}</p>
                    </div>
                `).join("")
            }
        `;

    } catch (error) {
        contenedor.innerHTML = `<div class="empty-state">${error.message}</div>`;
    }
}

async function banearUsuario(id) {
    if (!confirm("¿Seguro que deseas banear este usuario?")) return;

    await fetch(`${API}/admin/usuarios/${id}/banear`, {
        method: "PATCH",
        headers: authHeaders()
    });

    cargarUsuarios();
}

async function reactivarUsuario(id) {
    if (!confirm("¿Reactivar este usuario?")) return;

    await fetch(`${API}/admin/usuarios/${id}/reactivar`, {
        method: "PATCH",
        headers: authHeaders()
    });

    cargarUsuarios();
}

async function eliminarUsuario(id) {
    if (!confirm("¿Seguro que deseas eliminar este usuario?")) return;

    await fetch(`${API}/admin/usuarios/${id}`, {
        method: "DELETE",
        headers: authHeaders()
    });

    cargarUsuarios();
}

async function cargarReclamos() {
    const contenedor = document.getElementById("reclamosContenido");

    if (!contenedor) return;

    contenedor.innerHTML = `<div class="empty-state">Cargando reclamos...</div>`;

    try {
        const res = await fetch(`${API}/admin/reclamos`, {
            headers: authHeaders()
        });

        if (!res.ok) {
            throw new Error("No se pudieron cargar los reclamos");
        }

        const reclamos = await res.json();

        if (!Array.isArray(reclamos) || reclamos.length === 0) {
            contenedor.innerHTML = `<div class="empty-state">No hay reclamos registrados.</div>`;
            return;
        }

        contenedor.innerHTML = reclamos.map(r => `
            <article class="card">
                <span class="badge">${r.estado}</span>
                <h3>${r.motivo}</h3>

                <p><strong>Reporta:</strong> ${r.nombreUsuarioCreador}</p>
                <p><strong>Reportado:</strong> ${r.nombreUsuarioReportado}</p>
                <p><strong>Prenda:</strong> ${r.nombrePrenda}</p>
                <p><strong>Descripción:</strong> ${r.descripcion}</p>
                <p><strong>Respuesta admin:</strong> ${r.respuestaAdmin || "Sin respuesta"}</p>

                <select id="estadoReclamo-${r.id}">
                    <option value="PENDIENTE" ${r.estado === "PENDIENTE" ? "selected" : ""}>Pendiente</option>
                    <option value="EN_REVISION" ${r.estado === "EN_REVISION" ? "selected" : ""}>En revisión</option>
                    <option value="RESUELTO" ${r.estado === "RESUELTO" ? "selected" : ""}>Resuelto</option>
                    <option value="RECHAZADO" ${r.estado === "RECHAZADO" ? "selected" : ""}>Rechazado</option>
                </select>

                <textarea 
                    id="respuestaReclamo-${r.id}" 
                    placeholder="Respuesta del administrador"
                >${r.respuestaAdmin || ""}</textarea>

                <button class="btn btn-primary" onclick="actualizarReclamo(${r.id})">
                    Actualizar reclamo
                </button>
            </article>
        `).join("");

    } catch (error) {
        contenedor.innerHTML = `<div class="empty-state">${error.message}</div>`;
    }
}

async function actualizarReclamo(id) {
    const estado = document.getElementById(`estadoReclamo-${id}`).value;
    const respuestaAdmin = document.getElementById(`respuestaReclamo-${id}`).value;

    try {
        const res = await fetch(`${API}/admin/reclamos/${id}`, {
            method: "PATCH",
            headers: {
                ...authHeaders(),
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                estado,
                respuestaAdmin
            })
        });

        if (!res.ok) {
            throw new Error("No se pudo actualizar el reclamo");
        }

        alert("Reclamo actualizado correctamente");
        cargarReclamos();

    } catch (error) {
        alert(error.message);
    }
}

window.addEventListener("load", () => {
    cargarDashboard();
});