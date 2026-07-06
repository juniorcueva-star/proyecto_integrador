import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  banAdminUser,
  deleteAdminProduct,
  deleteAdminUser,
  fetchAdminSellerProfile,
  fetchAdminClaims,
  fetchAdminStats,
  fetchAdminUsers,
  pauseAdminProduct,
  reactivateAdminUser,
  updateAdminClaim,
} from "../api/admin";
import { logoutRequest } from "../api/auth";
import { clearAuthSession } from "../utils/authStorage";

const adminSections = [
  { id: "resumen", label: "Resumen" },
  { id: "usuarios", label: "Usuarios" },
  { id: "reclamos", label: "Reclamos" },
];

const profileTabs = [
  { id: "resumen", label: "Resumen" },
  { id: "prendas", label: "Prendas publicadas" },
  { id: "ventas", label: "Ventas" },
  { id: "intercambiadas", label: "Intercambiadas" },
  { id: "compras", label: "Compras" },
];

function formatAdminMoney(value) {
  return `S/ ${Number(value || 0).toFixed(2)}`;
}

function formatClaimStatusLabel(status) {
  const labels = {
    PENDIENTE: "Pendiente",
    EN_REVISION: "En revisión",
    RESUELTO: "Resuelto",
    RECHAZADO: "Rechazado",
  };

  return labels[status] || status || "Pendiente";
}

function AdminDashboardPage() {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState("resumen");
  const [stats, setStats] = useState([]);
  const [claims, setClaims] = useState([]);
  const [users, setUsers] = useState([]);
  const [userSearch, setUserSearch] = useState("");
  const [claimResponses, setClaimResponses] = useState({});
  const [selectedSellerProfile, setSelectedSellerProfile] = useState(null);
  const [selectedProfileTab, setSelectedProfileTab] = useState("resumen");
  const [status, setStatus] = useState({ type: "", message: "" });

  useEffect(() => {
    let isMounted = true;

    async function loadDashboard() {
      try {
        const [data, claimsData] = await Promise.all([
          fetchAdminStats(),
          fetchAdminClaims(),
        ]);

        if (!isMounted) return;

        setStats([
          { label: "Prendas publicadas", value: String(data.prendasPublicadas) },
          { label: "Usuarios totales", value: String(data.usuariosTotales) },
          { label: "Usuarios activos", value: String(data.usuariosActivos) },
          { label: "Usuarios pausados", value: String(data.usuariosBaneados) },
          { label: "Prendas vendidas", value: String(data.prendasVendidas) },
          { label: "Reclamos resueltos", value: String(data.reclamosResueltos ?? 0) },
          { label: "Reclamos pendientes", value: String(data.reclamosPendientes ?? 0) },
        ]);
        setClaims(claimsData);
      } catch (error) {
        if (!isMounted) return;
        setStats([]);
        setClaims([]);
        setStatus({ type: "error", message: error.message });
      }
    }

    loadDashboard();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function loadUsers() {
      try {
        const data = await fetchAdminUsers(userSearch);
        if (isMounted) {
          setUsers(data);
        }
      } catch (error) {
        if (!isMounted) return;
        setUsers([]);
        setStatus({ type: "error", message: error.message });
      }
    }

    loadUsers();
    return () => {
      isMounted = false;
    };
  }, [userSearch]);

  function handleLogout() {
    logoutRequest()
      .catch(() => null)
      .finally(() => {
        clearAuthSession();
        navigate("/login", { replace: true });
      });
  }

  async function handleUserAction(id, action) {
    if (action === "eliminar") {
      const confirmed = window.confirm(
        "¿Estás seguro de eliminar este usuario? Esta acción borrará también sus prendas y datos relacionados.",
      );

      if (!confirmed) {
        return;
      }
    }

    try {
      const updated =
        action === "banear"
          ? await banAdminUser(id)
          : action === "reactivar"
            ? await reactivateAdminUser(id)
            : await deleteAdminUser(id);

      setUsers((current) =>
        action === "eliminar"
          ? current.filter((user) => user.id !== id)
          : current.map((user) => (user.id === id ? updated : user)),
      );
      setStatus({
        type: "success",
        message:
          action === "eliminar"
            ? "Usuario eliminado junto con sus prendas y datos relacionados."
            : "Usuario actualizado.",
      });
    } catch (error) {
      setStatus({ type: "error", message: error.message });
    }
  }

  async function handleViewSellerProfile(id) {
    try {
      const data = await fetchAdminSellerProfile(id);
      setSelectedSellerProfile(data);
      setSelectedProfileTab("resumen");
      setStatus({ type: "", message: "" });
    } catch (error) {
      setSelectedSellerProfile(null);
      setStatus({ type: "error", message: error.message });
    }
  }

  async function handleClaimState(id, estado) {
    try {
      const updated = await updateAdminClaim(id, {
        estado,
        respuestaAdmin: claimResponses[id] || `Estado actualizado a ${estado}`,
      });

      setClaims((current) => current.map((claim) => (claim.id === id ? updated : claim)));
      setStatus({ type: "success", message: "Reclamo actualizado." });
    } catch (error) {
      setStatus({ type: "error", message: error.message });
    }
  }

  async function handleAdminProductAction(productId, action) {
    if (action === "eliminar") {
      const confirmed = window.confirm("¿Estás seguro de eliminar esta publicación?");
      if (!confirmed) return;
    }

    try {
      if (action === "pausar") {
        const updated = await pauseAdminProduct(productId);
        setSelectedSellerProfile((current) =>
          current
            ? {
                ...current,
                prendas: current.prendas.map((product) =>
                  product.id === productId ? { ...product, ...updated } : product,
                ),
              }
            : current,
        );
        setStatus({ type: "success", message: "Publicación pausada correctamente." });
        return;
      }

      await deleteAdminProduct(productId);
      setSelectedSellerProfile((current) =>
        current
          ? {
              ...current,
              prendas: current.prendas.filter((product) => product.id !== productId),
            }
          : current,
      );
      setStatus({ type: "success", message: "Publicación eliminada correctamente." });
    } catch (error) {
      setStatus({ type: "error", message: error.message });
    }
  }

  const selectedProducts = selectedSellerProfile?.prendas || [];
  const selectedPublishedProducts = selectedProducts.filter(
    (item) => item.estadoPublicacion === "PUBLICADA",
  );
  const selectedSoldProducts = selectedProducts.filter(
    (item) => item.estadoPublicacion === "VENDIDA",
  );
  const selectedExchangedProducts = selectedProducts.filter(
    (item) => item.estadoPublicacion === "INTERCAMBIADA",
  );
  const selectedPurchases = selectedSellerProfile?.compras || [];

  return (
    <section className="admin-dashboard-shell">
      <aside className="admin-dashboard-sidebar">
        <div className="user-dashboard-brand">
          <h1>Estilo IA</h1>
          <p>Administrador</p>
        </div>

        <nav className="user-dashboard-nav" aria-label="Secciones del dashboard admin">
          {adminSections.map((section) => (
            <button
              key={section.id}
              type="button"
              className={
                section.id === activeSection ? "user-nav-item user-nav-item-active" : "user-nav-item"
              }
              onClick={() => setActiveSection(section.id)}
            >
              {section.label}
            </button>
          ))}
        </nav>

        <button type="button" className="user-logout-button" onClick={handleLogout}>
          <span>Cerrar sesión</span>
          <svg
            className="logout-icon"
            viewBox="0 0 24 24"
            aria-hidden="true"
            focusable="false"
          >
            <path d="M10 4H5.75A1.75 1.75 0 0 0 4 5.75v12.5C4 19.22 4.78 20 5.75 20H10" />
            <path d="M15 8l4 4-4 4" />
            <path d="M8.5 12H19" />
          </svg>
        </button>
      </aside>

      <div className="admin-dashboard-main">
        <header className="admin-dashboard-top">
          <div>
            <p className="section-kicker">Panel administrador</p>
            <h1>Gestion y moderacion</h1>
            <span>Usuarios, reclamos y metricas reales del marketplace.</span>
          </div>
        </header>

        {status.message ? (
          <div className={`form-message form-message-${status.type} dashboard-message`}>
            {status.message}
          </div>
        ) : null}

        {activeSection === "resumen" ? (
          <section className="dashboard-panel admin-section-panel">
            <div className="panel-head">
              <h2>Resumen general</h2>
              <span>Indicadores del backend</span>
            </div>

            <div className="dashboard-stats admin-dashboard-stats">
              {stats.map((item) => (
                <article key={item.label} className="stat-card stat-card-admin">
                  <strong>{item.value}</strong>
                  <span>{item.label}</span>
                </article>
              ))}
            </div>
          </section>
        ) : null}

        {activeSection === "usuarios" ? (
          <section className="dashboard-panel admin-section-panel">
            <div className="panel-head">
              <h2>Moderacion de usuarios</h2>
              <span>Buscar, pausar, reactivar, eliminar y revisar actividad</span>
            </div>

            <form className="module-form admin-search-form">
              <label>
                Buscar usuario
                <input
                  value={userSearch}
                  onChange={(event) => setUserSearch(event.target.value)}
                  placeholder="Nombre, email o teléfono"
                />
              </label>
            </form>

            <div className="mini-list">
              {users.map((user) => (
                <article key={user.id} className="mini-item mini-item-stack">
                  <div>
                    <strong>{user.nombre}</strong>
                    <p>
                      {user.email} - {user.estadoUsuario || "ACTIVO"}
                    </p>
                  </div>
                  <div className="mini-actions">
                    <button
                      type="button"
                      className="mini-action"
                      onClick={() => handleViewSellerProfile(user.id)}
                    >
                      Ver perfil
                    </button>
                    <button
                      type="button"
                      className="mini-action"
                      onClick={() => handleUserAction(user.id, "banear")}
                    >
                      Pausar cuenta
                    </button>
                    <button
                      type="button"
                      className="mini-action"
                      onClick={() => handleUserAction(user.id, "reactivar")}
                    >
                      Reactivar
                    </button>
                    <button
                      type="button"
                      className="mini-action mini-action-danger"
                      onClick={() => handleUserAction(user.id, "eliminar")}
                    >
                      Eliminar
                    </button>
                  </div>
                </article>
              ))}
              {users.length === 0 ? (
                <article className="mini-item">
                  <div>
                    <strong>Sin usuarios para mostrar</strong>
                    <p>No hay coincidencias o no se pudo cargar la lista.</p>
                  </div>
                  <span>0</span>
                </article>
              ) : null}
            </div>

            {selectedSellerProfile ? (
              <section className="admin-seller-profile">
                <div className="panel-head">
                  <h2>Perfil del usuario</h2>
                  <span>{selectedSellerProfile.usuario.nombre}</span>
                </div>

                <nav className="admin-profile-tabs" aria-label="Detalle del usuario">
                  {profileTabs.map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      className={
                        selectedProfileTab === tab.id
                          ? "admin-profile-tab admin-profile-tab-active"
                          : "admin-profile-tab"
                      }
                      onClick={() => setSelectedProfileTab(tab.id)}
                    >
                      {tab.label}
                    </button>
                  ))}
                </nav>

                {selectedProfileTab === "resumen" ? (
                  <div className="admin-profile-resume">
                    <div className="admin-profile-summary">
                      <article>
                        <strong>Nombre</strong>
                        <p>{selectedSellerProfile.usuario.nombre || "No registrado"}</p>
                      </article>
                      <article>
                        <strong>Correo</strong>
                        <p>{selectedSellerProfile.usuario.email || "No registrado"}</p>
                      </article>
                      <article>
                        <strong>Celular</strong>
                        <p>{selectedSellerProfile.usuario.telefono || "No registrado"}</p>
                      </article>
                    </div>

                    <div className="admin-payment-panel">
                      <div className="panel-head panel-head-compact">
                        <h3>Metodos de pago</h3>
                        <span>Solo informacion del usuario</span>
                      </div>

                      <div className="admin-profile-list">
                        {selectedSellerProfile.metodosPago.length ? (
                          selectedSellerProfile.metodosPago.map((method) => (
                            <article key={method.id} className="admin-profile-row">
                              <div>
                                <strong>{method.tipoMetodoPago || "Metodo registrado"}</strong>
                                <p>{method.numero || method.titular || "Sin detalle"}</p>
                              </div>
                              <span>{method.qrUrl ? "Con QR" : "Sin QR"}</span>
                            </article>
                          ))
                        ) : (
                          <article className="mini-item">
                            <div>
                              <strong>Sin metodos de pago</strong>
                              <p>Este usuario aun no registro metodos de pago.</p>
                            </div>
                            <span>0</span>
                          </article>
                        )}
                      </div>
                    </div>
                  </div>
                ) : null}

                {selectedProfileTab === "prendas" ? (
                  <div className="admin-profile-list">
                    {selectedPublishedProducts.length ? (
                      selectedPublishedProducts.map((product) => (
                        <article key={product.id} className="admin-profile-row">
                          <div>
                            <strong>{product.nombre || "Prenda sin nombre"}</strong>
                            <p>
                              {product.categoria || "Categoria"} - {product.talla || "Sin talla"} - {product.estadoPublicacion || "Sin estado"}
                            </p>
                          </div>
                          <div className="mini-actions">
                            <span>{formatAdminMoney(product.precio)}</span>
                            <button
                              type="button"
                              className="mini-action"
                              onClick={() => handleAdminProductAction(product.id, "pausar")}
                            >
                              Pausar publicacion
                            </button>
                            <button
                              type="button"
                              className="mini-action mini-action-danger"
                              onClick={() => handleAdminProductAction(product.id, "eliminar")}
                            >
                              Eliminar publicacion
                            </button>
                          </div>
                        </article>
                      ))
                    ) : (
                      <article className="mini-item">
                        <div>
                          <strong>Sin prendas publicadas</strong>
                          <p>Este usuario no tiene publicaciones activas por ahora.</p>
                        </div>
                        <span>0</span>
                      </article>
                    )}
                  </div>
                ) : null}

                {selectedProfileTab === "ventas" ? (
                  <div className="admin-profile-list">
                    {selectedSoldProducts.length ? (
                      selectedSoldProducts.map((product) => (
                        <article key={product.id} className="admin-profile-row">
                          <div>
                            <strong>{product.nombre || "Prenda sin nombre"}</strong>
                            <p>
                              {product.categoria || "Categoria"} - {product.talla || "Sin talla"} - {product.estadoPublicacion || "Sin estado"}
                            </p>
                          </div>
                          <span>{formatAdminMoney(product.precio)}</span>
                        </article>
                      ))
                    ) : (
                      <article className="mini-item">
                        <div>
                          <strong>Sin prendas vendidas</strong>
                          <p>Este usuario aun no registra prendas vendidas.</p>
                        </div>
                        <span>0</span>
                      </article>
                    )}
                  </div>
                ) : null}

                {selectedProfileTab === "intercambiadas" ? (
                  <div className="admin-profile-list">
                    {selectedExchangedProducts.length ? (
                      selectedExchangedProducts.map((product) => (
                        <article key={product.id} className="admin-profile-row">
                          <div>
                            <strong>{product.nombre || "Prenda sin nombre"}</strong>
                            <p>
                              {product.categoria || "Categoria"} - {product.talla || "Sin talla"} - {product.estadoPublicacion || "Sin estado"}
                            </p>
                          </div>
                          <span>{formatAdminMoney(product.precio)}</span>
                        </article>
                      ))
                    ) : (
                      <article className="mini-item">
                        <div>
                          <strong>Sin prendas intercambiadas</strong>
                          <p>Este usuario aun no registra intercambios cerrados.</p>
                        </div>
                        <span>0</span>
                      </article>
                    )}
                  </div>
                ) : null}

                {selectedProfileTab === "compras" ? (
                  <div className="admin-proof-list">
                    {selectedPurchases.length ? (
                      selectedPurchases.map((proof) => (
                        <article key={proof.id} className="admin-proof-card">
                          <div>
                            <strong>{proof.prendaNombre || "Prenda sin nombre"}</strong>
                            <p>Vendedor: {proof.vendedorNombre || proof.vendedorId || "No registrado"}</p>
                            <p>Monto: {formatAdminMoney(proof.monto)} - {proof.estado}</p>
                            <p>{proof.creadoEn ? new Date(proof.creadoEn).toLocaleString("es-PE") : ""}</p>
                          </div>
                          {proof.comprobanteUrl ? (
                            <a href={proof.comprobanteUrl} target="_blank" rel="noreferrer">
                              <img src={proof.comprobanteUrl} alt="Comprobante de compra" />
                            </a>
                          ) : null}
                        </article>
                      ))
                    ) : (
                      <article className="mini-item">
                        <div>
                          <strong>Sin compras registradas</strong>
                          <p>Este usuario aun no envio comprobantes como comprador.</p>
                        </div>
                        <span>0</span>
                      </article>
                    )}
                  </div>
                ) : null}
              </section>
            ) : null}
          </section>
        ) : null}

        {activeSection === "reclamos" ? (
          <section className="dashboard-panel admin-section-panel">
            <div className="panel-head">
              <h2>Reclamos</h2>
              <span>Revisar casos, responder y cerrar reclamos</span>
            </div>

            <div className="mini-list">
              {claims.map((claim) => (
                <article key={claim.id} className="admin-claim-card">
                  <div className="admin-claim-top">
                    <div>
                      <p className="admin-claim-code">Reclamo registrado</p>
                      <h3>{claim.motivo || "Reclamo registrado"}</h3>
                    </div>
                    <span className={`admin-claim-badge admin-claim-badge-${String(claim.estado || "PENDIENTE").toLowerCase()}`}>
                      {formatClaimStatusLabel(claim.estado)}
                    </span>
                  </div>

                  <div className="admin-claim-grid">
                    <article className="admin-claim-info">
                      <strong>Usuario</strong>
                      <p>{claim.nombreUsuarioCreador || "No registrado"}</p>
                    </article>
                    <article className="admin-claim-info">
                      <strong>Prenda vinculada</strong>
                      <p>{claim.nombrePrenda || "No especificada"}</p>
                    </article>
                    <article className="admin-claim-info">
                      <strong>Origen</strong>
                      <p>{claim.origen || "General"}</p>
                    </article>
                    <article className="admin-claim-info">
                      <strong>Comprobante</strong>
                      <p>{claim.comprobanteId || "No vinculado"}</p>
                    </article>
                  </div>

                  <div className="admin-claim-message">
                    <strong>Reclamo del usuario</strong>
                    <p>{claim.descripcion || "El usuario no agregó una descripción adicional."}</p>
                  </div>

                  <div className="admin-claim-form">
                    <label className="admin-claim-field admin-claim-field-wide">
                      <span>Respuesta del administrador</span>
                      <textarea
                        rows="4"
                        value={claimResponses[claim.id] ?? claim.respuestaAdmin ?? ""}
                        placeholder="Escribe la respuesta o solución para el usuario"
                        onChange={(event) =>
                          setClaimResponses((current) => ({
                            ...current,
                            [claim.id]: event.target.value,
                          }))
                        }
                      />
                    </label>

                    <label className="admin-claim-field">
                      <span>Estado del reclamo</span>
                      <select
                        value={claim.estado}
                        onChange={(event) => handleClaimState(claim.id, event.target.value)}
                      >
                        <option value="PENDIENTE">PENDIENTE</option>
                        <option value="EN_REVISION">EN_REVISION</option>
                        <option value="RESUELTO">RESUELTO</option>
                        <option value="RECHAZADO">RECHAZADO</option>
                      </select>
                    </label>

                    <button
                      type="button"
                      className="mini-action admin-claim-submit"
                      onClick={() => handleClaimState(claim.id, claim.estado)}
                    >
                      Enviar respuesta del admin
                    </button>
                  </div>
                </article>
              ))}
              {claims.length === 0 ? (
                <article className="mini-item">
                  <div>
                    <strong>Sin reclamos</strong>
                    <p>No hay reclamos registrados o no se pudo cargar la lista.</p>
                  </div>
                  <span>0</span>
                </article>
              ) : null}
            </div>
          </section>
        ) : null}
      </div>
    </section>
  );
}

export default AdminDashboardPage;
